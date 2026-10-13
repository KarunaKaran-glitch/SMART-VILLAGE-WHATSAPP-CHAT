import 'dotenv/config';
import express, { Request, Response } from 'express';
import { prisma } from './db';
import { LANGUAGES, WELCOME, languageMenu, t } from './messages';
import { ot } from './orderText';
import { SELLER_TEXT } from './sellerText';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// For now this only prints the reply. Later it will send it through the WhatsApp API.
async function sendReply(to: string, text: string) {
  console.log(`>> Reply to ${to}:\n${text}\n`);
}

type Named = { name: string; translations: { language: string; name: string }[] };

// Picks the product name in the customer's language, or the default name
function localName(product: Named, language: string): string {
  const tr = product.translations.find((x) => x.language === language);
  return tr ? tr.name : product.name;
}

function loadProducts() {
  return prisma.product.findMany({
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
  return `${T.cartTitle}\n${lines.join('\n')}\n${T.cartTotal}: ₹${total}`;
}

// Turns the cart into an order and empties the cart
async function placeOrder(userId: number, language: string): Promise<string> {
  const T = t(language);
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) return T.emptyCart;

  let total = 0;
  for (const item of cart.items) {
    total += Number(item.product.price) * item.quantity;
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        customerId: userId,
        total,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            sellerId: item.product.sellerId,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
        },
      },
    });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  return ot(language).placed(order.id, total);
}

app.get('/', (_req: Request, res: Response) => {
  res.send('WhatsApp Marketplace server is running');
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

// WhatsApp sends incoming messages here
app.post('/webhook', async (req: Request, res: Response) => {
  // Reply to Meta immediately so it does not retry
  res.sendStatus(200);

  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message) return; // not a message (for example a delivery status)

    const phone: string = message.from;
    const name: string | undefined = value?.contacts?.[0]?.profile?.name;
    const text: string = (message.text?.body ?? '').trim();
    const command = text.toUpperCase();

    console.log('Message from:', phone, '| text:', text);

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
    if (user.role === 'SELLER' && user.state === 'BROWSING') {
      if (command === 'SELLER' || command === 'HELP') {
        await sendReply(phone, SELLER_TEXT.help);
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

    if (command === 'ORDER') {
      await sendReply(phone, await placeOrder(user.id, user.language));
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
      await sendReply(phone, T.askQty(localName(product, user.language)));
      return;
    }

    // Anything else
    await sendReply(phone, T.help);
  } catch (err) {
    console.error('Webhook error:', err);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});