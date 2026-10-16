import crypto from 'crypto';
import axios from 'axios';

// Settings from .env. Without a token and phone number ID, replies are only printed.
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_VERSION = process.env.GRAPH_API_VERSION || 'v25.0';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

export const sendingEnabled = Boolean(TOKEN && PHONE_NUMBER_ID);
export const signatureCheckEnabled = Boolean(APP_SECRET);

// Hides long digit runs (card, account or transaction numbers) in logs: 123456789012 -> 12********12
export function maskDigits(text: string): string {
  return text.replace(/\d{8,}/g, (d) => d.slice(0, 2) + '*'.repeat(d.length - 4) + d.slice(-2));
}

// Sends a text message through the WhatsApp Cloud API.
// Never throws: a failed reply must not undo the work already saved.
export async function sendWhatsAppText(to: string, text: string): Promise<void> {
  if (!sendingEnabled) return;
  try {
    await axios.post(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text, preview_url: false },
      },
      { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 10000 }
    );
  } catch (err: any) {
    // Meta explains the problem in the response body (for example error 131047: outside the 24-hour window)
    const detail = err?.response?.data?.error ?? err?.message ?? err;
    console.error(`WhatsApp send to ${to} failed:`, JSON.stringify(detail));
  }
}

// Sends a photo by link (the link must be reachable by Meta, so PUBLIC_BASE_URL must be set when live).
// Never throws, like sendWhatsAppText.
export async function sendWhatsAppImage(to: string, link: string, caption: string): Promise<void> {
  if (!sendingEnabled) return;
  try {
    await axios.post(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: { link, caption },
      },
      { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 10000 }
    );
  } catch (err: any) {
    const detail = err?.response?.data?.error ?? err?.message ?? err;
    console.error(`WhatsApp image to ${to} failed:`, JSON.stringify(detail));
  }
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
