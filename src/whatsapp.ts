import crypto from 'crypto';
import https from 'https';
import axios from 'axios';

// Settings from .env. Without a token and phone number ID, replies are only printed.
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_VERSION = process.env.GRAPH_API_VERSION || 'v25.0';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

export const sendingEnabled = Boolean(TOKEN && PHONE_NUMBER_ID);
export const signatureCheckEnabled = Boolean(APP_SECRET);

// The bot's own WhatsApp number (for wa.me links: "Back to WhatsApp", the seller's shop link).
// WHATSAPP_BOT_NUMBER in .env wins; otherwise it is asked from Meta once, when the server starts.
export async function loadBotNumber(): Promise<string | null> {
  const set = (process.env.WHATSAPP_BOT_NUMBER ?? '').replace(/\D/g, '');
  if (set) return set;
  if (!sendingEnabled) return null;
  try {
    const res = await axios.get(`https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}`, {
      params: { fields: 'display_phone_number' },
      headers: { Authorization: `Bearer ${TOKEN}` },
      timeout: 10000,
    });
    const number = String(res.data?.display_phone_number ?? '').replace(/\D/g, '');
    if (!number) return null;
    process.env.WHATSAPP_BOT_NUMBER = number;
    return number;
  } catch {
    return null;
  }
}

// Hides long digit runs (card, account or transaction numbers) in logs: 123456789012 -> 12********12
export function maskDigits(text: string): string {
  return text.replace(/\d{8,}/g, (d) => d.slice(0, 2) + '*'.repeat(d.length - 4) + d.slice(-2));
}

// Messages to one phone go out one after another, in the order they were sent: each waits until
// the one before it to that phone has finished (retry included). Without this, on a slow network
// a later message ("delivered") could reach Meta before an earlier one ("payment received").
// Messages to different phones still go out side by side.
const queues = new Map<string, Promise<void>>();

function postMessage(to: string, kind: string, message: object): Promise<void> {
  if (!sendingEnabled) return Promise.resolve();
  const next = (queues.get(to) ?? Promise.resolve()).then(() => postNow(to, kind, message));
  queues.set(to, next);
  next.finally(() => {
    if (queues.get(to) === next) queues.delete(to);
  });
  return next;
}

// Posts one message to the WhatsApp Cloud API. On this network about 1 request in 12 hangs
// (Meta never answers), while the rest answer in about 0.3 seconds. So each try waits at most
// 8 seconds, uses a new connection (an old reused one is the one most likely to hang), and a
// message with no answer is tried up to 3 times, 1 second apart. A message Meta refused (an
// error in its answer) is not sent again. Never throws: a failed reply must not undo the work
// already saved (and must not stop the queue).
const TRIES = 3;
const freshConnection = new https.Agent({ keepAlive: false });

async function postNow(to: string, kind: string, message: object): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await axios.post(
        `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
        { messaging_product: 'whatsapp', to, ...message },
        { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 8000, httpsAgent: freshConnection }
      );
      if (attempt > 1) console.log(`WhatsApp ${kind} to ${to} sent on try ${attempt}`);
      return;
    } catch (err: any) {
      if (!err?.response && attempt < TRIES) {
        console.error(`WhatsApp ${kind} to ${to}: no answer from Meta (${err?.message}), trying again`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      // Meta explains the problem in the response body (for example error 131047: outside the 24-hour window)
      const detail = err?.response?.data?.error ?? err?.message ?? err;
      console.error(`WhatsApp ${kind} to ${to} failed:`, JSON.stringify(detail));
      return;
    }
  }
}

// Sends a text message.
export async function sendWhatsAppText(to: string, text: string): Promise<void> {
  await postMessage(to, 'send', { type: 'text', text: { body: text, preview_url: false } });
}

// Sends a photo by link (the link must be reachable by Meta, so PUBLIC_BASE_URL must be set when live).
export async function sendWhatsAppImage(to: string, link: string, caption: string): Promise<void> {
  await postMessage(to, 'image', { type: 'image', image: { link, caption } });
}

// Sends a tap message (reply buttons or a list).
export async function sendWhatsAppInteractive(to: string, interactive: object): Promise<void> {
  await postMessage(to, 'interactive', { type: 'interactive', interactive });
}

// Downloads a photo a user sent (WhatsApp only gives us a media ID). Returns null on failure.
export async function downloadWhatsAppMedia(
  mediaId: string
): Promise<{ data: Buffer; mimeType: string } | null> {
  if (!sendingEnabled) return null;
  try {
    const auth = { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 10000 };
    const info = await axios.get(`https://graph.facebook.com/${API_VERSION}/${mediaId}`, auth);
    const file = await axios.get(info.data.url, {
      ...auth,
      responseType: 'arraybuffer',
      maxContentLength: 5 * 1024 * 1024,
    });
    return { data: Buffer.from(file.data), mimeType: info.data.mime_type };
  } catch (err: any) {
    const detail = err?.response?.data?.error ?? err?.message ?? err;
    console.error(`WhatsApp media download ${mediaId} failed:`, JSON.stringify(detail));
    return null;
  }
}

// Checks that a webhook call really comes from Meta (header X-Hub-Signature-256).
// When no app secret is set (local testing), every call is accepted.
export function validSignature(rawBody: Buffer | undefined, header: string | undefined): boolean {
  if (!APP_SECRET) return true;
  if (!rawBody || !header || !header.startsWith('sha256=')) return false;

  const expected = crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex');
  const given = header.slice('sha256='.length);
  if (given.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given, 'utf8'), Buffer.from(expected, 'utf8'));
}
