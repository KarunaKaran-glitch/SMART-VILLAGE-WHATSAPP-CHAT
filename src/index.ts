import 'dotenv/config';
import express, { Request, Response } from 'express';
import { prisma } from './db';
import { LANGUAGES, WELCOME, languageMenu, t } from './messages';
import { ot } from './orderText';
import { SELLER_TEXT } from './sellerText';
import { ct } from './cartEditText';
import { mo } from './myOrdersText';
import { ad } from './addressText';
import { cn, sellerCancelNotice } from './cancelText';
import { REG_TEXT } from './registerText';
import { st } from './stockText';

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
    where: {
      isActive: true,
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
    const pay = o.payments[0] ? `\n  ${M.pay(o.payments[0].status)}` : '';
    return `#${o.id} - ${M.status(o.status)} - ₹${o.total}\n${items}${pay}`;
  });
  return `${M.title}\n\n${blocks.join('\n\n')}`;
}

// Customer cancels an order, only while every item is still PENDING
async function cancelOrder(userId: number, language: string, orderId: number): Promise<string> {
  const C = cn(language);

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: { items: { include: { seller: true } } },
  });
  if (!order) return C.notFound(orderId);

  const allPending = order.items.every((i) => i.status === 'PENDING');
  if (order.status !== 'PENDING' || !allPending) return C.cannot(orderId);

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

// Thrown when a product has too little stock (or was hidden) while placing an order
class StockError extends Error {
  productId: number;
  constructor(productId: number) {
    super('Not enough stock');
    this.productId = productId;
  }
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

   let order: { id: number } | undefined;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Check and take stock first (all or nothing)
      for (const item of cart.items) {
        if (!item.product.isActive) throw new StockError(item.productId);
        if (item.product.stock !== null) {
          const taken = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (taken.count === 0) throw new StockError(item.productId);
        }
      }

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
      await tx.payment.create({
        data: { orderId: created.id, amount: total, method: 'COD' },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });
  } catch (err) {
    if (err instanceof StockError) {
      const p = await prisma.product.findUnique({
        where: { id: err.productId },
        include: { translations: true },
      });
      if (!p) return T.invalidProduct;
      const label = localName(p, language);
      const left = p.isActive ? (p.stock ?? 0) : 0;
      return left > 0 ? st(language).notEnough(label, left) : st(language).unavailable(label);
    }
    throw err;
  }
  if (!order) throw new Error('Order was not created');

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
    `Cash collected: ₹${Number(cash._sum.amount ?? 0)}`,
    `Sellers: ${sellers}, customers: ${customers}`,
    sellerLines.length > 0
      ? `Delivered sales per seller:\n${sellerLines.join('\n')}`
      : 'No delivered sales yet.',
  ].join('\n');
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
                          const lines = mine.map(
              (p) =>
                `#${p.id} ${p.name} - ₹${p.price} - stock: ${p.stock ?? 'unlimited'}${p.isActive ? '' : ' (hidden)'}`
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
          await sendReply(phone, SELLER_TEXT.upiCurrent(user.upiId));
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
        /^(REMOVE|CANCELORDER)\s+#?\d+$/.test(command))
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
      if (!product.isActive) {
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
      await sendReply(phone, T.askQty(localName(product, user.language)));
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
});