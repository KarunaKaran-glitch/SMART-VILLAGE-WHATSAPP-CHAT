import 'dotenv/config';
import express, { Request, Response } from 'express';
import { prisma } from './db';
import { LANGUAGES, WELCOME, languageMenu, t } from './messages';
import { ot } from './orderText';
import { SELLER_TEXT } from './sellerText';
import { ct } from './cartEditText';
import { mo } from './myOrdersText';
import { ad } from './addressText';

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

// Customer's last 5 orders with status
async function customerOrders(userId: number, language: string): Promise<string> {
  const M = mo(language);
  const orders = await prisma.order.findMany({
    where: { customerId: userId },
    include: { items: { include: { product: { include: { translations: true } } } } },
    orderBy: { id: 'desc' },
    take: 5,
  });
  if (orders.length === 0) return M.none;

  const blocks = orders.map((o) => {
    const items = o.items
      .map((i) => `  ${localName(i.product, language)} x ${i.quantity}`)
      .join('\n');
    return `#${o.id} - ${M.status(o.status)} - ₹${o.total}\n${items}`;
  });
  return `${M.title}\n\n${blocks.join('\n\n')}`;
}

// Turns the cart into an order, empties the cart, and tells each seller
async function placeOrder(userId: number, language: string, address: string): Promise<string> {
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
        deliveryAddress: address,
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

  // Tell each seller about their own items. A failure here must not break the order.
  try {
    const customer = await prisma.user.findUnique({ where: { id: userId } });
    const customerLabel = `${customer?.name ?? 'Customer'} (${customer?.phone})\nDeliver to: ${address}`;

    const items = await prisma.orderItem.findMany({
      where: { orderId: order.id },
      include: { product: true, seller: true },
    });

    const bySeller = new Map<string, string[]>();
    for (const it of items) {
      const lineTotal = Number(it.unitPrice) * it.quantity;
      const line = `${it.product.name} x ${it.quantity} = ₹${lineTotal}`;
      const list = bySeller.get(it.seller.phone) ?? [];
      list.push(line);
      bySeller.set(it.seller.phone, list);
    }

    for (const [sellerPhone, lines] of bySeller) {
      await sendReply(sellerPhone, SELLER_TEXT.newOrder(order.id, lines, customerLabel));
    }
  } catch (err) {
    console.error('Seller notification failed:', err);
  }

  return ot(language).placed(order.id, total);
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

        await prisma.user.update({
          where: { id: user.id },
          data: { state: 'BROWSING', pendingProductName: null },
        });
        await sendReply(phone, SELLER_TEXT.added(product.id, productName, price));
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
            const lines = mine.map((p) => `#${p.id} ${p.name} - ₹${p.price}`);
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