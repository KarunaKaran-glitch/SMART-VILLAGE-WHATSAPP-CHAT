import 'dotenv/config';
import express, { Request, Response } from 'express';
import { prisma } from './db';
import { CHOOSE_LANGUAGE, LANGUAGES, t } from './messages';
import { SHOP_TEXT } from './shopText';
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
import { bt, STAFF_BUTTONS } from './buttonText';
import { currentLang, currentShop, inLang, setLang, setShop } from './lang';
import { ACTIVE_PAYMENT_METHOD } from './paymentConfig';
import {
  downloadWhatsAppMedia,
  maskDigits,
  sendWhatsAppImage,
  sendWhatsAppInteractive,
  sendWhatsAppText,
  sendingEnabled,
  signatureCheckEnabled,
  validSignature,
} from './whatsapp';
import { getImage, imageUrl, makeUpiQr, publicUrl, saveImage, upiLink, upiQrDataUrl } from './images';
import crypto from 'crypto';
import { PayPageState, renderPayPage, renderShopPage, simplePage } from './shopPage';
import { wt } from './webText';

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

// A reply is plain text, or a message with tap buttons (max 3) or a tap list (max 10 rows),
// optionally with a photo on top (buttons only). Several replies can be sent as an array.
// Every button and row id is a normal command (like "QR 12"), so tapping and typing do the same.
type Button = { id: string; title: string };
type Row = { id: string; title: string; description?: string };
type RichReply = {
  text: string;
  buttons?: Button[];
  list?: { button: string; rows: Row[] };
  imageKey?: string;
  // One button that opens a web page (WhatsApp "cta_url" message)
  link?: { title: string; url: string };
};
type Reply = string | RichReply | Reply[];

// WhatsApp rejects texts that are too long, so cut them to its limits
function clip(text: string, max: number): string {
  const chars = Array.from(text);
  return chars.length <= max ? text : chars.slice(0, max - 1).join('') + '…';
}

// Prints the reply (long numbers hidden) and, when WhatsApp is set up in .env, sends it
async function sendReply(to: string, reply: Reply): Promise<void> {
  if (Array.isArray(reply)) {
    for (const r of reply) await sendReply(to, r);
    return;
  }
  if (typeof reply === 'string') {
    console.log(`>> Reply to ${to}:\n${maskDigits(reply)}\n`);
    await sendWhatsAppText(to, reply);
    return;
  }

  const body = clip(reply.text, 1024);
  if (reply.link) {
    const title = clip(reply.link.title, 20);
    console.log(`>> Link button to ${to}:\n${maskDigits(body)}\n   [${title}] -> ${reply.link.url}\n`);
    await sendWhatsAppInteractive(to, {
      type: 'cta_url',
      body: { text: body },
      action: { name: 'cta_url', parameters: { display_text: title, url: reply.link.url } },
    });
    return;
  }
  if (reply.list && reply.list.rows.length > 0) {
    const rows = reply.list.rows.slice(0, 10).map((r) => ({
      id: r.id,
      title: clip(r.title, 24),
      ...(r.description ? { description: clip(r.description, 72) } : {}),
    }));
    console.log(
      `>> List to ${to}:\n${maskDigits(body)}\n` +
        rows.map((r) => `   (${r.title}${r.description ? ' | ' + r.description : ''}) -> ${r.id}`).join('\n') +
        '\n'
    );
    await sendWhatsAppInteractive(to, {
      type: 'list',
      body: { text: body },
      action: { button: clip(reply.list.button, 20), sections: [{ title: clip(reply.list.button, 24), rows }] },
    });
    return;
  }

  if (reply.buttons && reply.buttons.length > 0) {
    const buttons = reply.buttons.slice(0, 3).map((b) => ({ id: b.id, title: clip(b.title, 20) }));
    const link = reply.imageKey ? imageUrl(reply.imageKey) : null;
    console.log(
      `>> Buttons to ${to}:${link ? ' ' + link : ''}\n${maskDigits(body)}\n` +
        '   ' + buttons.map((b) => `[${b.title}] -> ${b.id}`).join('   ') + '\n'
    );
    await sendWhatsAppInteractive(to, {
      type: 'button',
      ...(link ? { header: { type: 'image', image: { link } } } : {}),
      body: { text: body },
      action: { buttons: buttons.map((b) => ({ type: 'reply', reply: b })) },
    });
    return;
  }

  if (reply.imageKey) {
    await sendImage(to, reply.imageKey, body);
    return;
  }
  await sendReply(to, body);
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

// A category's name in the reader's language (admin-added categories may only have English)
function categoryName(c: { name: string; names: unknown }, language: string): string {
  const names = (c.names ?? {}) as Record<string, string>;
  return names[language] ?? c.name;
}

// The category list (tap one to choose it); used by customers, sellers and applicants
async function categoryRows(language: string, idPrefix: string, withCounts: boolean): Promise<Row[]> {
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' }, take: 10 });
  const rows: Row[] = [];
  for (const c of categories) {
    let description: string | undefined;
    if (withCounts) {
      const n = (await loadProducts(c.id)).length;
      if (n === 0) continue; // customers only see categories that have products
      description = bt(language).itemCount(n);
    }
    rows.push({ id: `${idPrefix} ${c.id}`, title: categoryName(c, language), description });
  }
  return rows;
}

// Products a customer can buy (optionally only one category)
function loadProducts(categoryId?: number) {
  return prisma.product.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      isActive: true,
      approval: 'APPROVED', // checked by the admin: handmade only
      imageKey: { not: null }, // every product on the menu has a photo
      seller: { upiId: { not: null } }, // customers can only pay sellers who set a UPI ID
      OR: [{ stock: null }, { stock: { gt: 0 } }],
    },
    include: { translations: true },
    orderBy: { id: 'asc' },
  });
}

async function cartText(userId: number, language: string, withHint = true): Promise<string> {
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
  const summary = `${T.cartTitle}\n${lines.join('\n')}\n${T.cartTotal}: ₹${total}`;
  return withHint ? `${summary}\n\n${ct(language).hint}` : summary;
}

// ---- Tap screens (buttons and lists) ----

// The language question. A customer who came through a seller's link sees only English
// and the language of that seller's state (as buttons); everyone else sees the full list.
function languageReply(shopLanguage?: string | null): RichReply {
  const local = Object.entries(LANGUAGES).find(([, l]) => l.code === shopLanguage && l.code !== 'en');
  if (local) {
    return {
      text: `Please choose your language 👇\n${CHOOSE_LANGUAGE[local[1].code]}`,
      buttons: [
        { id: '1', title: LANGUAGES['1'].label },
        { id: local[0], title: local[1].label },
      ],
    };
  }
  return {
    text:
      'Welcome! Please choose your language.\n' +
      'नमस्ते! कृपया अपनी भाषा चुनें।\n' +
      'ନମସ୍କାର! ଦୟାକରି ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ।\n' +
      'নমস্কাৰ! অনুগ্ৰহ কৰি আপোনাৰ ভাষা বাছক।',
    list: {
      button: 'Language / भाषा',
      rows: Object.entries(LANGUAGES).map(([num, l]) => ({ id: num, title: l.label })),
    },
  };
}

// The language list for this person: limited to their seller's languages if they came by a link
async function languageReplyFor(user: { shopId: number | null }): Promise<RichReply> {
  const shop = user.shopId
    ? await prisma.user.findUnique({ where: { id: user.shopId }, select: { shopLanguage: true } })
    : null;
  return languageReply(shop?.shopLanguage);
}

// ---- Seller's own shop link ----

// The seller's shop code, made from the shop name the first time it is needed (KARNA, RAVIBAGS ...)
async function ensureShopCode(seller: { id: number; shopName: string | null; shopCode: string | null }) {
  if (seller.shopCode) return seller.shopCode;
  const base = (seller.shopName ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  let code = base.length >= 3 && base !== 'SHOP' ? base : `SHOP${seller.id}`;
  if (await prisma.user.findUnique({ where: { shopCode: code } })) code = `${code.slice(0, 8)}${seller.id}`;
  await prisma.user.update({ where: { id: seller.id }, data: { shopCode: code } });
  return code;
}

// "Which state is your shop in?" (the state decides the customers' second language)
function shopStateReply(): RichReply {
  return {
    text: SHOP_TEXT.askState,
    list: {
      button: SHOP_TEXT.btnChooseState,
      rows: [
        { id: 'SHOPLANG OR', title: SHOP_TEXT.stateOdisha, description: SHOP_TEXT.withEnglish(LANGUAGES['3'].label) },
        { id: 'SHOPLANG AS', title: SHOP_TEXT.stateAssam, description: SHOP_TEXT.withEnglish(LANGUAGES['4'].label) },
        { id: 'SHOPLANG HI', title: SHOP_TEXT.stateHindi, description: SHOP_TEXT.stateHindiDesc },
        { id: 'SHOPLANG EN', title: SHOP_TEXT.stateOther, description: SHOP_TEXT.stateOtherDesc },
      ],
    },
  };
}

// The seller's link to share: wa.me/<bot number>?text=Hi <code>. WHATSAPP_BOT_NUMBER is the
// bot's own number with country code (digits only); without it the seller gets only the code.
async function shopLinkReply(
  seller: { id: number; shopName: string | null; shopCode: string | null },
  prefix?: string
): Promise<RichReply> {
  const code = await ensureShopCode(seller);
  const shop = seller.shopName ?? '-';
  const botNumber = (process.env.WHATSAPP_BOT_NUMBER ?? '').replace(/\D/g, '');
  const text = botNumber
    ? SHOP_TEXT.link(shop, code, `https://wa.me/${botNumber}?text=${encodeURIComponent(`Hi ${code}`)}`)
    : SHOP_TEXT.linkNoUrl(shop, code);
  return {
    text: prefix ? `${prefix}\n\n${text}` : text,
    buttons: [
      { id: 'SHOPSTATE', title: SHOP_TEXT.btnChangeState },
      { id: 'SELLER', title: SELLER_TEXT.btnMenu },
    ],
  };
}

function welcomeReply(language: string, text?: string): RichReply {
  const B = bt(language);
  // A customer who came through a seller's link: that shop's welcome, like Chennai Metro's
  // [Book Tickets] [Nearby Station] [More Options]
  const shop = currentShop();
  if (shop) {
    return {
      text: text ?? B.shopWelcome(shop),
      buttons: [
        { id: 'SHOPNOW', title: B.shopNow },
        { id: 'MYORDERS', title: B.myOrders },
        { id: 'MAINMENU', title: B.moreOptions },
      ],
    };
  }
  return {
    text: text ?? B.welcome,
    buttons: [
      { id: 'MENU', title: B.products },
      { id: 'CART', title: B.cart },
      { id: 'MAINMENU', title: B.menu },
    ],
  };
}

// The first screen after "hi" depends on the role: sellers and admins see their own work first
function homeReply(user: { language: string; role: string }): RichReply {
  // Outside inLang, so a customer keeps their shop's welcome (see lang.ts)
  if (user.role !== 'SELLER' && user.role !== 'ADMIN') return welcomeReply(user.language);
  return inLang(user.language, () => {
    if (user.role === 'SELLER') {
      return {
        text: SELLER_TEXT.home,
        buttons: [
          { id: 'MYORDERS', title: SELLER_TEXT.btnOrders },
          { id: 'ADD', title: SELLER_TEXT.btnAdd },
          { id: 'SELLER', title: SELLER_TEXT.btnMenu },
        ],
      };
    }
    if (user.role === 'ADMIN') {
      return {
        text: REG_TEXT.adminHome,
        buttons: [
          { id: 'PENDINGPRODUCTS', title: REG_TEXT.btnCheckProducts },
          { id: 'PENDINGSELLERS', title: REG_TEXT.btnSellerRequests },
          { id: 'ADMIN', title: REG_TEXT.btnAdminMenu },
        ],
      };
    }
    return welcomeReply(user.language);
  });
}

// A question that waits for typed text (name, price, photo, address ...) gets a Cancel button
function withCancel(text: string): RichReply {
  return { text, buttons: [{ id: 'CANCEL', title: bt(currentLang()).cancel }] };
}

// Sellers and admins should never be left without a next step: a reply that is only text
// gets the role's navigation buttons. Replies that already have buttons or a list stay as they are.
function withNav(role: string, reply: Reply): Reply {
  if (Array.isArray(reply)) {
    return reply.map((r, i) => (i === reply.length - 1 ? withNav(role, r) : r));
  }
  const rich: RichReply = typeof reply === 'string' ? { text: reply } : reply;
  if (rich.buttons?.length || rich.list) return reply;
  if (role === 'SELLER') {
    return {
      ...rich,
      buttons: [
        { id: 'MYPRODUCTS', title: SELLER_TEXT.rowProducts },
        { id: 'ADD', title: SELLER_TEXT.btnAdd },
        { id: 'SELLER', title: SELLER_TEXT.btnMenu },
      ],
    };
  }
  if (role === 'ADMIN') {
    return {
      ...rich,
      buttons: [
        { id: 'PENDINGPRODUCTS', title: REG_TEXT.btnCheckProducts },
        { id: 'PENDINGSELLERS', title: REG_TEXT.btnSellerRequests },
        { id: 'ADMIN', title: REG_TEXT.btnAdminMenu },
      ],
    };
  }
  return reply;
}

// Everything a customer can do, in one list (sellers and admins also get their own menu)
function mainMenuReply(user: { language: string; role: string }): RichReply {
  const B = bt(user.language);
  // A shop customer shops on the shop's web page; others use the product lists and cart
  const rows: Row[] = currentShop()
    ? [{ id: 'SHOPNOW', title: B.shopNow }]
    : [
        { id: 'MENU', title: B.products },
        { id: 'CART', title: B.cart },
      ];
  rows.push(
    { id: 'MYORDERS', title: B.myOrders },
    { id: 'ADDRESS', title: B.address },
    { id: 'LANG', title: B.language }
  );
  if (user.role === 'SELLER') rows.push({ id: 'SELLER', title: B.sellerMenu });
  else if (user.role === 'ADMIN') rows.push({ id: 'ADMIN', title: B.adminMenu });
  else rows.push({ id: 'SELL', title: B.sell });
  return { text: B.whatNext, list: { button: B.menu, rows } };
}

// Products as a tap list, 9 per page plus "More products"
async function productListReply(language: string): Promise<Reply> {
  // MENU first shows the categories (Keychains, Handbags, Wallets ...)
  const B = bt(language);
  const rows = await categoryRows(language, 'CATEGORY', true);
  if (rows.length === 0) return { text: B.noProducts, buttons: [{ id: 'MAINMENU', title: B.menu }] };
  return { text: B.categoriesBody, list: { button: B.categoriesButton, rows } };
}

// CATEGORY n (page p): the products of one category as photo cards, so customers choose
// by colour and design. Each card is the photo with name and price and a [Select] button;
// a last message offers [More] (next 10) and [All categories].
async function categoryProductsReply(language: string, categoryId: number, page: number): Promise<Reply> {
  const B = bt(language);
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  const products = category ? await loadProducts(categoryId) : [];
  if (!category || products.length === 0) return productListReply(language);

  const perPage = 10;
  const pages = Math.ceil(products.length / perPage);
  const current = Math.min(Math.max(page, 1), pages);
  const cards: Reply[] = products.slice((current - 1) * perPage, current * perPage).map((p) => ({
    text: `${localName(p, language)} - ₹${p.price}`,
    imageKey: p.imageKey!,
    buttons: [{ id: `PRODUCT ${p.id}`, title: B.select }],
  }));

  const nav: Button[] = [];
  if (current < pages) nav.push({ id: `CATEGORY ${categoryId} ${current + 1}`, title: `${B.moreItems} ›` });
  nav.push({ id: 'MENU', title: B.allCategories });
  const shown = `${(current - 1) * perPage + 1}-${(current - 1) * perPage + cards.length} / ${products.length}`;
  return [
    ...cards,
    { text: `${categoryName(category, language)} (${shown})\n${B.pickHint}`, buttons: nav },
  ];
}

// One product: its photo, name and price, with Add to cart / Back
async function productReply(language: string, productId: number): Promise<Reply> {
  const B = bt(language);
  const p = await prisma.product.findUnique({ where: { id: productId }, include: { translations: true } });
  if (!p || !p.isActive || p.approval !== 'APPROVED' || !p.imageKey || p.stock === 0) {
    return welcomeReply(language, t(language).invalidProduct);
  }
  // The details screen: photo, name, price and the seller's description.
  // The other photo cards are still just above in the chat, so the second button
  // opens the category list instead of sending all photos again.
  return {
    text: `${localName(p, language)} - ₹${p.price}${p.description ? `\n\n${p.description}` : ''}`,
    imageKey: p.imageKey,
    buttons: [
      { id: `BUY ${p.id}`, title: B.addToCart },
      { id: 'MENU', title: B.allCategories },
    ],
  };
}

// Quantity as a tap list: 1 to 10 (typing a bigger number up to 99 still works)
function qtyReply(language: string, name: string): RichReply {
  const B = bt(language);
  return {
    text: B.askQty(name),
    list: {
      button: B.choose,
      rows: Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1), title: String(i + 1) })),
    },
  };
}

function afterAddReply(language: string, text: string): RichReply {
  const B = bt(language);
  return {
    text,
    buttons: [
      { id: 'ORDER', title: B.placeOrder },
      { id: 'MENU', title: B.shopMore },
      { id: 'CART', title: B.viewCart },
    ],
  };
}

async function cartReply(userId: number, language: string, prefix?: string): Promise<Reply> {
  const B = bt(language);
  const T = t(language);
  const summary = await cartText(userId, language, false);
  const text = prefix ? `${prefix}\n\n${summary}` : summary;
  if (summary === T.emptyCart) {
    return { text, buttons: [{ id: 'MENU', title: B.products }] };
  }
  return {
    text,
    buttons: [
      { id: 'ORDER', title: B.placeOrder },
      { id: 'REMOVEMENU', title: B.removeItem },
      { id: 'MENU', title: B.shopMore },
    ],
  };
}

// Which cart line to remove (same numbering as the cart), or empty the cart
async function removeMenuReply(userId: number, language: string): Promise<Reply> {
  const B = bt(language);
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: { items: { include: { product: { include: { translations: true } } }, orderBy: { id: 'asc' } } },
  });
  if (!cart || cart.items.length === 0) return cartReply(userId, language);
  const rows: Row[] = cart.items.slice(0, 9).map((item, i) => ({
    id: `REMOVE ${i + 1}`,
    title: localName(item.product, language),
    description: `x ${item.quantity}`,
  }));
  rows.push({ id: 'CLEAR', title: B.clearCart });
  return { text: B.removeWhich, list: { button: B.removeItem, rows } };
}

// Before placing the order: total and delivery address, so the customer can check them
async function confirmOrderReply(userId: number, language: string, address: string): Promise<Reply> {
  const B = bt(language);
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) return cartReply(userId, language);
  const total = cart.items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  return {
    text: B.confirmOrder(total, address),
    buttons: [
      { id: 'PLACEORDER', title: B.placeOrder },
      { id: 'ADDRESS', title: B.changeAddress },
      { id: 'CART', title: B.viewCart },
    ],
  };
}

// The customer's last orders as a tap list
async function ordersListReply(userId: number, language: string): Promise<Reply> {
  const B = bt(language);
  const M = mo(language);
  const orders = await prisma.order.findMany({
    where: { customerId: userId },
    include: { payments: { orderBy: { id: 'desc' }, take: 1 } },
    orderBy: { id: 'desc' },
    take: 10,
  });
  if (orders.length === 0) return { text: M.none, buttons: [{ id: 'MENU', title: B.products }] };
  return {
    text: B.ordersBody,
    list: {
      button: B.myOrders,
      rows: orders.map((o) => ({
        id: `ORDERINFO ${o.id}`,
        title: `#${o.id} - ₹${o.total}`,
        description: `${M.status(o.status)}${o.payments[0] ? ' · ' + M.pay(o.payments[0].status, o.payments[0].method) : ''}`,
      })),
    },
  };
}

// One order with the buttons that make sense for it right now
async function orderInfoReply(userId: number, language: string, orderId: number): Promise<Reply> {
  const B = bt(language);
  const M = mo(language);
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: {
      items: { include: { product: { include: { translations: true } }, seller: true } },
      payments: { orderBy: { id: 'desc' }, take: 1 },
    },
  });
  if (!order) return welcomeReply(language, uf(language).notFound(orderId));

  const payment = order.payments[0];
  const seller = order.items[0]?.seller;
  const lines = order.items.map((i) => `  ${localName(i.product, language)} x ${i.quantity}`).join('\n');
  let text = `#${order.id} - ${M.status(order.status)} - ₹${order.total}\n${lines}`;
  if (payment) text += `\n  ${M.pay(payment.status, payment.method)}`;

  const waitingForPayment =
    payment?.method === 'UPI_DIRECT' && payment.status === 'INITIATED' && order.status !== 'CANCELLED';
  if (waitingForPayment && seller) {
    text += `\n\n${pay(language).block(order.id, seller.shopName ?? seller.phone, Number(order.total), seller.upiId ?? '')}\n\n${B.payTapHint}`;
    const buttons: Button[] = [
      { id: `QR ${order.id}`, title: B.showQr },
      { id: `PAID ${order.id}`, title: B.paid },
    ];
    if (order.items.every((i) => i.status === 'PENDING')) {
      buttons.push({ id: `CANCELORDER ${order.id}`, title: B.cancelOrder });
    }
    return { text, buttons };
  }
  return {
    text,
    buttons: [
      { id: 'MYORDERS', title: B.myOrders },
      { id: 'MENU', title: B.products },
    ],
  };
}

// REMOVE n: removes line n of the cart (same numbering as the CART message)
async function removeFromCart(userId: number, language: string, line: number): Promise<Reply> {
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  if (!cart || cart.items.length === 0) return cartReply(userId, language);

  const item = cart.items[line - 1];
  if (!item) return cartReply(userId, language, ct(language).invalidLine);

  await prisma.cartItem.delete({ where: { id: item.id } });
  return cartReply(userId, language, ct(language).removed);
}

// CLEAR: empties the cart
async function clearCart(userId: number, language: string): Promise<Reply> {
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: { items: true },
  });
  if (cart && cart.items.length > 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  return { text: ct(language).cleared, buttons: [{ id: 'MENU', title: bt(language).products }] };
}

// Buttons to carry on after a customer message that has no next step of its own
function nextButtons(language: string): Button[] {
  const B = bt(language);
  return [
    { id: 'MYORDERS', title: B.myOrders },
    { id: 'MENU', title: B.products },
  ];
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

// The different sellers of some order items, with the language each one reads
function sellersOf(items: { seller: { phone: string; language: string } }[]) {
  const byPhone = new Map(items.map((i) => [i.seller.phone, i.seller.language]));
  return [...byPhone].map(([phone, language]) => ({ phone, language }));
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
    for (const s of sellersOf(order.items)) {
      await sendReply(s.phone, inLang(s.language, () => sellerCancelNotice(orderId)));
    }
  } catch (err) {
    console.error('Seller cancel notice failed:', err);
  }

  return C.cancelled(orderId);
}

// PAID n (tap "I have paid") or PAID n ref: the customer reports a UPI payment;
// the seller is asked to check their bank app. The transaction number is optional.
async function reportPaid(
  userId: number,
  language: string,
  orderId: number,
  rawRef?: string
): Promise<Reply> {
  const U = uf(language);

  // UPI transaction numbers are usually 12 digits; allow 8 to 24 letters or digits
  const ref = rawRef ? rawRef.toUpperCase() : null;
  if (ref && !/^[A-Z0-9]{8,24}$/.test(ref)) return U.invalidRef;

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
  if (ref) {
    const usedElsewhere = await prisma.payment.findFirst({
      where: { reference: ref, id: { not: payment.id } },
    });
    if (usedElsewhere) return U.refUsed;
  }

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
    for (const s of sellersOf(order.items)) {
      await sendReply(
        s.phone,
        inLang(s.language, () => ({
          text: SELLER_TEXT.paymentReported(orderId, Number(payment.amount), ref),
          buttons: [
            { id: `RECEIVED ${orderId}`, title: STAFF_BUTTONS.received },
            { id: `NOTRECEIVED ${orderId}`, title: STAFF_BUTTONS.notReceived },
          ],
        }))
      );
    }
  } catch (err) {
    console.error('Seller payment notice failed:', err);
  }

  return { text: U.paidThanks(orderId), buttons: nextButtons(language) };
}

// RECEIVED n / NOTRECEIVED n: the seller answers a reported UPI payment
async function decidePayment(
  sellerId: number,
  orderId: number,
  received: boolean
): Promise<Reply> {
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
      const lang = order.customer.language;
      const U = uf(lang);
      const B = bt(lang);
      await sendReply(
        order.customer.phone,
        received
          ? { text: U.received(orderId), buttons: nextButtons(lang) }
          : {
              text: U.notReceived(orderId),
              buttons: [
                { id: `QR ${orderId}`, title: B.showQr },
                { id: `PAID ${orderId}`, title: B.paid },
              ],
            }
      );
    }
  } catch (err) {
    console.error('Customer payment notice failed:', err);
  }

  return received
    ? {
        text: SELLER_TEXT.receivedDone(orderId),
        buttons: [{ id: `CONFIRM ${orderId}`, title: STAFF_BUTTONS.confirm }],
      }
    : SELLER_TEXT.notReceivedDone(orderId);
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
type Placed = {
  orderId: number;
  sellerPhone: string;
  sellerLanguage: string;
  shop: string;
  upiId: string | null;
  total: number;
  lines: string[];
};

// Turns the cart into orders (one per seller), takes the stock and tells each seller.
// Used by the chat (PLACEORDER) and by the shop web page.
async function createOrders(
  userId: number,
  language: string,
  address: string
): Promise<{ error: string } | { placed: Placed[] }> {
  const T = t(language);
  const P = pay(language);
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: { items: { include: { product: { include: { seller: true } } } } },
  });
  if (!cart || cart.items.length === 0) return { error: T.emptyCart };

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
      if (!seller.upiId) return { error: P.noUpi(seller.shopName ?? 'seller') };
    }
  }

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
          sellerLanguage: seller.language,
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
      if (!p) return { error: T.invalidProduct };
      const label = localName(p, language);
      const left = p.isActive && p.approval === 'APPROVED' ? (p.stock ?? 0) : 0;
      return { error: left > 0 ? st(language).notEnough(label, left) : st(language).unavailable(label) };
    }
    throw err;
  }

  // Tell each seller. A failure here must not break the order.
  try {
    const customer = await prisma.user.findUnique({ where: { id: userId } });
    for (const p of placed) {
      await sendReply(
        p.sellerPhone,
        inLang(p.sellerLanguage, () => {
          const note = ACTIVE_PAYMENT_METHOD === 'UPI_DIRECT' ? SELLER_TEXT.upiNote : SELLER_TEXT.codNote;
          const customerLabel =
            `${customer?.name ?? SELLER_TEXT.customer} (${customer?.phone})\n` +
            `${SELLER_TEXT.deliverTo}: ${address}`;
          return SELLER_TEXT.newOrder(p.orderId, [...p.lines, note], customerLabel);
        })
      );
    }
  } catch (err) {
    console.error('Seller notification failed:', err);
  }
  return { placed };
}

async function placeOrder(userId: number, language: string, address: string): Promise<Reply> {
  const result = await createOrders(userId, language, address);
  if ('error' in result) return result.error;
  return paymentReply(language, result.placed);
}

// Tells the customer how to pay: one message per seller, with Show QR / I have paid buttons
function paymentReply(language: string, placed: Placed[]): Reply {
  const P = pay(language);
  if (ACTIVE_PAYMENT_METHOD === 'UPI_DIRECT') {
    const B = bt(language);
    return placed.map((p, i) => ({
      text:
        (i === 0 ? `${P.header}\n\n` : '') +
        `${P.block(p.orderId, p.shop, p.total, p.upiId ?? '')}\n\n${B.payTapHint}`,
      buttons: [
        { id: `QR ${p.orderId}`, title: B.showQr },
        { id: `PAID ${p.orderId}`, title: B.paid },
      ],
    }));
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
): Promise<Reply> {
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
      await sendReply(order.customer.phone, {
        text: ot(order.customer.language).status(orderId, rule.to),
        buttons: nextButtons(order.customer.language),
      });
    }
  } catch (err) {
    console.error('Customer notification failed:', err);
  }

  // Offer the seller the next step as a button
  const next =
    rule.to === 'CONFIRMED'
      ? { id: `SHIP ${orderId}`, title: STAFF_BUTTONS.ship }
      : rule.to === 'SHIPPED'
        ? { id: `DELIVER ${orderId}`, title: STAFF_BUTTONS.deliver }
        : null;
  const text = SELLER_TEXT.statusUpdated(orderId, rule.to);
  return next ? { text, buttons: [next] } : text;
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
      inLang(applicant.language, () =>
        approve
          ? [
              {
                text: REG_TEXT.approvedNotice(applicant.shopName ?? '-'),
                buttons: [
                  { id: 'ADD', title: SELLER_TEXT.btnAdd },
                  { id: 'SELLER', title: SELLER_TEXT.btnMenu },
                ],
              },
              // Next: the shop's state, so the seller gets their shop link
              shopStateReply(),
            ]
          : REG_TEXT.rejectedNotice
      )
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
    await sendReply(seller.phone, inLang(seller.language, () => REG_TEXT.blockedNotice));
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
    await sendReply(seller.phone, inLang(seller.language, () => REG_TEXT.unblockedNotice));
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
    const M = mo(currentLang());
    const lines = list.map((it) => `  ${it.product.name} x ${it.quantity} | ${M.status(it.status)}`).join('\n');
    const payment = o.payments[0] ? ` | ${M.pay(o.payments[0].status, o.payments[0].method)}` : '';
    const who = o.customer.name ?? o.customer.phone;
    return `#${o.id} - ₹${o.total}${payment} | ${who} (${o.customer.phone})\n${lines}`;
  });
  return `${REG_TEXT.openOrdersTitle(sellerId)}\n${blocks.join('\n')}\n\n${REG_TEXT.openOrdersHint}`;
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
    for (const s of sellersOf(openItems)) {
      await sendReply(s.phone, inLang(s.language, () => sellerAdminCancelNotice(orderId, !!paid)));
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
    await sendReply(phone, inLang(target.language, () => REG_TEXT.newAdminNotice));
  } catch (err) {
    console.error('New admin notice failed:', err);
  }

  return REG_TEXT.madeAdmin(phone);
}

// QR n: sends the customer a QR code to pay order n.
// The seller's own QR photo if they uploaded one, otherwise a QR made from their UPI ID
// with the amount and note filled in. Either way the money goes straight to the seller.
// The QR comes with an "I have paid" button.
async function paymentQrReply(userId: number, language: string, orderId: number): Promise<Reply> {
  const U = uf(language);
  const B = bt(language);
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: {
      items: { include: { seller: true }, take: 1 },
      payments: { orderBy: { id: 'desc' }, take: 1 },
    },
  });
  if (!order) return { text: U.notFound(orderId), buttons: nextButtons(language) };

  const payment = order.payments[0];
  const seller = order.items[0]?.seller;
  if (
    !payment ||
    !seller ||
    order.status === 'CANCELLED' ||
    payment.method !== 'UPI_DIRECT' ||
    payment.status !== 'INITIATED'
  ) {
    return { text: U.nothingToPay(orderId), buttons: nextButtons(language) };
  }

  const shop = seller.shopName ?? seller.phone;
  const total = Number(payment.amount);
  const paidButton = [{ id: `PAID ${orderId}`, title: B.paid }];

  if (seller.upiQrKey && (await getImage(seller.upiQrKey))) {
    return { text: B.qrSellerBody(orderId, shop, total), imageKey: seller.upiQrKey, buttons: paidButton };
  }
  if (!seller.upiId) return { text: U.nothingToPay(orderId), buttons: nextButtons(language) };

  const key = await makeUpiQr(seller.upiId, shop, total, `Order ${orderId}`);
  return { text: B.qrAutoBody(orderId, shop, total), imageKey: key, buttons: paidButton };
}

// The admin's view of a product to check: photo, details, Approve / Reject
function adminProductReply(p: {
  id: number;
  name: string;
  price: unknown;
  imageKey: string;
  description?: string | null;
  seller: { shopName: string | null; phone: string };
}): RichReply {
  return {
    text:
      REG_TEXT.adminProductNotice(p.id, p.name, Number(p.price), p.seller.shopName ?? p.seller.phone) +
      (p.description ? `\n\n${p.description}` : ''),
    imageKey: p.imageKey,
    buttons: [
      { id: `APPROVEPRODUCT ${p.id}`, title: STAFF_BUTTONS.approve },
      { id: `REJECTPRODUCT ${p.id}`, title: STAFF_BUTTONS.reject },
    ],
  };
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
    await sendReply(adminPhone, adminProductReply({ ...p, imageKey: p.imageKey! }));
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
      inLang(product.seller.language, () =>
        withNav(
          'SELLER',
          approve
            ? SELLER_TEXT.productApproved(productId, product.name)
            : SELLER_TEXT.productRejected(productId, product.name)
        )
      )
    );
  } catch (err) {
    console.error('Seller product notice failed:', err);
  }

  return REG_TEXT.productDecided(productId, approve ? 'APPROVED' : 'REJECTED');
}

// The category list for a seller or applicant to choose their kind of product
async function categoryChoiceReply(language: string, intro?: string): Promise<RichReply> {
  const rows = await categoryRows(language, 'SETCATEGORY', false);
  return inLang(language, () => ({
    text: intro ? `${intro}\n${SELLER_TEXT.askCategory}` : SELLER_TEXT.askCategory,
    list: { button: bt(language).categoriesButton, rows },
  }));
}

// SUBMIT: the seller's finished new products (DRAFT with a photo) go to the admin together.
// Every admin gets ONE message with Review now / Approve all.
async function submitProducts(seller: {
  id: number;
  shopName: string | null;
  phone: string;
  categoryId: number | null;
  upiId: string | null;
}): Promise<Reply> {
  const result = await prisma.product.updateMany({
    where: { sellerId: seller.id, approval: 'DRAFT', imageKey: { not: null } },
    data: { approval: 'PENDING' },
  });
  if (result.count === 0) {
    return { text: SELLER_TEXT.nothingToSubmit, buttons: [{ id: 'ADD', title: SELLER_TEXT.btnAdd }] };
  }

  // Everything waiting from this seller (also older ones not reviewed yet)
  const waiting = await prisma.product.count({
    where: { sellerId: seller.id, approval: 'PENDING', imageKey: { not: null } },
  });
  try {
    const category = seller.categoryId
      ? await prisma.category.findUnique({ where: { id: seller.categoryId } })
      : null;
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const a of admins) {
      await sendReply(
        a.phone,
        inLang(a.language, () => ({
          text: REG_TEXT.batchNotice(
            seller.shopName ?? seller.phone,
            waiting,
            category ? categoryName(category, a.language) : '-'
          ),
          buttons: [
            { id: `REVIEW ${seller.id}`, title: REG_TEXT.btnReviewNow },
            { id: `APPROVEALL ${seller.id}`, title: REG_TEXT.btnApproveAll(waiting) },
          ],
        }))
      );
    }
  } catch (err) {
    console.error('Admin batch notice failed:', err);
  }
  // Products of a seller without a UPI ID stay hidden from customers, so remind them
  return seller.upiId
    ? SELLER_TEXT.submitted(result.count)
    : `${SELLER_TEXT.submitted(result.count)}\n\n${SELLER_TEXT.upiCurrent(null, false)}`;
}

// REVIEW n: the admin sees the photos of seller n's waiting products, one by one
async function reviewProducts(adminPhone: string, sellerId: number): Promise<Reply> {
  const waiting = await prisma.product.findMany({
    where: { sellerId, approval: 'PENDING', imageKey: { not: null } },
    include: { seller: true },
    orderBy: { id: 'asc' },
    take: 10,
  });
  if (waiting.length === 0) return REG_TEXT.nothingToReview;
  for (const p of waiting) {
    await sendReply(adminPhone, adminProductReply({ ...p, imageKey: p.imageKey! }));
  }
  return {
    text: REG_TEXT.pendingProductsSent(waiting.length),
    buttons: [{ id: `APPROVEALL ${sellerId}`, title: REG_TEXT.btnApproveAll(waiting.length) }],
  };
}

// APPROVEALL n: approve all of seller n's waiting products; the seller gets one message
async function approveAllProducts(sellerId: number): Promise<string> {
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller) return REG_TEXT.nothingToReview;
  const result = await prisma.product.updateMany({
    where: { sellerId, approval: 'PENDING', imageKey: { not: null } },
    data: { approval: 'APPROVED' },
  });
  if (result.count === 0) return REG_TEXT.nothingToReview;
  try {
    await sendReply(
      seller.phone,
      inLang(seller.language, () => withNav('SELLER', SELLER_TEXT.approvedAll(result.count)))
    );
  } catch (err) {
    console.error('Seller approval notice failed:', err);
  }
  return REG_TEXT.approvedAllDone(result.count, seller.shopName ?? seller.phone);
}

// CATEGORIES: the admin's list of categories, with how many products each has
async function categoriesReport(language: string): Promise<string> {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true, sellers: true } } },
    orderBy: { id: 'asc' },
  });
  const lines = categories.map(
    (c) => `#${c.id} ${categoryName(c, language)} - ${bt(language).itemCount(c._count.products)}`
  );
  return `${REG_TEXT.categoriesTitle}\n${lines.join('\n')}\n\n${REG_TEXT.addCategoryHint}`;
}

// ADDCATEGORY name: a new category (English name; shown as typed in every language)
async function addCategory(rawName: string): Promise<string> {
  const name = rawName.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 24) return REG_TEXT.addCategoryHint;
  const existing = await prisma.category.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });
  if (existing) return REG_TEXT.categoryExists(existing.name);
  await prisma.category.create({ data: { name } });
  return REG_TEXT.categoryAdded(name);
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
    REG_TEXT.salesTitle,
    REG_TEXT.salesOrders(orders, open, delivered, cancelled),
    REG_TEXT.salesPaid(Number(cash._sum.amount ?? 0)),
    REG_TEXT.salesPeople(sellers, customers),
    sellerLines.length > 0
      ? `${REG_TEXT.salesPerSeller}\n${sellerLines.join('\n')}`
      : REG_TEXT.salesNone,
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

// ---- Shop web page (opened from the [Click here] button) ----

const WEB_TOKEN_HOURS = 24;

// The customer who owns this link, if the secret is right and not older than 24 hours
async function shopVisitor(code: string, token: unknown) {
  if (typeof token !== 'string' || token.length < 20) return null;
  const customer = await prisma.user.findUnique({ where: { webToken: token }, include: { shop: true } });
  const fresh =
    customer?.webTokenAt && Date.now() - customer.webTokenAt.getTime() < WEB_TOKEN_HOURS * 3600 * 1000;
  if (!customer || !fresh || customer.shop?.shopCode !== code || customer.shop.role !== 'SELLER') return null;
  return { customer, shop: customer.shop };
}

app.get('/shop/:code', async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  const visit = await shopVisitor(String(req.params.code).toUpperCase(), req.query.t);
  if (!visit) {
    res
      .status(403)
      .send(simplePage('Link expired', 'This link is old or not valid. Go back to WhatsApp and tap "Shop now" again.'));
    return;
  }
  const { customer, shop } = visit;
  const products = await shopProducts(shop.id);
  res.send(
    renderShopPage({
      language: customer.language,
      shopName: shop.shopName ?? shop.shopCode ?? '',
      token: String(req.query.t),
      address: customer.address ?? '',
      products: products.map((p) => ({
        id: p.id,
        name: localName(p, customer.language),
        description: p.description,
        price: Number(p.price),
        imageUrl: p.imageKey ? `/images/${p.imageKey}` : null,
        maxQty: p.stock === null ? 99 : Math.min(p.stock, 99),
        left: p.stock !== null && p.stock <= 5 ? p.stock : null,
      })),
    })
  );
});

// One of this customer's orders from this shop, with what the payment page needs
async function shopOrder(customerId: number, shopId: number, orderId: number) {
  if (!Number.isInteger(orderId)) return null;
  return prisma.order.findFirst({
    where: { id: orderId, customerId, items: { every: { sellerId: shopId } } },
    include: {
      items: { include: { product: { include: { translations: true } } } },
      payments: { orderBy: { id: 'desc' }, take: 1 },
    },
  });
}

// Payment page of one order: pay (QR, UPI ID, Pay button, "I have paid"), or its progress
app.get('/shop/:code/order/:id', async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  const visit = await shopVisitor(String(req.params.code).toUpperCase(), req.query.t);
  const order = visit ? await shopOrder(visit.customer.id, visit.shop.id, Number(req.params.id)) : null;
  if (!visit || !order) {
    res
      .status(403)
      .send(simplePage('Link expired', 'This link is old or not valid. Go back to WhatsApp and tap "Shop now" again.'));
    return;
  }
  const { customer, shop } = visit;
  const shopName = shop.shopName ?? shop.shopCode ?? '';
  const payment = order.payments[0];
  const total = Number(order.total);

  let state: PayPageState = 'pay';
  if (order.status === 'CANCELLED') state = 'cancelled';
  else if (payment?.status === 'SUCCESS') state = 'received';
  else if (payment?.status === 'AWAITING_CONFIRMATION') state = 'waiting';

  // The seller's own QR photo if they uploaded one, otherwise a QR made with the amount filled in
  const link = shop.upiId ? upiLink(shop.upiId, shopName, total, `Order ${order.id}`) : null;
  const sellerQr = shop.upiQrKey && (await getImage(shop.upiQrKey)) ? shop.upiQrKey : null;
  const qrSrc = sellerQr ? `/images/${sellerQr}` : link ? await upiQrDataUrl(link) : null;

  const botNumber = (process.env.WHATSAPP_BOT_NUMBER ?? '').replace(/\D/g, '');
  res.send(
    renderPayPage({
      language: customer.language,
      shopName,
      token: String(req.query.t),
      orderId: order.id,
      total,
      lines: order.items.map((i) => ({
        name: localName(i.product, customer.language),
        qty: i.quantity,
        amount: Number(i.unitPrice) * i.quantity,
      })),
      state,
      qrSrc,
      qrFromSeller: Boolean(sellerQr),
      upiId: shop.upiId,
      upiLink: link,
      whatsAppLink: botNumber ? `https://wa.me/${botNumber}` : null,
    })
  );
});

// "I have paid" on the payment page: { t, ref } -> the same step as PAID in the chat
// (the seller is asked Received / Not received)
app.post('/shop/:code/order/:id/paid', async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  try {
    const visit = await shopVisitor(String(req.params.code).toUpperCase(), req.body?.t);
    const order = visit ? await shopOrder(visit.customer.id, visit.shop.id, Number(req.params.id)) : null;
    if (!visit || !order) {
      res.status(403).json({ ok: false });
      return;
    }
    const { customer } = visit;
    const ref = typeof req.body.ref === 'string' && req.body.ref.trim() ? req.body.ref.replace(/\s+/g, '') : undefined;
    const reply = await inLang(customer.language, () => reportPaid(customer.id, customer.language, order.id, ref));
    // reportPaid answers with a plain text when something is wrong, and with buttons when it worked
    if (typeof reply === 'string') {
      res.status(409).json({ ok: false, error: reply });
      return;
    }
    console.log(`Web payment reported for order #${order.id}`);
    try {
      await sendReply(customer.phone, reply);
    } catch (err) {
      console.error('Customer paid message failed:', err);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Web payment report failed:', err);
    res.status(500).json({ ok: false });
  }
});

// The products a shop shows on its page: approved, not hidden, with a photo
function shopProducts(sellerId: number) {
  return prisma.product.findMany({
    where: { sellerId, isActive: true, approval: 'APPROVED', imageKey: { not: null } },
    include: { translations: true },
    orderBy: { id: 'asc' },
  });
}

// [Continue] on the shop page: { t, items: [{ id, qty }], address } -> one order for this shop.
// The page's choice replaces the customer's cart, then the normal order steps run
// (stock check, seller notice). The payment details are sent to the customer's WhatsApp.
app.post('/shop/:code/order', async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  try {
    const visit = await shopVisitor(String(req.params.code).toUpperCase(), req.body?.t);
    if (!visit) {
      res.status(403).json({ ok: false });
      return;
    }
    const { customer, shop } = visit;
    const W = wt(customer.language);

    const address = typeof req.body.address === 'string' ? req.body.address.trim() : '';
    if (address.length < 10 || address.length > 200) {
      res.status(400).json({ ok: false, error: W.addressInvalid });
      return;
    }
    const rawItems: unknown[] = Array.isArray(req.body.items) ? req.body.items.slice(0, 50) : [];
    const wanted = new Map<number, number>();
    for (const it of rawItems as { id?: unknown; qty?: unknown }[]) {
      const id = Number(it?.id);
      const qty = Number(it?.qty);
      if (Number.isInteger(id) && Number.isInteger(qty) && qty >= 1 && qty <= 99) wanted.set(id, qty);
    }
    // Only this shop's visible products count
    const allowed = new Set((await shopProducts(shop.id)).map((p) => p.id));
    const items = [...wanted].filter(([id]) => allowed.has(id));
    if (items.length === 0) {
      res.status(400).json({ ok: false, error: W.pickOne });
      return;
    }

    const cart = await prisma.cart.upsert({
      where: { customerId: customer.id },
      create: { customerId: customer.id },
      update: {},
    });
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      prisma.cartItem.createMany({
        data: items.map(([productId, quantity]) => ({ cartId: cart.id, productId, quantity })),
      }),
      prisma.user.update({
        where: { id: customer.id },
        data: { address, state: 'BROWSING', pendingProductId: null },
      }),
    ]);

    const result = await inLang(customer.language, () => createOrders(customer.id, customer.language, address));
    if ('error' in result) {
      res.status(409).json({ ok: false, error: result.error });
      return;
    }
    const order = result.placed[0];
    console.log(`Web order #${order.orderId} from ${maskDigits(customer.phone)} for ${shop.shopCode}`);

    // The payment details also go to the customer's WhatsApp (Step 4 shows them on the page)
    try {
      await sendReply(customer.phone, inLang(customer.language, () => paymentReply(customer.language, result.placed)));
    } catch (err) {
      console.error('Customer payment message failed:', err);
    }
    res.json({ ok: true, orderId: order.orderId, total: order.total });
  } catch (err) {
    console.error('Web order failed:', err);
    res.status(500).json({ ok: false });
  }
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
    // A tapped button or list row arrives with the command we gave it as its id
    const tapId = message.interactive?.button_reply?.id ?? message.interactive?.list_reply?.id;
    const text: string = String(tapId ?? message.text?.body ?? '').trim();
    const command = text.toUpperCase();

    if (tooManyMessages(phone)) {
      console.log('Too many messages, ignored:', phone);
      return;
    }

    console.log('Message from:', phone, tapId ? '| tap:' : '| text:', maskDigits(text));

    const user = await prisma.user.findUnique({ where: { phone } });

    // "Hi KARNA": the customer came through a seller's shop link
    const shopMatch = command.match(/^(?:HI|HELLO|HAI)\s+([A-Z0-9]{2,12})$/);
    const shop = shopMatch
      ? await prisma.user.findFirst({ where: { shopCode: shopMatch[1], role: 'SELLER' } })
      : null;
    // A seller in an English-only state: no language question
    const englishOnly = shop?.shopLanguage === 'en';
    if (shop) setShop(shop.shopName ?? shop.shopCode ?? undefined);

    // New customer: save them and ask for a language
    if (!user) {
      const created = await prisma.user.create({
        data: {
          phone,
          name,
          shopId: shop?.id,
          ...(englishOnly ? { language: 'en', state: 'BROWSING' as const } : {}),
        },
      });
      await sendReply(phone, englishOnly ? homeReply(created) : languageReply(shop?.shopLanguage));
      return;
    }

    // An existing user opening a seller's link: remember that seller and ask the language again
    if (shop) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          shopId: shop.id,
          state: englishOnly ? 'BROWSING' : 'CHOOSING_LANGUAGE',
          ...(englishOnly ? { language: 'en' } : {}),
          pendingProductId: null,
          pendingProductName: null,
        },
      });
      setLang(updated.language);
      await sendReply(phone, englishOnly ? homeReply(updated) : languageReply(shop.shopLanguage));
      return;
    }

    // Everything written for this person is in their language (seller and admin texts too)
    setLang(user.language);
    // A customer who came through a seller's link sees that shop's screens
    const myShop = user.shopId
      ? await prisma.user.findUnique({
          where: { id: user.shopId },
          select: { shopName: true, shopCode: true, role: true },
        })
      : null;
    if (myShop?.role === 'SELLER') setShop(myShop.shopName ?? myShop.shopCode ?? undefined);
    // Replies to a seller or admin that would end without a next step get navigation buttons
    const staffSend = (reply: Reply) => sendReply(phone, withNav(user.role, reply));
    const T = t(user.language);
    const B = bt(user.language);

    // LANG works in every state
    if (command === 'LANG') {
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'CHOOSING_LANGUAGE', pendingProductId: null },
      });
      await sendReply(phone, await languageReplyFor(user));
      return;
    }

    // SETCATEGORY n: a seller (or someone applying to be one) picks their kind of product
    const setCategoryMatch = command.match(/^SETCATEGORY\s+#?(\d+)$/);
    if (setCategoryMatch) {
      const category = await prisma.category.findUnique({ where: { id: Number(setCategoryMatch[1]) } });
      const applying =
        user.state === 'CHOOSING_CATEGORY' &&
        user.role === 'CUSTOMER' &&
        Boolean(user.shopName) &&
        (user.sellerStatus === 'NONE' || user.sellerStatus === 'REJECTED');
      if (!category || (user.role !== 'SELLER' && !applying)) {
        await sendReply(phone, homeReply(user));
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          categoryId: category.id,
          state: 'BROWSING',
          ...(applying ? { sellerStatus: 'PENDING' as const } : {}),
        },
      });

      if (applying) {
        // The seller request is complete: tell every admin (in their language)
        try {
          const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
          for (const a of admins) {
            await sendReply(
              a.phone,
              inLang(a.language, () => ({
                text:
                  REG_TEXT.adminNotice(user.id, user.shopName ?? '-', user.phone) +
                  `\n${REG_TEXT.categoryLabel}: ${categoryName(category, a.language)}`,
                buttons: [
                  { id: `APPROVE ${user.id}`, title: STAFF_BUTTONS.approve },
                  { id: `REJECT ${user.id}`, title: STAFF_BUTTONS.reject },
                ],
              }))
            );
          }
        } catch (err) {
          console.error('Admin notification failed:', err);
        }
        await sendReply(phone, REG_TEXT.requested);
        return;
      }

      await sendReply(phone, {
        text: SELLER_TEXT.categorySet(categoryName(category, user.language)),
        buttons: [{ id: 'ADD', title: SELLER_TEXT.btnAdd }],
      });
      return;
    }

    // A tap while the bot waits for typed text (a name, price, address, shop name or photo)
    // means the person moved on: leave that step and handle the tap as a normal command.
    // (Taps on the quantity list are numbers and stay in the quantity step.)
    const typingStates = [
      'ADDING_PRODUCT_NAME',
      'ADDING_PRODUCT_PRICE',
      'ADDING_PRODUCT_PHOTO',
      'SETTING_UPI_QR',
      'ENTERING_ADDRESS',
      'ENTERING_SHOP_NAME',
      'CHOOSING_QUANTITY',
      'CHOOSING_CATEGORY',
      'ADDING_PRODUCT_DESCRIPTION',
    ];
    if (
      tapId &&
      command !== 'CANCEL' && // the Cancel and Skip buttons are handled by the step itself
      command !== 'SKIP' &&
      typingStates.includes(user.state) &&
      !(user.state === 'CHOOSING_QUANTITY' && /^\d+$/.test(text))
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'BROWSING', pendingProductId: null, pendingProductName: null },
      });
      user.state = 'BROWSING';
      user.pendingProductId = null;
      user.pendingProductName = null;
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
          await staffSend(SELLER_TEXT.cancelled);
          return;
        }
        if (text.length < 2 || text.length > 60) {
          await sendReply(phone, withCancel(SELLER_TEXT.invalidName));
          return;
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'ADDING_PRODUCT_PRICE', pendingProductName: text },
        });
        await sendReply(phone, withCancel(SELLER_TEXT.askPrice(text)));
        return;
      }

      // Waiting for the product price
      if (user.state === 'ADDING_PRODUCT_PRICE') {
        if (command === 'CANCEL') {
          await prisma.user.update({
            where: { id: user.id },
            data: { state: 'BROWSING', pendingProductName: null },
          });
          await staffSend(SELLER_TEXT.cancelled);
          return;
        }

        const price = Math.round(Number(text) * 100) / 100;
        if (!Number.isFinite(price) || price <= 0 || price > 100000) {
          await sendReply(phone, withCancel(SELLER_TEXT.invalidPrice));
          return;
        }

        const productName = user.pendingProductName;
        if (!productName) {
          await prisma.user.update({
            where: { id: user.id },
            data: { state: 'BROWSING', pendingProductName: null },
          });
          await staffSend(SELLER_TEXT.cancelled);
          return;
        }

        const product = await prisma.product.create({
          data: {
            name: productName,
            price,
            sellerId: user.id,
            translations: { create: [{ language: user.language, name: productName }] },
            categoryId: user.categoryId, // the seller's kind of product
            approval: 'DRAFT', // goes to the admin when the seller taps "Send all to admin"
          },
        });

        // Next step: a short description (or Skip), then the photo
        await prisma.user.update({
          where: { id: user.id },
          data: {
            state: 'ADDING_PRODUCT_DESCRIPTION',
            pendingProductName: null,
            pendingProductId: product.id,
          },
        });
        await sendReply(phone, {
          text: SELLER_TEXT.askDescription(productName),
          buttons: [
            { id: 'SKIP', title: SELLER_TEXT.btnSkip },
            { id: 'CANCEL', title: bt(user.language).cancel },
          ],
        });
        return;
      }

      // Waiting for the product description (colour, size, material ...) or Skip
      if (user.state === 'ADDING_PRODUCT_DESCRIPTION') {
        const productId = user.pendingProductId;
        if (command === 'CANCEL' || !productId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { state: 'BROWSING', pendingProductId: null },
          });
          await staffSend(productId ? SELLER_TEXT.photoLater(productId) : SELLER_TEXT.cancelled);
          return;
        }
        if (command !== 'SKIP') {
          if (message.type !== 'text' || text.length < 2 || text.length > 300) {
            await sendReply(phone, {
              text: SELLER_TEXT.invalidDescription,
              buttons: [
                { id: 'SKIP', title: SELLER_TEXT.btnSkip },
                { id: 'CANCEL', title: bt(user.language).cancel },
              ],
            });
            return;
          }
          await prisma.product.updateMany({
            where: { id: productId, sellerId: user.id },
            data: { description: text },
          });
        }
        // Next step: the photo (the product stays hidden until it has one and is approved)
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'ADDING_PRODUCT_PHOTO' },
        });
        const product = await prisma.product.findUnique({ where: { id: productId } });
        await sendReply(phone, withCancel(SELLER_TEXT.askPhoto(productId, product?.name ?? '')));
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
          await staffSend(productId ? SELLER_TEXT.photoLater(productId) : SELLER_TEXT.cancelled);
          return;
        }
        if (message.type !== 'image') {
          await sendReply(phone, withCancel(SELLER_TEXT.needPhoto));
          return;
        }
        const key = await saveIncomingImage(message);
        if (!key) {
          await sendReply(phone, withCancel(SELLER_TEXT.photoFailed));
          return;
        }

        // A new photo means the admin checks the product again
        const changed = await prisma.product.updateMany({
          where: { id: productId, sellerId: user.id },
          // A new photo means the admin checks the product again, after "Send all to admin"
          data: { imageKey: key, approval: 'DRAFT' },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'BROWSING', pendingProductId: null },
        });
        if (changed.count === 0) {
          await sendReply(phone, SELLER_TEXT.productNotFound(productId));
          return;
        }
        // The admin is not told yet: the seller adds more, then sends them all at once
        await sendReply(phone, {
          text: SELLER_TEXT.draftSaved(productId),
          buttons: [
            { id: 'ADD', title: SELLER_TEXT.btnAddAnother },
            { id: 'SUBMIT', title: SELLER_TEXT.btnSubmit },
          ],
        });
        return;
      }

      // Waiting for the seller's UPI QR code photo
      if (user.state === 'SETTING_UPI_QR') {
        if (command === 'CANCEL') {
          await prisma.user.update({ where: { id: user.id }, data: { state: 'BROWSING' } });
          await staffSend(SELLER_TEXT.qrCancelled);
          return;
        }
        if (message.type !== 'image') {
          await sendReply(phone, withCancel(SELLER_TEXT.qrNeedPhoto));
          return;
        }
        const key = await saveIncomingImage(message);
        if (!key) {
          await sendReply(phone, withCancel(SELLER_TEXT.photoFailed));
          return;
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { upiQrKey: key, state: 'BROWSING' },
        });
        await staffSend(SELLER_TEXT.qrSaved);
        return;
      }

      // Normal seller commands
      if (user.state === 'BROWSING') {
        if (command === 'ADD') {
          // Every product goes into the seller's category, so that must be chosen first
          if (!user.categoryId) {
            await staffSend(await categoryChoiceReply(user.language, SELLER_TEXT.needCategory));
            return;
          }
          await prisma.user.update({
            where: { id: user.id },
            data: { state: 'ADDING_PRODUCT_NAME', pendingProductName: null },
          });
          await sendReply(phone, withCancel(SELLER_TEXT.askName));
          return;
        }

        // SUBMIT: send all finished new products to the admin in one message
        if (command === 'SUBMIT') {
          await staffSend(await submitProducts(user));
          return;
        }

        if (command === 'MYCATEGORY') {
          await staffSend(await categoryChoiceReply(user.language));
          return;
        }

        // MYLINK: the link the seller shares with customers (asks the shop's state the first time)
        if (command === 'MYLINK') {
          await staffSend(user.shopLanguage ? await shopLinkReply(user) : shopStateReply());
          return;
        }
        if (command === 'SHOPSTATE') {
          await staffSend(shopStateReply());
          return;
        }
        // SHOPLANG OR/AS/HI/EN: the shop's state, picked from the state list
        const shopLangMatch = command.match(/^SHOPLANG\s+(EN|HI|OR|AS)$/);
        if (shopLangMatch) {
          const code = shopLangMatch[1].toLowerCase();
          await prisma.user.update({ where: { id: user.id }, data: { shopLanguage: code } });
          const local = Object.values(LANGUAGES).find((l) => l.code === code && code !== 'en');
          const choice = local ? `English + ${local.label}` : 'English';
          await staffSend(await shopLinkReply(user, SHOP_TEXT.stateSaved(choice)));
          return;
        }
        if (command === 'MYPRODUCTS') {
          const mine = await prisma.product.findMany({
            where: { sellerId: user.id },
            orderBy: { id: 'asc' },
          });
          if (mine.length === 0) {
            await staffSend(SELLER_TEXT.noProducts);
          } else {
            const lines = mine.map(
              (p) =>
                `#${p.id} ${p.name} - ₹${p.price} - ${SELLER_TEXT.stockLabel(p.stock)}` +
                ` - ${p.imageKey ? SELLER_TEXT.approval(p.approval) : SELLER_TEXT.noPhoto(p.id)}` +
                `${p.isActive ? '' : ' ' + SELLER_TEXT.hiddenTag}`
            );
            await staffSend(`${SELLER_TEXT.myProductsTitle}\n${lines.join('\n')}`);
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
            await staffSend(SELLER_TEXT.noOrders);
          } else {
            const lines = items.map((it) => {
              const who = it.order.customer.name ?? it.order.customer.phone;
              const lineTotal = Number(it.unitPrice) * it.quantity;
              return SELLER_TEXT.orderLine(
                it.orderId,
                `${it.product.name} x ${it.quantity}`,
                lineTotal,
                it.status,
                `${who} (${it.order.customer.phone})`
              );
            });
            await staffSend(`${SELLER_TEXT.myOrdersTitle}\n${lines.join('\n')}`);
          }
          return;
        }

        if (command === 'UPI') {
          await staffSend(SELLER_TEXT.upiCurrent(user.upiId, Boolean(user.upiQrKey)));
          return;
        }

        if (command === 'QR') {
          await prisma.user.update({ where: { id: user.id }, data: { state: 'SETTING_UPI_QR' } });
          await sendReply(phone, withCancel(SELLER_TEXT.askQr));
          return;
        }
        if (command === 'QR REMOVE') {
          await prisma.user.update({ where: { id: user.id }, data: { upiQrKey: null } });
          await staffSend(SELLER_TEXT.qrRemoved);
          return;
        }

        // DESC n text: set or change the description of an existing product
        const descMatch = text.match(/^DESC\s+#?(\d+)\s+([\s\S]{2,300})$/i);
        if (descMatch) {
          const productId = Number(descMatch[1]);
          const changed = await prisma.product.updateMany({
            where: { id: productId, sellerId: user.id },
            data: { description: descMatch[2].trim() },
          });
          await staffSend(
            changed.count === 0 ? SELLER_TEXT.productNotFound(productId) : SELLER_TEXT.descSet(productId)
          );
          return;
        }

        const photoMatch = command.match(/^PHOTO\s+#?(\d+)$/);
        if (photoMatch) {
          const productId = Number(photoMatch[1]);
          const own = await prisma.product.findFirst({ where: { id: productId, sellerId: user.id } });
          if (!own) {
            await staffSend(SELLER_TEXT.productNotFound(productId));
            return;
          }
          await prisma.user.update({
            where: { id: user.id },
            data: { state: 'ADDING_PRODUCT_PHOTO', pendingProductId: productId },
          });
          await sendReply(phone, withCancel(SELLER_TEXT.askPhotoFor(productId)));
          return;
        }
        // "UPI name@bank", or just "name@bank" on its own (sellers often forget the word UPI)
        const upiMatch =
          text.match(/^UPI\s+(\S+)$/i) ?? text.match(/^([A-Za-z0-9._-]{2,64}@[A-Za-z]{2,32})$/);
        if (upiMatch) {
          const upi = upiMatch[1].trim();
          // A UPI ID looks like name@bank. Card and account numbers have no "@", so they are rejected.
          // Also refuse the example from our own messages, so nobody saves it by mistake
          if (!/^[A-Za-z0-9._-]{2,64}@[A-Za-z]{2,32}$/.test(upi) || /^yourname@/i.test(upi)) {
            await staffSend(SELLER_TEXT.upiInvalid);
            return;
          }
          await prisma.user.update({ where: { id: user.id }, data: { upiId: upi } });
          await staffSend(SELLER_TEXT.upiSet(upi));
          return;
        }

        const stockMatch = command.match(/^STOCK\s+#?(\d+)\s+(\d+|OFF)$/);
        if (stockMatch) {
          const productId = Number(stockMatch[1]);
          const amount = stockMatch[2] === 'OFF' ? null : Number(stockMatch[2]);
          if (amount !== null && amount > 100000) {
            await staffSend(SELLER_TEXT.stockInvalid);
            return;
          }
          const changed = await prisma.product.updateMany({
            where: { id: productId, sellerId: user.id },
            data: { stock: amount },
          });
          await staffSend(
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
            await staffSend(SELLER_TEXT.invalidPrice);
            return;
          }
          const changed = await prisma.product.updateMany({
            where: { id: productId, sellerId: user.id },
            data: { price: newPrice },
          });
          await staffSend(
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
          await staffSend(
            changed.count === 0
              ? SELLER_TEXT.productNotFound(productId)
              : makeActive
                ? SELLER_TEXT.shown(productId)
                : SELLER_TEXT.hidden(productId)
          );
          return;
        }

        if (command === 'MYPURCHASES') {
          await staffSend(await customerOrders(user.id, user.language));
          return;
        }

        const paymentMatch = command.match(/^(RECEIVED|NOTRECEIVED)\s+#?(\d+)$/);
        if (paymentMatch) {
          await staffSend(
            await decidePayment(user.id, Number(paymentMatch[2]), paymentMatch[1] === 'RECEIVED')
          );
          return;
        }

        const statusMatch = command.match(/^(CONFIRM|SHIP|DELIVER)\s+#?(\d+)$/);
        if (statusMatch) {
          await staffSend(
            await updateOrderStatus(user.id, Number(statusMatch[2]), statusMatch[1])
          );
          return;
        }
        // HELP: the full list of typed commands (also the last row of the seller menu)
        if (command === 'HELP') {
          await staffSend(SELLER_TEXT.help);
          return;
        }
        // SELLER: the everyday seller actions as a tap list
        if (command === 'SELLER') {
          await staffSend({
            text: SELLER_TEXT.menuBody,
            list: {
              button: SELLER_TEXT.btnMenu,
              rows: [
                { id: 'MYLINK', title: SHOP_TEXT.rowLink },
                { id: 'ADD', title: SELLER_TEXT.btnAdd },
                { id: 'MYPRODUCTS', title: SELLER_TEXT.rowProducts },
                { id: 'MYORDERS', title: SELLER_TEXT.btnOrders },
                { id: 'UPI', title: SELLER_TEXT.rowUpi },
                { id: 'QR', title: SELLER_TEXT.rowQr },
                { id: 'MYPURCHASES', title: SELLER_TEXT.rowPurchases },
                { id: 'MAINMENU', title: SELLER_TEXT.rowShop },
                { id: 'SUBMIT', title: SELLER_TEXT.btnSubmit },
                { id: 'MYCATEGORY', title: SELLER_TEXT.rowCategory },
              ],
            },
          });
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
          await staffSend(REG_TEXT.noPending);
        } else {
          // One message per request, each with Approve / Reject buttons
          await staffSend(
            waiting.slice(0, 10).map((u) => ({
              text: REG_TEXT.sellerRequestCard(u.id, u.shopName ?? '-', u.phone),
              buttons: [
                { id: `APPROVE ${u.id}`, title: STAFF_BUTTONS.approve },
                { id: `REJECT ${u.id}`, title: STAFF_BUTTONS.reject },
              ],
            }))
          );
        }
        return;
      }

      const blockMatch = command.match(/^(BLOCK|UNBLOCK)\s+#?(\d+)$/);
      if (blockMatch) {
        const targetId = Number(blockMatch[2]);
        await staffSend(
          blockMatch[1] === 'BLOCK'
            ? await blockSeller(targetId)
            : await unblockSeller(targetId)
        );
        return;
      }
      if (command === 'SALES') {
        await staffSend(await salesReport());
        return;
      }

      // A seller's batch of new products: look at them one by one, or approve them all
      const reviewMatch = command.match(/^(REVIEW|APPROVEALL)\s+#?(\d+)$/);
      if (reviewMatch) {
        const sellerId = Number(reviewMatch[2]);
        await staffSend(
          reviewMatch[1] === 'REVIEW'
            ? await reviewProducts(phone, sellerId)
            : await approveAllProducts(sellerId)
        );
        return;
      }

      if (command === 'CATEGORIES') {
        await staffSend(await categoriesReport(user.language));
        return;
      }
      const addCategoryMatch = text.match(/^ADDCATEGORY\s+(.+)$/i);
      if (addCategoryMatch) {
        await staffSend(await addCategory(addCategoryMatch[1]));
        return;
      }

      if (command === 'PENDINGPRODUCTS') {
        await staffSend(await pendingProducts(phone));
        return;
      }
      const productDecisionMatch = command.match(/^(APPROVEPRODUCT|REJECTPRODUCT)\s+#?(\d+)$/);
      if (productDecisionMatch) {
        await staffSend(
          await decideProduct(
            Number(productDecisionMatch[2]),
            productDecisionMatch[1] === 'APPROVEPRODUCT'
          )
        );
        return;
      }

      const openMatch = command.match(/^OPENORDERS\s+#?(\d+)$/);
      if (openMatch) {
        await staffSend(await openOrders(Number(openMatch[1])));
        return;
      }

      const adminCancelMatch = command.match(/^ADMINCANCEL\s+#?(\d+)$/);
      if (adminCancelMatch) {
        await staffSend(await adminCancelOrder(Number(adminCancelMatch[1])));
        return;
      }

      if (command === 'MAKEADMIN') {
        await staffSend(REG_TEXT.makeAdminUsage);
        return;
      }
      const makeAdminMatch = command.match(/^MAKEADMIN\s+\+?(\d{10,15})$/);
      if (makeAdminMatch) {
        await staffSend(await makeAdmin(makeAdminMatch[1]));
        return;
      }

      const decideMatch = command.match(/^(APPROVE|REJECT)\s+#?(\d+)$/);
      if (decideMatch) {
        await staffSend(
          await decideSeller(Number(decideMatch[2]), decideMatch[1] === 'APPROVE')
        );
        return;
      }
      // HELP: the full list of typed admin commands (also the last row of the admin menu)
      if (command === 'HELP') {
        await staffSend(REG_TEXT.adminHelp);
        return;
      }
      // ADMIN: the everyday admin actions as a tap list
      if (command === 'ADMIN') {
        await staffSend({
          text: REG_TEXT.adminMenuBody,
          list: {
            button: REG_TEXT.btnAdminMenu,
            rows: [
              { id: 'PENDINGPRODUCTS', title: REG_TEXT.rowProductsToCheck },
              { id: 'PENDINGSELLERS', title: REG_TEXT.rowSellerRequests },
              { id: 'SALES', title: REG_TEXT.rowSales },
              { id: 'MAINMENU', title: REG_TEXT.rowShop },
              { id: 'CATEGORIES', title: REG_TEXT.rowCategories },
            ],
          },
        });
        return;
      }
    }

    // ---- State: choosing a language ----
    if (user.state === 'CHOOSING_LANGUAGE') {
      const chosen = LANGUAGES[text];
      if (!chosen) {
        await sendReply(phone, await languageReplyFor(user));
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { language: chosen.code, state: 'BROWSING' },
      });
      setLang(chosen.code);
      await sendReply(phone, homeReply({ ...user, language: chosen.code }));
      return;
    }

    // While waiting for a quantity, an address or a shop name,
    // these typed commands leave that step automatically
    if (
      (user.state === 'CHOOSING_QUANTITY' ||
        user.state === 'ENTERING_ADDRESS' ||
        user.state === 'ENTERING_SHOP_NAME') &&
      ([
        'MENU', 'CART', 'CLEAR', 'MYORDERS', 'ADDRESS', 'ORDER', 'SELL',
        'MAINMENU', 'REMOVEMENU', 'PLACEORDER', 'SHOPNOW',
      ].includes(command) ||
        /^(REMOVE|CANCELORDER|QR|PRODUCT|BUY|ORDERINFO|MENU)\s+#?\d+$/.test(command) ||
        /^CATEGORY\s+#?\d+(\s+\d+)?$/.test(command) ||
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
        await sendReply(phone, welcomeReply(user.language, A.cancelled));
        return;
      }
      if (text.length < 10 || text.length > 200) {
        await sendReply(phone, withCancel(A.invalid));
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { address: text, state: 'BROWSING' },
      });
      // If there is something in the cart, go straight to the order check
      const cartCount = await prisma.cartItem.count({ where: { cart: { customerId: user.id } } });
      await sendReply(
        phone,
        cartCount > 0
          ? await confirmOrderReply(user.id, user.language, text)
          : welcomeReply(user.language, A.saved)
      );
      return;
    }

    // ---- State: entering the shop name (seller registration) ----
    if (user.state === 'ENTERING_SHOP_NAME') {
      if (command === 'CANCEL') {
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'BROWSING' },
        });
        await sendReply(phone, welcomeReply(user.language, REG_TEXT.cancelled));
        return;
      }
      if (text.length < 2 || text.length > 40) {
        await sendReply(phone, withCancel(REG_TEXT.invalidShop));
        return;
      }
      // Next: what kind of products they make (the request goes to the admin after that)
      await prisma.user.update({
        where: { id: user.id },
        data: { shopName: text, state: 'CHOOSING_CATEGORY' },
      });
      await sendReply(phone, await categoryChoiceReply(user.language));
      return;
    }

    // ---- State: choosing a category (typed text instead of a tap: show the list again) ----
    if (user.state === 'CHOOSING_CATEGORY') {
      if (command === 'CANCEL') {
        await prisma.user.update({ where: { id: user.id }, data: { state: 'BROWSING' } });
        await sendReply(phone, homeReply(user));
        return;
      }
      await sendReply(phone, await categoryChoiceReply(user.language));
      return;
    }

    // ---- State: choosing a quantity ----
    if (user.state === 'CHOOSING_QUANTITY') {
      if (command === 'CANCEL') {
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'BROWSING', pendingProductId: null },
        });
        await sendReply(phone, welcomeReply(user.language, T.cancelled));
        return;
      }

      const qty = Number(text);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        await sendReply(phone, { ...qtyReply(user.language, ''), text: T.invalidQty });
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
        await sendReply(phone, welcomeReply(user.language, T.invalidProduct));
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
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'BROWSING', pendingProductId: null },
        });
        await sendReply(phone, welcomeReply(user.language, st(user.language).unavailable(productLabel)));
        return;
      }
      if (product.stock !== null && already + qty > product.stock) {
        // Stay in the quantity step so a smaller number can be chosen
        const left = Math.max(product.stock - already, 0);
        await sendReply(phone, {
          ...qtyReply(user.language, productLabel),
          text: st(user.language).onlyLeft(productLabel, left),
        });
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
      await sendReply(phone, afterAddReply(user.language, B.added(productLabel, qty)));
      return;
    }

    // ---- State: browsing ----
    // MENU: the categories (older "MENU 2" links also land here)
    if (/^MENU(?:\s+\d+)?$/.test(command)) {
      await sendReply(phone, await productListReply(user.language));
      return;
    }

    // CATEGORY n (or CATEGORY n 2 for the next page): the products of one category
    const categoryMatch = command.match(/^CATEGORY\s+#?(\d+)(?:\s+(\d+))?$/);
    if (categoryMatch) {
      await sendReply(
        phone,
        await categoryProductsReply(user.language, Number(categoryMatch[1]), Number(categoryMatch[2] ?? 1))
      );
      return;
    }

    if (command === 'MAINMENU') {
      await sendReply(phone, mainMenuReply(user));
      return;
    }

    // SHOPNOW: the link to the shop's web page. Each tap makes a new secret for this customer
    // (valid 24 hours), so the page knows who is ordering and an old link stops working.
    if (command === 'SHOPNOW') {
      if (myShop?.role !== 'SELLER' || !myShop.shopCode) {
        await sendReply(phone, await productListReply(user.language));
        return;
      }
      const token = crypto.randomBytes(18).toString('base64url');
      await prisma.user.update({
        where: { id: user.id },
        data: { webToken: token, webTokenAt: new Date() },
      });
      await sendReply(phone, {
        text: B.clickBelow(myShop.shopName ?? myShop.shopCode),
        link: { title: B.clickHere, url: publicUrl(`/shop/${myShop.shopCode}?t=${token}`) },
      });
      return;
    }

    // PRODUCT n: one product's photo with Add to cart / Back
    const productMatch = command.match(/^PRODUCT\s+#?(\d+)$/);
    if (productMatch) {
      await sendReply(phone, await productReply(user.language, Number(productMatch[1])));
      return;
    }

    // BUY n: start choosing the quantity for product n
    const buyMatch = command.match(/^BUY\s+#?(\d+)$/);
    if (buyMatch) {
      const product = await prisma.product.findUnique({
        where: { id: Number(buyMatch[1]) },
        include: { translations: true },
      });
      if (!product || !product.isActive || product.approval !== 'APPROVED' || product.stock === 0) {
        await sendReply(phone, welcomeReply(user.language, T.invalidProduct));
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'CHOOSING_QUANTITY', pendingProductId: product.id },
      });
      await sendReply(phone, qtyReply(user.language, localName(product, user.language)));
      return;
    }

    if (command === 'CART') {
      await sendReply(phone, await cartReply(user.id, user.language));
      return;
    }

    if (command === 'REMOVEMENU') {
      await sendReply(phone, await removeMenuReply(user.id, user.language));
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
      await sendReply(phone, await ordersListReply(user.id, user.language));
      return;
    }

    const orderInfoMatch = command.match(/^ORDERINFO\s+#?(\d+)$/);
    if (orderInfoMatch) {
      await sendReply(phone, await orderInfoReply(user.id, user.language, Number(orderInfoMatch[1])));
      return;
    }

    const cancelMatch = command.match(/^CANCELORDER\s+#?(\d+)$/);
    if (cancelMatch) {
      await sendReply(phone, {
        text: await cancelOrder(user.id, user.language, Number(cancelMatch[1])),
        buttons: nextButtons(user.language),
      });
      return;
    }

    // PAID n (the "I have paid" button) or PAID n <transaction number>; plain PAID shows how
    if (/^PAID(\s|$)/.test(command)) {
      const paidMatch = text.match(/^PAID\s+#?(\d+)(?:\s+(\S+))?$/i);
      await sendReply(
        phone,
        paidMatch
          ? await reportPaid(user.id, user.language, Number(paidMatch[1]), paidMatch[2])
          : uf(user.language).paidUsage
      );
      return;
    }

    // QR n: the QR code for paying order n, with an "I have paid" button
    const qrMatch = command.match(/^QR\s+#?(\d+)$/);
    if (qrMatch) {
      await sendReply(phone, await paymentQrReply(user.id, user.language, Number(qrMatch[1])));
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
      await sendReply(phone, withCancel(REG_TEXT.askShop));
      return;
    }

    if (command === 'ADDRESS') {
      await prisma.user.update({
        where: { id: user.id },
        data: { state: 'ENTERING_ADDRESS' },
      });
      const A = ad(user.language);
      await sendReply(phone, withCancel(user.address ? A.askChange(user.address) : A.ask));
      return;
    }

    // ORDER (Place order): check the cart and the address first; PLACEORDER really places it
    if (command === 'ORDER' || command === 'PLACEORDER') {
      const cartCount = await prisma.cartItem.count({ where: { cart: { customerId: user.id } } });
      if (cartCount === 0) {
        await sendReply(phone, await cartReply(user.id, user.language));
        return;
      }
      // First order: ask for the delivery address (the only thing that must be typed)
      if (!user.address) {
        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'ENTERING_ADDRESS' },
        });
        await sendReply(phone, withCancel(ad(user.language).ask));
        return;
      }
      await sendReply(
        phone,
        command === 'ORDER'
          ? await confirmOrderReply(user.id, user.language, user.address)
          : await placeOrder(user.id, user.language, user.address)
      );
      return;
    }

    // A typed number picks a product from the list (same order as MENU)
    const n = Number(text);
    if (Number.isInteger(n) && n >= 1) {
      const products = await loadProducts();
      const product = products[n - 1];
      await sendReply(
        phone,
        product ? await productReply(user.language, product.id) : welcomeReply(user.language, T.invalidProduct)
      );
      return;
    }

    // Anything else (for example "hi"): the home screen for this person's role
    await sendReply(phone, homeReply(user));
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
    // Each webhook call gets its own language setting (handleWebhook sets the sender's)
    await inLang('en', () => handleWebhook(req.body));
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
