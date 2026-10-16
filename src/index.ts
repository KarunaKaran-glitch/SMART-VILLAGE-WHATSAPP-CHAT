import 'dotenv/config';
import express, { Request, Response } from 'express';
import { prisma } from './db';
import { LANGUAGES, WELCOME, languageMenu, t } from './messages';
import { ot } from './orderText';
import { SELLER_TEXT } from './sellerText';
import { ct } from './cartEditText';
import { mo } from './myOrdersText';
import { ad } from './addressText';
import { cn, sellerAdminCancelNotice, sellerCancelNotice } from './cancelText';
import { REG_TEXT } from './registerText';
import { st } from './stockText';
import { pay } from './payText';
import { uf } from './upiFlowText';
import { ACTIVE_PAYMENT_METHOD } from './paymentConfig';
import {
  downloadWhatsAppMedia,
  maskDigits,
  sendWhatsAppImage,
  sendWhatsAppText,
  sendingEnabled,
  signatureCheckEnabled,
  validSignature,
} from './whatsapp';
import { getImage, imageUrl, makeUpiQr, saveImage } from './images';

const app = express();
// Keep the raw request body: the Meta signature is calculated over the exact bytes.
// The larger limit is for test photos sent with Send-Img (real WhatsApp only sends a media ID).
app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Prints the reply (long numbers hidden) and, when WhatsApp is set up in .env, sends it
async function sendReply(to: string, text: string) {
  console.log(`>> Reply to ${to}:\n${maskDigits(text)}\n`);
  await sendWhatsAppText(to, text);
}

// Same for a photo: prints its link (open it in a browser to see it) and sends it when live
async function sendImage(to: string, key: string, caption: string) {
  const link = imageUrl(key);
  console.log(`>> Image to ${to}: ${link}\n${maskDigits(caption)}\n`);
  await sendWhatsAppImage(to, link, caption);
}

// Reads the photo in an incoming message and saves it. Returns the image key, or null.
// Live, WhatsApp only sends a media ID, so the photo is downloaded from Meta.
// For local tests (sending switched off), Send-Img puts the photo itself in "test_data".
async function saveIncomingImage(message: any): Promise<string | null> {
  if (message?.type !== 'image' || !message.image) return null;

  let photo: { data: Buffer; mimeType: string } | null = null;
  if (sendingEnabled) {
    if (message.image.id) photo = await downloadWhatsAppMedia(String(message.image.id));
  } else if (typeof message.image.test_data === 'string') {
    photo = {
      data: Buffer.from(message.image.test_data, 'base64'),
      mimeType: String(message.image.mime_type ?? ''),
    };
  }
  return photo ? saveImage(photo.data, photo.mimeType) : null;
}
// At most 20 messages per phone per minute; extra messages are ignored without a reply
const RATE_LIMIT = 20;
const recentMessages = new Map<string, number[]>();

function tooManyMessages(phone: string): boolean {
  const now = Date.now();
  const times = (recentMessages.get(phone) ?? []).filter((t) => now - t < 60_000);
  times.push(now);
  recentMessages.set(phone, times);
  return times.length > RATE_LIMIT;
}

// Message IDs are only needed while Meta might resend them; delete those older than 7 days
async function cleanupProcessedMessages() {
  try {
    const removed = await prisma.processedMessage.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });
    if (removed.count > 0) console.log(`Removed ${removed.count} old message IDs`);
  } catch (err) {
    console.error('Message ID cleanup failed:', err);
  }
  recentMessages.clear();
}

type Named = { name: string; translations: { language: string; name: string }[] };

// Picks the product name in the customer's language, or the default name
function localName(product: Named, language: string): string {
  const tr = product.translations.find((x) => x.language === language);
  return tr ? tr.name : product.name;
}

function loadProducts() {
  return prisma.product.findMany({
    where: {
      isActive: true,
      approval: 'APPROVED', // checked by the admin: handmade only
      imageKey: { not: null }, // every product on the menu has a photo
      OR: [{ stock: null }, { stock: { gt: 0 } }],
    },
    include: { translations: true },
    orderBy: { id: 'asc' },
  });
}

async function productList(language: string): Promise<string> {
  const T = t(language);
  const products = await loadProducts();
  if (products.length === 0) return 'No products yet.';

  const lines = products.map(
    (p, i) => `${i + 1}. ${localName(p, language)} - ₹${p.price}`
  );
  return `${T.productsTitle}\n${lines.join('\n')}\n\n${T.productsHint}`;
}

async function cartText(userId: number, language: string): Promise<string> {
  const T = t(language);
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: {
      items: {
        include: { product: { include: { translations: true } } },
        orderBy: { id: 'asc' },
      },
    },
  });
  if (!cart || cart.items.length === 0) return T.emptyCart;

  let total = 0;
  const lines = cart.items.map((item, i) => {
    const lineTotal = Number(item.product.price) * item.quantity;
    total += lineTotal;
    return `${i + 1}. ${localName(item.product, language)} x ${item.quantity} - ₹${lineTotal}`;
  });
  return `${T.cartTitle}\n${lines.join('\n')}\n${T.cartTotal}: ₹${total}\n\n${ct(language).hint}`;
}

// REMOVE n: removes line n of the cart (same numbering as the CART message)
async function removeFromCart(userId: number, language: string, line: number): Promise<string> {
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  if (!cart || cart.items.length === 0) return t(language).emptyCart;

  const item = cart.items[line - 1];
  if (!item) return ct(language).invalidLine;

  await prisma.cartItem.delete({ where: { id: item.id } });
  return `${ct(language).removed}\n\n${await cartText(userId, language)}`;
}

// CLEAR: empties the cart
async function clearCart(userId: number, language: string): Promise<string> {
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: { items: true },
  });
  if (!cart || cart.items.length === 0) return t(language).emptyCart;

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return ct(language).cleared;
}

// Customer's last 5 orders with status and payment
async function customerOrders(userId: number, language: string): Promise<string> {
  const M = mo(language);
  const orders = await prisma.order.findMany({
    where: { customerId: userId },
    include: {
      items: { include: { product: { include: { translations: true } } } },
      payments: { orderBy: { id: 'desc' }, take: 1 },
    },
    orderBy: { id: 'desc' },
    take: 5,
  });
  if (orders.length === 0) return M.none;

  const blocks = orders.map((o) => {
    const items = o.items
      .map((i) => `  ${localName(i.product, language)} x ${i.quantity}`)
      .join('\n');
    const payLine = o.payments[0]
      ? `\n  ${M.pay(o.payments[0].status, o.payments[0].method)}`
      : '';
    return `#${o.id} - ${M.status(o.status)} - ₹${o.total}\n${items}${payLine}`;
  });
  return `${M.title}\n\n${blocks.join('\n\n')}`;
}

// Customer cancels an order, only while every item is still PENDING
async function cancelOrder(userId: number, language: string, orderId: number): Promise<string> {
  const C = cn(language);

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: { items: { include: { seller: true } }, payments: true },
  });
  if (!order) return C.notFound(orderId);

  const allPending = order.items.every((i) => i.status === 'PENDING');
  if (order.status !== 'PENDING' || !allPending) return C.cannot(orderId);

  // Once the customer has reported a UPI payment, the seller must answer first
  const paymentStarted = order.payments.some(
    (p) => p.status === 'AWAITING_CONFIRMATION' || p.status === 'SUCCESS'
  );
  if (paymentStarted) return C.cannot(orderId);

  await prisma.$transaction([
    prisma.orderItem.updateMany({ where: { orderId }, data: { status: 'CANCELLED' } }),
    prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } }),
    prisma.payment.updateMany({
      where: { orderId, status: 'INITIATED' },
      data: { status: 'CANCELLED' },
    }),
    // Put the quantities back into stock (only for products that track stock)
    ...order.items.map((i) =>
      prisma.product.updateMany({
        where: { id: i.productId, stock: { not: null } },
        data: { stock: { increment: i.quantity } },
      })
    ),
  ]);

  // Tell each seller. A failure here must not undo the cancellation.
  try {
    const sellerPhones = new Set(order.items.map((i) => i.seller.phone));
    for (const sellerPhone of sellerPhones) {
      await sendReply(sellerPhone, sellerCancelNotice(orderId));
    }
  } catch (err) {
    console.error('Seller cancel notice failed:', err);
  }

  return C.cancelled(orderId);
}

// PAID n ref: the customer reports a UPI payment; the seller is asked to check it
async function reportPaid(
  userId: number,
  language: string,
  orderId: number,
  rawRef: string
): Promise<string> {
  const U = uf(language);

  // UPI transaction numbers are usually 12 digits; allow 8 to 24 letters or digits
  const ref = rawRef.toUpperCase();
  if (!/^[A-Z0-9]{8,24}$/.test(ref)) return U.invalidRef;

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: {
      items: { include: { seller: true } },
      payments: { orderBy: { id: 'desc' }, take: 1 },
    },
  });
  if (!order) return U.notFound(orderId);

  const payment = order.payments[0];
  if (
    !payment ||
    order.status === 'CANCELLED' ||
    payment.method !== 'UPI_DIRECT' ||
    (payment.status !== 'INITIATED' && payment.status !== 'AWAITING_CONFIRMATION')
  ) {
    return U.nothingToPay(orderId);
  }

  // The same transaction number cannot pay for two orders
  const usedElsewhere = await prisma.payment.findFirst({
    where: { reference: ref, id: { not: payment.id } },
  });
  if (usedElsewhere) return U.refUsed;

  try {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'AWAITING_CONFIRMATION', reference: ref },
    });
  } catch (err: any) {
    // Another message saved the same number at the same moment
    if (err?.code === 'P2002') return U.refUsed;
    throw err;
  }

  // Tell the seller. A failure here must not undo the report.
  try {
    const sellerPhones = new Set(order.items.map((i) => i.seller.phone));
    for (const sellerPhone of sellerPhones) {
      await sendReply(
        sellerPhone,
        SELLER_TEXT.paymentReported(orderId, Number(payment.amount), ref)
      );
    }
  } catch (err) {
    console.error('Seller payment notice failed:', err);
  }

  return U.paidThanks(orderId);
}

// RECEIVED n / NOTRECEIVED n: the seller answers a reported UPI payment
async function decidePayment(
  sellerId: number,
  orderId: number,
  received: boolean
): Promise<string> {
  // Only this seller's own orders
  const mine = await prisma.orderItem.count({ where: { orderId, sellerId } });
  if (mine === 0) return SELLER_TEXT.orderNotFound(orderId);

  const payment = await prisma.payment.findFirst({
    where: { orderId },
    orderBy: { id: 'desc' },
  });
  if (!payment || payment.method !== 'UPI_DIRECT' || payment.status !== 'AWAITING_CONFIRMATION') {
    return SELLER_TEXT.noPaymentWaiting(orderId);
  }

  if (received) {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS' } }),
      prisma.order.updateMany({
        where: { id: orderId, status: 'PENDING' },
        data: { status: 'PAID' },
      }),
      prisma.orderItem.updateMany({
        where: { orderId, status: 'PENDING' },
        data: { status: 'PAID' },
      }),
    ]);
  } else {
    // Back to waiting; the customer can send PAID again with the right number
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'INITIATED', reference: null },
    });
  }

  // Tell the customer. A failure here must not undo the decision.
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (order) {
      const U = uf(order.customer.language);
      await sendReply(
        order.customer.phone,
        received ? U.received(orderId) : U.notReceived(orderId)
      );
    }
  } catch (err) {
    console.error('Customer payment notice failed:', err);
  }

  return received ? SELLER_TEXT.receivedDone(orderId) : SELLER_TEXT.notReceivedDone(orderId);
}

// Thrown when a product has too little stock (or was hidden) while placing an order
class StockError extends Error {
  productId: number;
  constructor(productId: number) {
    super('Not enough stock');
    this.productId = productId;
  }
}

// Turns the cart into one order per seller (each with a payment), empties the cart,
// and tells each seller
async function placeOrder(userId: number, language: string, address: string): Promise<string> {
  const T = t(language);
  const P = pay(language);
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: { items: { include: { product: { include: { seller: true } } } } },
  });
  if (!cart || cart.items.length === 0) return T.emptyCart;

  // Group the cart by seller: one order per seller
  const groups = new Map<number, typeof cart.items>();
  for (const item of cart.items) {
    const list = groups.get(item.product.sellerId) ?? [];
    list.push(item);
    groups.set(item.product.sellerId, list);
  }

  // With UPI, every seller must have a UPI ID so the customer can pay them
  if (ACTIVE_PAYMENT_METHOD === 'UPI_DIRECT') {
    for (const items of groups.values()) {
      const seller = items[0].product.seller;
      if (!seller.upiId) return P.noUpi(seller.shopName ?? 'seller');
    }
  }

  type Placed = {
    orderId: number;
    sellerPhone: string;
    shop: string;
    upiId: string | null;
    total: number;
    lines: string[];
  };

  let placed: Placed[] = [];
  try {
    placed = await prisma.$transaction(async (tx) => {
      // Check and take stock first (all or nothing)
      for (const item of cart.items) {
        if (!item.product.isActive || item.product.approval !== 'APPROVED') {
          throw new StockError(item.productId);
        }
        if (item.product.stock !== null) {
          const taken = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (taken.count === 0) throw new StockError(item.productId);
        }
      }

      const results: Placed[] = [];
      for (const items of groups.values()) {
        const seller = items[0].product.seller;
        const total = items.reduce(
          (sum, i) => sum + Number(i.product.price) * i.quantity,
          0
        );
        const created = await tx.order.create({
          data: {
            customerId: userId,
            total,
            deliveryAddress: address,
            items: {
              create: items.map((i) => ({
                productId: i.productId,
                sellerId: i.product.sellerId,
                quantity: i.quantity,
                unitPrice: i.product.price,
              })),
            },
          },
        });
        await tx.payment.create({
          data: { orderId: created.id, amount: total, method: ACTIVE_PAYMENT_METHOD },
        });
        results.push({
          orderId: created.id,
          sellerPhone: seller.phone,
          shop: seller.shopName ?? seller.phone,
          upiId: seller.upiId,
          total,
          lines: items.map(
            (i) => `${i.product.name} x ${i.quantity} = ₹${Number(i.product.price) * i.quantity}`
          ),
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return results;
    });
  } catch (err) {
    if (err instanceof StockError) {
      const p = await prisma.product.findUnique({
        where: { id: err.productId },
        include: { translations: true },
      });
      if (!p) return T.invalidProduct;
      const label = localName(p, language);
      const left = p.isActive && p.approval === 'APPROVED' ? (p.stock ?? 0) : 0;
      return left > 0 ? st(language).notEnough(label, left) : st(language).unavailable(label);
    }
    throw err;
  }

  // Tell each seller. A failure here must not break the order.
  try {
    const customer = await prisma.user.findUnique({ where: { id: userId } });
    const customerLabel = `${customer?.name ?? 'Customer'} (${customer?.phone})\nDeliver to: ${address}`;
    for (const p of placed) {
      const note =
        ACTIVE_PAYMENT_METHOD === 'UPI_DIRECT'
          ? 'Payment: by UPI. Wait for the customer to confirm, then check your bank app.'
          : 'Payment: cash on delivery.';
      await sendReply(
        p.sellerPhone,
        SELLER_TEXT.newOrder(p.orderId, [...p.lines, note], customerLabel)
      );
    }
  } catch (err) {
    console.error('Seller notification failed:', err);
  }

  // Tell the customer how to pay
  if (ACTIVE_PAYMENT_METHOD === 'UPI_DIRECT') {
    const blocks = placed.map((p) => P.block(p.orderId, p.shop, p.total, p.upiId ?? ''));
    return `${P.header}\n\n${blocks.join('\n\n')}\n\n${P.footer}\n${uf(language).qrHint}`;
  }
  return placed.map((p) => ot(language).placed(p.orderId, p.total)).join('\n\n');
}

// Seller moves an order forward: CONFIRM, then SHIP, then DELIVER
const STATUS_FLOW: Record<string, { to: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED'; from: string[] }> = {
  CONFIRM: { to: 'CONFIRMED', from: ['PENDING', 'PAID'] },
  SHIP: { to: 'SHIPPED', from: ['CONFIRMED'] },
  DELIVER: { to: 'DELIVERED', from: ['SHIPPED'] },
};

async function updateOrderStatus(
  sellerId: number,
  orderId: number,
  action: string
): Promise<string> {
  const rule = STATUS_FLOW[action];

  // Only this seller's own items in this order
  const items = await prisma.orderItem.findMany({ where: { orderId, sellerId } });
  if (items.length === 0) return SELLER_TEXT.orderNotFound(orderId);

  // UPI orders can only be confirmed after the seller has received the money
  if (action === 'CONFIRM') {
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      orderBy: { id: 'desc' },
    });
    if (payment?.method === 'UPI_DIRECT' && payment.status !== 'SUCCESS') {
      return SELLER_TEXT.needPayment(orderId);
    }
  }

  const allowed = items.filter((i) => rule.from.includes(i.status));
  if (allowed.length === 0) {
    return SELLER_TEXT.cannotChange(orderId, items[0].status, rule.to);
  }

  await prisma.orderItem.updateMany({
    where: { id: { in: allowed.map((i) => i.id) } },
    data: { status: rule.to },
  });

  // If every item in the order now has this status, update the order itself too
  const all = await prisma.orderItem.findMany({ where: { orderId } });
  if (all.every((i) => i.status === rule.to)) {
    await prisma.order.update({ where: { id: orderId }, data: { status: rule.to } });

    // Cash on delivery: delivery means the cash was collected
    if (rule.to === 'DELIVERED') {
      await prisma.payment.updateMany({
        where: { orderId, method: 'COD', status: 'INITIATED' },
        data: { status: 'SUCCESS' },
      });
    }
  }

  // Tell the customer. A failure here must not break the update.
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (order) {
      await sendReply(
        order.customer.phone,
        ot(order.customer.language).status(orderId, rule.to)
      );
    }
  } catch (err) {
    console.error('Customer notification failed:', err);
  }

  return SELLER_TEXT.statusUpdated(orderId, rule.to);
}

// Admin approves or rejects a seller request
async function decideSeller(applicantId: number, approve: boolean): Promise<string> {
  const applicant = await prisma.user.findUnique({ where: { id: applicantId } });
  if (!applicant || applicant.sellerStatus !== 'PENDING') {
    return REG_TEXT.notPending(applicantId);
  }

  if (approve) {
    await prisma.user.update({
      where: { id: applicantId },
      data: { sellerStatus: 'APPROVED', role: 'SELLER' },
    });
  } else {
    await prisma.user.update({
      where: { id: applicantId },
      data: { sellerStatus: 'REJECTED' },
    });
  }

  // Tell the applicant. A failure here must not undo the decision.
  try {
    await sendReply(
      applicant.phone,
      approve
        ? REG_TEXT.approvedNotice(applicant.shopName ?? 'your shop')
        : REG_TEXT.rejectedNotice
    );
  } catch (err) {
    console.error('Applicant notification failed:', err);
  }

  return REG_TEXT.decided(applicantId, approve ? 'APPROVED' : 'REJECTED');
}

// Admin blocks a seller: the seller role is removed and all their products are hidden
async function blockSeller(sellerId: number): Promise<string> {
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role !== 'SELLER') return REG_TEXT.notSeller(sellerId);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: sellerId },
      data: {
        role: 'CUSTOMER',
        sellerStatus: 'BLOCKED',
        state: 'BROWSING',
        pendingProductName: null,
      },
    }),
    prisma.product.updateMany({ where: { sellerId }, data: { isActive: false } }),
  ]);

  // Orders already placed stay as they are, so count the ones still open
  const open = await prisma.orderItem.count({
    where: { sellerId, status: { in: ['PENDING', 'CONFIRMED', 'SHIPPED'] } },
  });

  try {
    await sendReply(seller.phone, REG_TEXT.blockedNotice);
  } catch (err) {
    console.error('Seller notification failed:', err);
  }

  return REG_TEXT.blocked(sellerId, open);
}

// Admin allows a blocked seller again (products stay hidden)
async function unblockSeller(sellerId: number): Promise<string> {
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.sellerStatus !== 'BLOCKED') return REG_TEXT.notBlocked(sellerId);

  await prisma.user.update({
    where: { id: sellerId },
    data: { role: 'SELLER', sellerStatus: 'APPROVED' },
  });

  try {
    await sendReply(seller.phone, REG_TEXT.unblockedNotice);
  } catch (err) {
    console.error('Seller notification failed:', err);
  }

  return REG_TEXT.unblocked(sellerId);
}

// OPENORDERS n: orders with items of seller n that are not delivered or cancelled yet
async function openOrders(sellerId: number): Promise<string> {
  const items = await prisma.orderItem.findMany({
    where: { sellerId, status: { in: ['PENDING', 'PAID', 'CONFIRMED', 'SHIPPED'] } },
    include: {
      order: {
        include: { customer: true, payments: { orderBy: { id: 'desc' }, take: 1 } },
      },
      product: true,
    },
    orderBy: { orderId: 'asc' },
  });
  if (items.length === 0) return REG_TEXT.noOpenOrders(sellerId);

  // One block per order
  const byOrder = new Map<number, typeof items>();
  for (const it of items) {
    const list = byOrder.get(it.orderId) ?? [];
    list.push(it);
    byOrder.set(it.orderId, list);
  }
  const blocks = [...byOrder.values()].map((list) => {
    const o = list[0].order;
    const lines = list.map((it) => `  ${it.product.name} x ${it.quantity} | ${it.status}`).join('\n');
    const payment = o.payments[0] ? ` | payment ${o.payments[0].status}` : '';
    const who = o.customer.name ?? o.customer.phone;
    return `#${o.id} - ₹${o.total}${payment} | ${who} (${o.customer.phone})\n${lines}`;
  });
  return `${REG_TEXT.openOrdersTitle(sellerId)}\n${blocks.join('\n')}\n\nSend ADMINCANCEL <order> to cancel one.`;
}

// ADMINCANCEL n: the admin cancels any order that is not delivered yet
async function adminCancelOrder(orderId: number): Promise<string> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { seller: true } }, customer: true, payments: true },
  });
  if (!order) return REG_TEXT.orderMissing(orderId);
  if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
    return REG_TEXT.cannotAdminCancel(orderId, order.status);
  }

  const openItems = order.items.filter(
    (i) => i.status !== 'DELIVERED' && i.status !== 'CANCELLED'
  );
  // Money that already reached the seller must be refunded outside the bot
  const paid = order.payments.find((p) => p.status === 'SUCCESS');

  await prisma.$transaction([
    prisma.orderItem.updateMany({
      where: { orderId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
      data: { status: 'CANCELLED' },
    }),
    prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } }),
    prisma.payment.updateMany({
      where: { orderId, status: { in: ['INITIATED', 'AWAITING_CONFIRMATION'] } },
      data: { status: 'CANCELLED' },
    }),
    // Put the quantities back into stock (only for products that track stock)
    ...openItems.map((i) =>
      prisma.product.updateMany({
        where: { id: i.productId, stock: { not: null } },
        data: { stock: { increment: i.quantity } },
      })
    ),
  ]);

  // Tell the customer and the sellers. A failure here must not undo the cancellation.
  try {
    const C = cn(order.customer.language);
    await sendReply(order.customer.phone, paid ? C.byAdminPaid(orderId) : C.byAdmin(orderId));
    const sellerPhones = new Set(openItems.map((i) => i.seller.phone));
    for (const sellerPhone of sellerPhones) {
      await sendReply(sellerPhone, sellerAdminCancelNotice(orderId, !!paid));
    }
  } catch (err) {
    console.error('Admin cancel notice failed:', err);
  }

  return paid
    ? REG_TEXT.adminCancelledPaid(orderId, Number(paid.amount))
    : REG_TEXT.adminCancelled(orderId);
}

// MAKEADMIN phone: gives an existing customer the admin role
async function makeAdmin(rawPhone: string): Promise<string> {
  // A 10-digit Indian number is stored with the 91 country code, like WhatsApp sends it
  const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

  const target = await prisma.user.findUnique({ where: { phone } });
  if (!target) return REG_TEXT.userNotFound(phone);
  if (target.role === 'ADMIN') return REG_TEXT.alreadyAdmin(phone);
  if (
    target.role === 'SELLER' ||
    (target.sellerStatus !== 'NONE' && target.sellerStatus !== 'REJECTED')
  ) {
    return REG_TEXT.cannotMakeAdmin(phone);
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { role: 'ADMIN', state: 'BROWSING', pendingProductId: null },
  });

  try {
    await sendReply(phone, REG_TEXT.newAdminNotice);
  } catch (err) {
    console.error('New admin notice failed:', err);
  }

  return REG_TEXT.madeAdmin(phone);
}

// QR n: sends the customer a QR code to pay order n.
// The seller's own QR photo if they uploaded one, otherwise a QR made from their UPI ID
// with the amount and note filled in. Either way the money goes straight to the seller.
// Returns a text reply only when there is no QR to send.
async function sendPaymentQr(
  userId: number,
  phone: string,
  language: string,
  orderId: number
): Promise<string | null> {
  const U = uf(language);
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: {
      items: { include: { seller: true }, take: 1 },
      payments: { orderBy: { id: 'desc' }, take: 1 },
    },
  });
  if (!order) return U.notFound(orderId);

  const payment = order.payments[0];
  const seller = order.items[0]?.seller;
  if (
    !payment ||
    !seller ||
    order.status === 'CANCELLED' ||
    payment.method !== 'UPI_DIRECT' ||
    payment.status !== 'INITIATED'
  ) {
    return U.nothingToPay(orderId);
  }

  const shop = seller.shopName ?? seller.phone;
  const total = Number(payment.amount);

  if (seller.upiQrKey && (await getImage(seller.upiQrKey))) {
    await sendImage(phone, seller.upiQrKey, U.qrSellerCaption(orderId, shop, total));
    return null;
  }
  if (!seller.upiId) return U.nothingToPay(orderId);

  const key = await makeUpiQr(seller.upiId, shop, total, `Order ${orderId}`);
  await sendImage(phone, key, U.qrAutoCaption(orderId, shop, total));
  return null;
}

// PENDINGPRODUCTS: sends the admin the photo of every product waiting for approval
async function pendingProducts(adminPhone: string): Promise<string> {
  const waiting = await prisma.product.findMany({
    where: { approval: 'PENDING', imageKey: { not: null } },
    include: { seller: true },
    orderBy: { id: 'asc' },
    take: 10,
  });
  if (waiting.length === 0) return REG_TEXT.noPendingProducts;

  for (const p of waiting) {
    await sendImage(
      adminPhone,
      p.imageKey!,
      REG_TEXT.adminProductNotice(p.id, p.name, Number(p.price), p.seller.shopName ?? p.seller.phone)
    );
  }
  return REG_TEXT.pendingProductsSent(waiting.length);
}

// APPROVEPRODUCT n / REJECTPRODUCT n
async function decideProduct(productId: number, approve: boolean): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: true },
  });
  if (!product) return REG_TEXT.productNotFound(productId);
  if (approve && !product.imageKey) return REG_TEXT.productNoPhoto(productId);

  await prisma.product.update({
    where: { id: productId },
    data: { approval: approve ? 'APPROVED' : 'REJECTED' },
  });

  // Tell the seller. A failure here must not undo the decision.
  try {
    await sendReply(
      product.seller.phone,
      approve
        ? SELLER_TEXT.productApproved(productId, product.name)
        : SELLER_TEXT.productRejected(productId, product.name)
    );
  } catch (err) {
    console.error('Seller product notice failed:', err);
  }

  return REG_TEXT.productDecided(productId, approve ? 'APPROVED' : 'REJECTED');
}

// Sends every admin the photo of a product that needs checking
async function notifyAdminsOfProduct(productId: number) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });
    if (!product?.imageKey) return;
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const a of admins) {
      await sendImage(
        a.phone,
        product.imageKey,
        REG_TEXT.adminProductNotice(
          product.id,
          product.name,
          Number(product.price),
          product.seller.shopName ?? product.seller.phone
        )
      );
    }
  } catch (err) {
    console.error('Admin product notice failed:', err);
  }
}

// Totals for the whole marketplace
async function salesReport(): Promise<string> {
  const [orders, delivered, cancelled, cash, sellers, customers] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
    prisma.user.count({ where: { role: 'SELLER' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
  ]);
  const open = orders - delivered - cancelled;

  const deliveredItems = await prisma.orderItem.findMany({
    where: { status: 'DELIVERED' },
    include: { seller: true },
  });
  const bySeller = new Map<number, { label: string; amount: number }>();
  for (const it of deliveredItems) {
    const row = bySeller.get(it.sellerId) ?? {
      label: it.seller.shopName ?? it.seller.phone,
      amount: 0,
    };
    row.amount += Number(it.unitPrice) * it.quantity;
    bySeller.set(it.sellerId, row);
  }
  const sellerLines = [...bySeller.entries()].map(
    ([id, r]) => `#${id} ${r.label}: ₹${r.amount}`
  );

  return [
    'Marketplace summary:',
    `Orders: ${orders} (open ${open}, delivered ${delivered}, cancelled ${cancelled})`,
    `Payments received (UPI and cash): ₹${Number(cash._sum.amount ?? 0)}`,
    `Sellers: ${sellers}, customers: ${customers}`,
    sellerLines.length > 0
      ? `Delivered sales per seller:\n${sellerLines.join('\n')}`
      : 'No delivered sales yet.',
  ].join('\n');
}

app.get('/', (_req: Request, res: Response) => {
  res.send('WhatsApp Marketplace server is running');
});

// Product photos and QR codes. WhatsApp fetches them from here when we send an image.
app.get('/images/:key', async (req: Request, res: Response) => {
  const key = String(req.params.key);
  if (!/^[0-9a-f-]{36}$/.test(key)) {
    res.sendStatus(404);
    return;
  }
  const image = await getImage(key);
  if (!image) {
    res.sendStatus(404);
    return;
  }
  res.set('Content-Type', image.mimeType);
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(Buffer.from(image.data));
});

// Meta calls this once to verify your webhook
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(String(challenge));
  }
  res.sendStatus(403);
});

// Handles one incoming webhook call
async function handleWebhook(body: any) {
  let messageId: string | undefined;

  try {
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message) return; // not a message (for example a delivery status)

    // Ignore a message we have already handled (Meta can send the same one twice)
    messageId = message.id;
    if (messageId) {
      const saved = await prisma.processedMessage.createMany({
        data: [{ id: messageId }],
        skipDuplicates: true,
      });
      if (saved.count === 0) {
        console.log('Duplicate message ignored:', messageId);
        return;
      }
    }

    const phone: string = message.from;
    const name: string | undefined = value?.contacts?.[0]?.profile?.name;
    const text: string = (message.text?.body ?? '').trim();
    const command = text.toUpperCase();

    if (tooManyMessages(phone)) {
      console.log('Too many messages, ignored:', phone);
      return;
    }

    console.log('Message from:', phone, '| text:', maskDigits(text));

    const user = await prisma.user.findUnique({ where: { phone } });

    // New customer: save them and ask for a language
    if (!user) {
      await prisma.user.create({ data: { phone, name } });
      await sendReply(phone, languageMenu());
      return;
    }

    const T = t(user.language);

    // LANG works in every state
    if (command === 'LANG') {
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'CHOOSING_LANGUAGE', pendingProductId: null },
      });
      await sendReply(phone, languageMenu());
      return;
    }

    // ---- Seller commands (only for users with the SELLER role) ----
    if (user.role === 'SELLER') {
      // Waiting for the product name
      if (user.state === 'ADDING_PRODUCT_NAME') {
        if (command === 'CANCEL') {
          await prisma.user.update({
            where: { id: user.id },
            data: { state: 'BROWSING', pendingProductName: null },
          });
          await sendReply(phone, SELLER_TEXT.cancelled);
          return;
        }
        if (text.length < 2 || text.length > 60) {
          await sendReply(phone, SELLER_TEXT.invalidName);
          return;
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'ADDING_PRODUCT_PRICE', pendingProductName: text },
        });
        await sendReply(phone, SELLER_TEXT.askPrice(text));
        return;
      }

      // Waiting for the product price
      if (user.state === 'ADDING_PRODUCT_PRICE') {
        if (command === 'CANCEL') {
          await prisma.user.update({
            where: { id: user.id },
            data: { state: 'BROWSING', pendingProductName: null },
          });
          await sendReply(phone, SELLER_TEXT.cancelled);
          return;
        }

        const price = Math.round(Number(text) * 100) / 100;
        if (!Number.isFinite(price) || price <= 0 || price > 100000) {
          await sendReply(phone, SELLER_TEXT.invalidPrice);
          return;
        }

        const productName = user.pendingProductName;
        if (!productName) {
          await prisma.user.update({
            where: { id: user.id },
            data: { state: 'BROWSING', pendingProductName: null },
          });
          await sendReply(phone, SELLER_TEXT.cancelled);
          return;
        }

        const product = await prisma.product.create({
          data: {
            name: productName,
            price,
            sellerId: user.id,
            translations: { create: [{ language: user.language, name: productName }] },
          },
        });

        // Next step: the photo (the product stays hidden until it has one and is approved)
        await prisma.user.update({
          where: { id: user.id },
          data: {
            state: 'ADDING_PRODUCT_PHOTO',
            pendingProductName: null,
            pendingProductId: product.id,
          },
        });
        await sendReply(phone, SELLER_TEXT.askPhoto(product.id, productName));
        return;
      }

      // Waiting for a product photo (after ADD, or after PHOTO n)
      if (user.state === 'ADDING_PRODUCT_PHOTO') {
        const productId = user.pendingProductId;
        if (command === 'CANCEL' || !productId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { state: 'BROWSING', pendingProductId: null },
          });
          await sendReply(
            phone,
            productId ? SELLER_TEXT.photoLater(productId) : SELLER_TEXT.cancelled
          );
          return;
        }
        if (message.type !== 'image') {
          await sendReply(phone, SELLER_TEXT.needPhoto);
          return;
        }
        const key = await saveIncomingImage(message);
        if (!key) {
          await sendReply(phone, SELLER_TEXT.photoFailed);
          return;
        }

        // A new photo means the admin checks the product again
        const changed = await prisma.product.updateMany({
          where: { id: productId, sellerId: user.id },
          data: { imageKey: key, approval: 'PENDING' },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'BROWSING', pendingProductId: null },
        });
        if (changed.count === 0) {
          await sendReply(phone, SELLER_TEXT.productNotFound(productId));
          return;
        }
        await notifyAdminsOfProduct(productId);
        await sendReply(phone, SELLER_TEXT.photoSaved(productId));
        return;
      }

      // Waiting for the seller's UPI QR code photo
      if (user.state === 'SETTING_UPI_QR') {
        if (command === 'CANCEL') {
          await prisma.user.update({ where: { id: user.id }, data: { state: 'BROWSING' } });
          await sendReply(phone, SELLER_TEXT.qrCancelled);
          return;
        }
        if (message.type !== 'image') {
          await sendReply(phone, SELLER_TEXT.qrNeedPhoto);
          return;
        }
        const key = await saveIncomingImage(message);
        if (!key) {
          await sendReply(phone, SELLER_TEXT.photoFailed);
          return;
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { upiQrKey: key, state: 'BROWSING' },
        });
        await sendReply(phone, SELLER_TEXT.qrSaved);
        return;
      }

      // Normal seller commands
      if (user.state === 'BROWSING') {
        if (command === 'ADD') {
          await prisma.user.update({
            where: { id: user.id },
            data: { state: 'ADDING_PRODUCT_NAME', pendingProductName: null },
          });
          await sendReply(phone, SELLER_TEXT.askName);
          return;
        }
        if (command === 'MYPRODUCTS') {
          const mine = await prisma.product.findMany({
            where: { sellerId: user.id },
            orderBy: { id: 'asc' },
          });
          if (mine.length === 0) {
            await sendReply(phone, SELLER_TEXT.noProducts);
          } else {
            const approvalLabel = { PENDING: 'waiting for admin', APPROVED: 'approved', REJECTED: 'rejected' };
            const lines = mine.map(
              (p) =>
                `#${p.id} ${p.name} - ₹${p.price} - stock: ${p.stock ?? 'unlimited'}` +
                ` - ${p.imageKey ? approvalLabel[p.approval] : `no photo (send PHOTO ${p.id})`}` +
                `${p.isActive ? '' : ' (hidden)'}`
            );
            await sendReply(phone, `${SELLER_TEXT.myProductsTitle}\n${lines.join('\n')}`);
          }
          return;
        }
        if (command === 'MYORDERS') {
          const items = await prisma.orderItem.findMany({
            where: { sellerId: user.id },
            include: { order: { include: { customer: true } }, product: true },
            orderBy: { id: 'desc' },
            take: 10,
          });
          if (items.length === 0) {
            await sendReply(phone, SELLER_TEXT.noOrders);
          } else {
            const lines = items.map((it) => {
              const who = it.order.customer.name ?? it.order.customer.phone;
              const lineTotal = Number(it.unitPrice) * it.quantity;
              return `Order #${it.orderId} | ${it.product.name} x ${it.quantity} = ₹${lineTotal} | ${it.status} | ${who} (${it.order.customer.phone})`;
            });
            await sendReply(phone, `${SELLER_TEXT.myOrdersTitle}\n${lines.join('\n')}`);
          }
          return;
        }

        if (command === 'UPI') {
          await sendReply(phone, SELLER_TEXT.upiCurrent(user.upiId, Boolean(user.upiQrKey)));
          return;
        }

        if (command === 'QR') {
          await prisma.user.update({ where: { id: user.id }, data: { state: 'SETTING_UPI_QR' } });
          await sendReply(phone, SELLER_TEXT.askQr);
          return;
        }
        if (command === 'QR REMOVE') {
          await prisma.user.update({ where: { id: user.id }, data: { upiQrKey: null } });
          await sendReply(phone, SELLER_TEXT.qrRemoved);
          return;
        }

        const photoMatch = command.match(/^PHOTO\s+#?(\d+)$/);
        if (photoMatch) {
          const productId = Number(photoMatch[1]);
          const own = await prisma.product.findFirst({ where: { id: productId, sellerId: user.id } });
          if (!own) {
            await sendReply(phone, SELLER_TEXT.productNotFound(productId));
            return;
          }
          await prisma.user.update({
            where: { id: user.id },
            data: { state: 'ADDING_PRODUCT_PHOTO', pendingProductId: productId },
          });
          await sendReply(phone, SELLER_TEXT.askPhotoFor(productId));
          return;
        }
        const upiMatch = text.match(/^UPI\s+(\S+)$/i);
        if (upiMatch) {
          const upi = upiMatch[1].trim();
          // A UPI ID looks like name@bank. Card and account numbers have no "@", so they are rejected.
          if (!/^[A-Za-z0-9._-]{2,64}@[A-Za-z]{2,32}$/.test(upi)) {
            await sendReply(phone, SELLER_TEXT.upiInvalid);
            return;
          }
          await prisma.user.update({ where: { id: user.id }, data: { upiId: upi } });
          await sendReply(phone, SELLER_TEXT.upiSet(upi));
          return;
        }

        const stockMatch = command.match(/^STOCK\s+#?(\d+)\s+(\d+|OFF)$/);
        if (stockMatch) {
          const productId = Number(stockMatch[1]);
          const amount = stockMatch[2] === 'OFF' ? null : Number(stockMatch[2]);
          if (amount !== null && amount > 100000) {
            await sendReply(phone, SELLER_TEXT.stockInvalid);
            return;
          }
          const changed = await prisma.product.updateMany({
            where: { id: productId, sellerId: user.id },
            data: { stock: amount },
          });
          await sendReply(
            phone,
            changed.count === 0
              ? SELLER_TEXT.productNotFound(productId)
              : SELLER_TEXT.stockSet(productId, amount)
          );
          return;
        }

        const priceMatch = command.match(/^PRICE\s+#?(\d+)\s+(\d+(?:\.\d{1,2})?)$/);
        if (priceMatch) {
          const productId = Number(priceMatch[1]);
          const newPrice = Number(priceMatch[2]);
          if (newPrice <= 0 || newPrice > 100000) {
            await sendReply(phone, SELLER_TEXT.invalidPrice);
            return;
          }
          const changed = await prisma.product.updateMany({
            where: { id: productId, sellerId: user.id },
            data: { price: newPrice },
          });
          await sendReply(
            phone,
            changed.count === 0
              ? SELLER_TEXT.productNotFound(productId)
              : SELLER_TEXT.priceUpdated(productId, newPrice)
          );
          return;
        }

        const visibilityMatch = command.match(/^(HIDE|SHOW)\s+#?(\d+)$/);
        if (visibilityMatch) {
          const productId = Number(visibilityMatch[2]);
          const makeActive = visibilityMatch[1] === 'SHOW';
          const changed = await prisma.product.updateMany({
            where: { id: productId, sellerId: user.id },
            data: { isActive: makeActive },
          });
          await sendReply(
            phone,
            changed.count === 0
              ? SELLER_TEXT.productNotFound(productId)
              : makeActive
                ? SELLER_TEXT.shown(productId)
                : SELLER_TEXT.hidden(productId)
          );
          return;
        }

        if (command === 'MYPURCHASES') {
          await sendReply(phone, await customerOrders(user.id, user.language));
          return;
        }

        const paymentMatch = command.match(/^(RECEIVED|NOTRECEIVED)\s+#?(\d+)$/);
        if (paymentMatch) {
          await sendReply(
            phone,
            await decidePayment(user.id, Number(paymentMatch[2]), paymentMatch[1] === 'RECEIVED')
          );
          return;
        }

        const statusMatch = command.match(/^(CONFIRM|SHIP|DELIVER)\s+#?(\d+)$/);
        if (statusMatch) {
          await sendReply(
            phone,
            await updateOrderStatus(user.id, Number(statusMatch[2]), statusMatch[1])
          );
          return;
        }
        if (command === 'SELLER' || command === 'HELP') {
          await sendReply(phone, SELLER_TEXT.help);
          return;
        }
      }
    }

    // ---- Admin commands (only for users with the ADMIN role) ----
    if (user.role === 'ADMIN' && user.state === 'BROWSING') {
      if (command === 'PENDINGSELLERS') {
        const waiting = await prisma.user.findMany({
          where: { sellerStatus: 'PENDING' },
          orderBy: { id: 'asc' },
        });
        if (waiting.length === 0) {
          await sendReply(phone, REG_TEXT.noPending);
        } else {
          const lines = waiting.map((u) => `#${u.id} ${u.shopName ?? '-'} (${u.phone})`);
          await sendReply(phone, `${REG_TEXT.pendingTitle}\n${lines.join('\n')}`);
        }
        return;
      }

      const blockMatch = command.match(/^(BLOCK|UNBLOCK)\s+#?(\d+)$/);
      if (blockMatch) {
        const targetId = Number(blockMatch[2]);
        await sendReply(
          phone,
          blockMatch[1] === 'BLOCK'
            ? await blockSeller(targetId)
            : await unblockSeller(targetId)
        );
        return;
      }
      if (command === 'SALES') {
        await sendReply(phone, await salesReport());
        return;
      }

      if (command === 'PENDINGPRODUCTS') {
        await sendReply(phone, await pendingProducts(phone));
        return;
      }
      const productDecisionMatch = command.match(/^(APPROVEPRODUCT|REJECTPRODUCT)\s+#?(\d+)$/);
      if (productDecisionMatch) {
        await sendReply(
          phone,
          await decideProduct(
            Number(productDecisionMatch[2]),
            productDecisionMatch[1] === 'APPROVEPRODUCT'
          )
        );
        return;
      }

      const openMatch = command.match(/^OPENORDERS\s+#?(\d+)$/);
      if (openMatch) {
        await sendReply(phone, await openOrders(Number(openMatch[1])));
        return;
      }

      const adminCancelMatch = command.match(/^ADMINCANCEL\s+#?(\d+)$/);
      if (adminCancelMatch) {
        await sendReply(phone, await adminCancelOrder(Number(adminCancelMatch[1])));
        return;
      }

      if (command === 'MAKEADMIN') {
        await sendReply(phone, REG_TEXT.makeAdminUsage);
        return;
      }
      const makeAdminMatch = command.match(/^MAKEADMIN\s+\+?(\d{10,15})$/);
      if (makeAdminMatch) {
        await sendReply(phone, await makeAdmin(makeAdminMatch[1]));
        return;
      }

      const decideMatch = command.match(/^(APPROVE|REJECT)\s+#?(\d+)$/);
      if (decideMatch) {
        await sendReply(
          phone,
          await decideSeller(Number(decideMatch[2]), decideMatch[1] === 'APPROVE')
        );
        return;
      }
      if (command === 'ADMIN' || command === 'HELP') {
        await sendReply(phone, REG_TEXT.adminHelp);
        return;
      }
    }

    // ---- State: choosing a language ----
    if (user.state === 'CHOOSING_LANGUAGE') {
      const chosen = LANGUAGES[text];
      if (!chosen) {
        await sendReply(phone, languageMenu());
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { language: chosen.code, state: 'BROWSING' },
      });
      await sendReply(phone, WELCOME[chosen.code]);
      return;
    }

    // While waiting for a quantity, an address or a shop name,
    // these commands leave that step automatically
    if (
      (user.state === 'CHOOSING_QUANTITY' ||
        user.state === 'ENTERING_ADDRESS' ||
        user.state === 'ENTERING_SHOP_NAME') &&
      (['MENU', 'CART', 'CLEAR', 'MYORDERS', 'ADDRESS', 'ORDER', 'SELL'].includes(command) ||
        /^(REMOVE|CANCELORDER|QR)\s+#?\d+$/.test(command) ||
        /^PAID(\s|$)/.test(command))
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'BROWSING', pendingProductId: null },
      });
      user.state = 'BROWSING';
      user.pendingProductId = null;
    }

    // ---- State: entering the delivery address ----
    if (user.state === 'ENTERING_ADDRESS') {
      const A = ad(user.language);
      if (command === 'CANCEL') {
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'BROWSING' },
        });
        await sendReply(phone, A.cancelled);
        return;
      }
      if (text.length < 10 || text.length > 200) {
        await sendReply(phone, A.invalid);
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { address: text, state: 'BROWSING' },
      });
      await sendReply(phone, A.saved);
      return;
    }

    // ---- State: entering the shop name (seller registration) ----
    if (user.state === 'ENTERING_SHOP_NAME') {
      if (command === 'CANCEL') {
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'BROWSING' },
        });
        await sendReply(phone, REG_TEXT.cancelled);
        return;
      }
      if (text.length < 2 || text.length > 40) {
        await sendReply(phone, REG_TEXT.invalidShop);
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { shopName: text, sellerStatus: 'PENDING', state: 'BROWSING' },
      });

      // Tell every admin. A failure here must not undo the request.
      try {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        for (const a of admins) {
          await sendReply(a.phone, REG_TEXT.adminNotice(user.id, text, user.phone));
        }
      } catch (err) {
        console.error('Admin notification failed:', err);
      }

      await sendReply(phone, REG_TEXT.requested);
      return;
    }

    // ---- State: choosing a quantity ----
    if (user.state === 'CHOOSING_QUANTITY') {
      if (command === 'CANCEL') {
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'BROWSING', pendingProductId: null },
        });
        await sendReply(phone, T.cancelled);
        return;
      }

      const qty = Number(text);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        await sendReply(phone, T.invalidQty);
        return;
      }

      const product = user.pendingProductId
        ? await prisma.product.findUnique({
            where: { id: user.pendingProductId },
            include: { translations: true },
          })
        : null;

      if (!product) {
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'BROWSING', pendingProductId: null },
        });
        await sendReply(phone, T.invalidProduct);
        return;
      }

      const cart = await prisma.cart.upsert({
        where: { customerId: user.id },
        update: {},
        create: { customerId: user.id },
      });

      const existing = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      });
      const already = existing?.quantity ?? 0;
      const productLabel = localName(product, user.language);
      if (!product.isActive || product.approval !== 'APPROVED') {
        await sendReply(phone, st(user.language).unavailable(productLabel));
        return;
      }
      if (product.stock !== null && already + qty > product.stock) {
        const left = Math.max(product.stock - already, 0);
        await sendReply(phone, st(user.language).onlyLeft(productLabel, left));
        return;
      }

      await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId: product.id } },
        update: { quantity: { increment: qty } },
        create: { cartId: cart.id, productId: product.id, quantity: qty },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'BROWSING', pendingProductId: null },
      });
      await sendReply(phone, T.added(localName(product, user.language), qty));
      return;
    }

    // ---- State: browsing ----
    if (command === 'MENU') {
      await sendReply(phone, await productList(user.language));
      return;
    }

    if (command === 'CART') {
      await sendReply(phone, await cartText(user.id, user.language));
      return;
    }

    if (command === 'CLEAR') {
      await sendReply(phone, await clearCart(user.id, user.language));
      return;
    }

    const removeMatch = command.match(/^REMOVE\s+#?(\d+)$/);
    if (removeMatch) {
      await sendReply(
        phone,
        await removeFromCart(user.id, user.language, Number(removeMatch[1]))
      );
      return;
    }

    if (command === 'MYORDERS') {
      await sendReply(phone, await customerOrders(user.id, user.language));
      return;
    }

    const cancelMatch = command.match(/^CANCELORDER\s+#?(\d+)$/);
    if (cancelMatch) {
      await sendReply(
        phone,
        await cancelOrder(user.id, user.language, Number(cancelMatch[1]))
      );
      return;
    }

    // PAID n ref: the customer reports a UPI payment (plain PAID shows how)
    if (/^PAID(\s|$)/.test(command)) {
      const paidMatch = text.match(/^PAID\s+#?(\d+)\s+(\S+)$/i);
      await sendReply(
        phone,
        paidMatch
          ? await reportPaid(user.id, user.language, Number(paidMatch[1]), paidMatch[2])
          : uf(user.language).paidUsage
      );
      return;
    }

    // QR n: the customer wants a QR code instead of typing the UPI ID
    const qrMatch = command.match(/^QR\s+#?(\d+)$/);
    if (qrMatch) {
      const reply = await sendPaymentQr(user.id, phone, user.language, Number(qrMatch[1]));
      if (reply) await sendReply(phone, reply);
      return;
    }

    if (command === 'SELL') {
      if (user.role === 'ADMIN') {
        await sendReply(phone, REG_TEXT.adminCannot);
        return;
      }
      if (user.role === 'SELLER' || user.sellerStatus === 'APPROVED') {
        await sendReply(phone, REG_TEXT.alreadySeller);
        return;
      }
      if (user.sellerStatus === 'BLOCKED') {
        await sendReply(phone, REG_TEXT.sellBlocked);
        return;
      }
      if (user.sellerStatus === 'PENDING') {
        await sendReply(phone, REG_TEXT.alreadyPending);
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'ENTERING_SHOP_NAME' },
      });
      await sendReply(phone, REG_TEXT.askShop);
      return;
    }

    if (command === 'ADDRESS') {
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'ENTERING_ADDRESS' },
      });
      const A = ad(user.language);
      await sendReply(phone, user.address ? A.askChange(user.address) : A.ask);
      return;
    }

    if (command === 'ORDER') {
      // First order: ask for the delivery address (only if the cart has items)
      if (!user.address) {
        const cart = await prisma.cart.findUnique({
          where: { customerId: user.id },
          include: { items: true },
        });
        if (!cart || cart.items.length === 0) {
          await sendReply(phone, T.emptyCart);
          return;
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'ENTERING_ADDRESS' },
        });
        await sendReply(phone, ad(user.language).ask);
        return;
      }

      await sendReply(phone, await placeOrder(user.id, user.language, user.address));
      return;
    }

    // A number picks a product from the list
    const n = Number(text);
    if (Number.isInteger(n) && n >= 1) {
      const products = await loadProducts();
      const product = products[n - 1];
      if (!product) {
        await sendReply(phone, T.invalidProduct);
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'CHOOSING_QUANTITY', pendingProductId: product.id },
      });
      // Show the photo with the price, and ask for the quantity in the same message
      const label = localName(product, user.language);
      await sendImage(phone, product.imageKey!, `${label} - ₹${product.price}\n\n${T.askQty(label)}`);
      return;
    }

    // Anything else
    await sendReply(phone, T.help);
  } catch (err) {
    // Forget this message ID so Meta's retry can be processed
    if (messageId) {
      await prisma.processedMessage.deleteMany({ where: { id: messageId } });
    }
    throw err;
  }
}

app.post('/webhook', async (req: Request, res: Response) => {
  // Reject calls that were not signed by Meta (only when WHATSAPP_APP_SECRET is set)
  if (!validSignature((req as any).rawBody, req.get('x-hub-signature-256'))) {
    console.log('Webhook call with a wrong or missing signature rejected');
    res.sendStatus(401);
    return;
  }

  try {
    await handleWebhook(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    sendingEnabled
      ? 'WhatsApp sending: ON'
      : 'WhatsApp sending: OFF (replies are only printed; set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID to turn it on)'
  );
  console.log(
    signatureCheckEnabled
      ? 'Webhook signature check: ON'
      : 'Webhook signature check: OFF (set WHATSAPP_APP_SECRET before going live)'
  );
});

// Clean up once at start and then once a day
cleanupProcessedMessages();
setInterval(cleanupProcessedMessages, 24 * 60 * 60 * 1000);
