import crypto from 'crypto';
import QRCode from 'qrcode';
import { prisma } from './db';

// Only normal photo types; anything else (for example SVG) is refused
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // WhatsApp's own limit for images

// Saves a photo and returns its random key, or null if it is not an allowed photo
export async function saveImage(data: Buffer, mimeType: string): Promise<string | null> {
  const type = mimeType.split(';')[0].trim().toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(type) || data.length === 0 || data.length > MAX_IMAGE_BYTES) {
    return null;
  }
  const key = crypto.randomUUID();
  await prisma.image.create({ data: { key, mimeType: type, data: new Uint8Array(data) } });
  return key;
}

export function getImage(key: string) {
  return prisma.image.findUnique({ where: { key } });
}

// Link where WhatsApp (or a browser) can fetch an image.
// Locally this is http://localhost:3000/images/<key>; live it must be the public HTTPS address.
export function imageUrl(key: string): string {
  return publicUrl(`/images/${key}`);
}

// Full address of a page on this server (photos, the shop web page)
export function publicUrl(path: string): string {
  const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${base.replace(/\/+$/, '')}${path}`;
}

// Makes a UPI QR code with the amount and note filled in, saves it and returns its key.
// Any UPI app that scans it pays the given UPI ID (the seller's own bank account).
export async function makeUpiQr(
  upiId: string,
  payeeName: string,
  amount: number,
  note: string
): Promise<string> {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note,
  });
  // UPI apps expect %20 for spaces, not +
  const link = `upi://pay?${params.toString().replace(/\+/g, '%20')}`;
  const png = await QRCode.toBuffer(link, { type: 'png', width: 512, margin: 2 });
  const key = await saveImage(png, 'image/png');
  if (!key) throw new Error('Generated QR code could not be saved');
  return key;
}
