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
// WHATSAPP_BOT_NUMBER in .env wins; otherwise it is asked from Meta when the server starts.
// On a slow network that question can go unanswered, and without the number the pages have no
// Back to WhatsApp button, so it is asked again (up to 10 times, 5 seconds apart) until known.
export async function loadBotNumber(): Promise<string | null> {
  const set = (process.env.WHATSAPP_BOT_NUMBER ?? '').replace(/\D/g, '');
  if (set) return set;
  if (!sendingEnabled) return null;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const res = await axios.get(`https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}`, {
        params: { fields: 'display_phone_number' },
        headers: { Authorization: `Bearer ${TOKEN}` },
        timeout: 10000,
        httpsAgent: metaConnection,
      });
      const number = String(res.data?.display_phone_number ?? '').replace(/\D/g, '');
      if (!number) return null;
      process.env.WHATSAPP_BOT_NUMBER = number;
      return number;
    } catch (err: any) {
      // Meta answered with an error (wrong token ...): asking again will not help
      if (err?.response) return null;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  return null;
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

// Posts one message to the WhatsApp Cloud API. Measured on this network: opening a new
// connection to Meta often gets no answer at all (about 4 tries in 10), while a good one opens
// in about 0.02 seconds and Meta answers in about 0.3 seconds. So:
// - a connection that works is kept and used again for the next messages (keep-alive), and
//   dropped after 20 seconds unused, before the network quietly closes it;
// - a new connection that has not opened within 1.5 seconds is given up and tried again at once.
//   Nothing was sent on it, so this can never send a message twice;
// - once connected, Meta has 10 seconds to answer. Without an answer the message is tried again
//   too (rare; then the customer may get it twice, which is better than not at all).
// Up to 6 tries in all. A message Meta refused (an error in its answer) is not sent again.
// Never throws: a failed reply must not undo the work already saved (and must not stop the queue).
const TRIES = 6;
const CONNECT_WAIT = 1500;

class QuickConnectAgent extends https.Agent {
  createConnection(options: any, callback?: any): any {
    const socket = (https.Agent.prototype as any).createConnection.call(this, options, callback);
    const timer = setTimeout(() => socket.destroy(Object.assign(new Error('could not connect'), { code: 'ECONNECT' })), CONNECT_WAIT);
    socket.once('secureConnect', () => clearTimeout(timer));
    socket.once('close', () => clearTimeout(timer));
    return socket;
  }
}
const metaConnection = new QuickConnectAgent({ keepAlive: true, timeout: 20000 });

async function postNow(to: string, kind: string, message: object): Promise<void> {
  const started = Date.now();
  for (let attempt = 1; ; attempt++) {
    try {
      await axios.post(
        `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
        { messaging_product: 'whatsapp', to, ...message },
        { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 10000, httpsAgent: metaConnection }
      );
      if (attempt > 1) console.log(`WhatsApp ${kind} to ${to} sent on try ${attempt} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
      return;
    } catch (err: any) {
      if (!err?.response && attempt < TRIES) {
        // Could not connect: try again at once. Connected but no answer: wait a moment first.
        if (err?.code !== 'ECONNECT') {
          console.error(`WhatsApp ${kind} to ${to}: no answer from Meta (${err?.message}), trying again`);
          await new Promise((r) => setTimeout(r, 500));
        }
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
