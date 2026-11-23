// Sample data for trying the admin Statistics: 10 sellers (2 in each village), each with a
// different kind of bag, products, and orders over the last 2 months (fast and slow sellers,
// orders left waiting, a payment complaint, cancelled orders).
//
//   npm.cmd run sample -- add       add the sample sellers, customers, products and orders
//   npm.cmd run sample -- remove    remove all of it again (real data is not touched)
//
// Sample people have no WhatsApp number ("sample-seller-01"), so the app never messages anyone.
// Their products have no photo: they count in the statistics, but customers do not see them.
import crypto from 'crypto';
import { prisma } from '../src/db';

const SELLER = 'sample-seller-';
const CUSTOMER = 'sample-customer-';
const NEW_CATEGORIES = ['Jute bags', 'Clutches', 'Tote bags', 'Sling bags', 'Backpacks', 'Pouches', 'Laptop bags'];

type Quality = 'great' | 'good' | 'ok' | 'slow' | 'poor';
// state, shop, seller name, kind of bag, how well they work, local language, products (name, ₹)
const SELLERS: [string, string, string, string, Quality, string, [string, number][]][] = [
  ['Assam', 'Majuli Jute Bags', 'Rupa Bora', 'Jute bags', 'great', 'as', [['Jute shopping bag', 450], ['Jute lunch bag', 320], ['Printed jute tote', 560]]],
  ['Assam', 'Kamrup Pouch Works', 'Dipak Das', 'Pouches', 'poor', 'as', [['Coin pouch', 150]]],
  ['Himachal Pradesh', 'Kullu Tote Studio', 'Sunita Thakur', 'Tote bags', 'good', 'hi', [['Kullu pattern tote', 750], ['Wool tote bag', 890]]],
  ['Himachal Pradesh', 'Pahadi Sling Bags', 'Ramesh Negi', 'Sling bags', 'slow', 'hi', [['Hemp sling bag', 640], ['Mini sling bag', 420]]],
  ['Madhya Pradesh', 'Chanderi Clutch House', 'Meena Ahirwar', 'Clutches', 'great', 'hi', [['Chanderi silk clutch', 980], ['Zari clutch', 1250], ['Party clutch', 860]]],
  ['Madhya Pradesh', 'Gond Wallet Corner', 'Anil Dhurve', 'Wallets', 'ok', 'hi', [['Gond art wallet', 380], ['Card wallet', 260]]],
  ['Odisha', 'Pattachitra Handbags', 'Lipika Sahoo', 'Handbags', 'good', 'or', [['Pattachitra handbag', 1100], ['Ikat handbag', 950]]],
  ['Odisha', 'Kusunpur Keychains', 'Bikash Jena', 'Keychains', 'poor', 'or', [['Wooden keychain', 90]]],
  ['Rajasthan', 'Bandhani Backpacks', 'Kavita Meena', 'Backpacks', 'great', 'hi', [['Bandhani backpack', 1350], ['Kids backpack', 780]]],
  ['Rajasthan', 'Sawai Laptop Bags', 'Mahesh Gurjar', 'Laptop bags', 'slow', 'hi', [['Leather laptop bag', 1600], ['Canvas laptop sleeve', 690]]],
];

// What kind of orders each seller has (age in days; the extra number is hours or days, see below)
type Kind = ['delivered' | 'complaint', number, number] | ['shipped' | 'confirmed', number] | ['paid' | 'reported' | 'waiting' | 'cancelled', number];
const ORDERS: Record<Quality, Kind[]> = {
  // delivered: [age, hours from money received to shipped]
  great: [['delivered', 3, 8], ['delivered', 7, 12], ['delivered', 11, 6], ['delivered', 16, 18], ['delivered', 22, 10], ['delivered', 40, 14], ['delivered', 50, 9], ['shipped', 1], ['confirmed', 0.5], ['cancelled', 9]],
  good: [['delivered', 5, 28], ['delivered', 12, 36], ['delivered', 19, 22], ['delivered', 45, 30], ['paid', 0.3], ['waiting', 1], ['cancelled', 14]],
  // confirmed / shipped: [days since that step] (old ones count as "waiting too long")
  ok: [['delivered', 8, 60], ['delivered', 25, 70], ['confirmed', 4], ['reported', 1]],
  slow: [['delivered', 10, 130], ['delivered', 35, 110], ['shipped', 10], ['confirmed', 5], ['complaint', 18, 100], ['cancelled', 6]],
  poor: [['confirmed', 6], ['waiting', 3], ['complaint', 20, 140]],
};
const LAST_MESSAGE_DAYS: Record<Quality, number> = { great: 0, good: 1, ok: 3, slow: 6, poor: 12 };

const day = 24 * 3600 * 1000;
const ago = (days: number) => new Date(Date.now() - days * day);
const plusHours = (d: Date, h: number) => new Date(d.getTime() + h * 3600 * 1000);

async function freeShopCode(): Promise<string> {
  for (;;) {
    const code = String(1000 + crypto.randomInt(9000));
    if (!(await prisma.user.findUnique({ where: { shopCode: code } }))) return code;
  }
}

async function add() {
  if (await prisma.user.count({ where: { phone: { startsWith: SELLER } } })) {
    console.log('Sample data is already there. Run "npm.cmd run sample -- remove" first to make it again.');
    return;
  }
  for (const name of NEW_CATEGORIES) {
    if (!(await prisma.category.findFirst({ where: { name } }))) await prisma.category.create({ data: { name } });
  }
  const categories = new Map((await prisma.category.findMany()).map((c) => [c.name, c.id]));

  const customers = [];
  for (let i = 1; i <= 6; i++) {
    customers.push(
      await prisma.user.create({
        data: { phone: `${CUSTOMER}${String(i).padStart(2, '0')}`, name: `Sample customer ${i}`, role: 'CUSTOMER', state: 'BROWSING', language: 'en' },
      })
    );
  }

  let orderCount = 0;
  for (const [n, [state, shop, person, kind, quality, lang, products]] of SELLERS.entries()) {
    const categoryId = categories.get(kind) ?? null;
    const seller = await prisma.user.create({
      data: {
        phone: `${SELLER}${String(n + 1).padStart(2, '0')}`,
        name: person,
        role: 'SELLER',
        sellerStatus: 'APPROVED',
        state: 'BROWSING',
        language: 'en',
        shopName: shop,
        shopCode: await freeShopCode(),
        shopLanguage: lang,
        sellerState: state,
        categoryId,
        upiId: `sample${n + 1}@fakebank`,
        lastMessageAt: ago(LAST_MESSAGE_DAYS[quality]),
        createdAt: ago(60),
      },
    });
    const made = [];
    for (const [pname, price] of products) {
      made.push(
        await prisma.product.create({
          data: { name: pname, price, sellerId: seller.id, stock: 5 + crypto.randomInt(15), approval: 'APPROVED', categoryId, description: 'Sample product' },
        })
      );
    }

    for (const [k, o] of ORDERS[quality].entries()) {
      const product = made[k % made.length];
      const quantity = 1 + (k % 2);
      const amount = Number(product.price) * quantity;
      const customer = customers[(n + k) % customers.length];
      const kindName = o[0];
      let createdAt = ago(o[1]);
      let orderStatus: 'PENDING' | 'PAID' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' = 'PENDING';
      let payStatus: 'INITIATED' | 'AWAITING_CONFIRMATION' | 'SUCCESS' | 'CANCELLED' = 'INITIATED';
      let paidAt: Date | null = null, confirmedAt: Date | null = null, shippedAt: Date | null = null, deliveredAt: Date | null = null;
      let complaint = false;
      if (kindName === 'delivered' || kindName === 'complaint') {
        paidAt = plusHours(createdAt, 3);
        confirmedAt = plusHours(paidAt, 2);
        shippedAt = plusHours(paidAt, o[2]);
        deliveredAt = plusHours(shippedAt, 48);
        // keep every step in the past
        const late = deliveredAt.getTime() - Date.now();
        if (late > 0) {
          createdAt = new Date(createdAt.getTime() - late - 3600 * 1000);
          [paidAt, confirmedAt, shippedAt, deliveredAt] = [paidAt, confirmedAt, shippedAt, deliveredAt].map((d) => new Date(d.getTime() - late - 3600 * 1000));
        }
        orderStatus = 'DELIVERED';
        payStatus = 'SUCCESS';
        complaint = kindName === 'complaint';
      } else if (kindName === 'shipped' || kindName === 'confirmed') {
        const stepAt = ago(o[1]);
        createdAt = new Date(stepAt.getTime() - 30 * 3600 * 1000);
        paidAt = plusHours(createdAt, 3);
        confirmedAt = kindName === 'confirmed' ? stepAt : plusHours(paidAt, 2);
        if (kindName === 'shipped') shippedAt = stepAt;
        orderStatus = kindName === 'shipped' ? 'SHIPPED' : 'CONFIRMED';
        payStatus = 'SUCCESS';
      } else if (kindName === 'paid') {
        paidAt = plusHours(createdAt, 1);
        orderStatus = 'PAID';
        payStatus = 'SUCCESS';
      } else if (kindName === 'reported') {
        payStatus = 'AWAITING_CONFIRMATION';
      } else if (kindName === 'cancelled') {
        orderStatus = 'CANCELLED';
        payStatus = 'CANCELLED';
      }
      await prisma.order.create({
        data: {
          customerId: customer.id,
          status: orderStatus,
          total: amount,
          deliveryAddress: `Sample address ${k + 1}, ${state}`,
          paidAt,
          confirmedAt,
          shippedAt,
          deliveredAt,
          createdAt,
          items: { create: [{ productId: product.id, sellerId: seller.id, quantity, unitPrice: product.price, status: orderStatus }] },
          payments: {
            create: [
              {
                amount,
                method: 'UPI_DIRECT',
                status: payStatus,
                createdAt,
                ...(complaint ? { disputedAt: plusHours(createdAt, 30), disputeResult: 'PAID' } : {}),
              },
            ],
          },
        },
      });
      orderCount++;
    }
    console.log(`  ${shop.padEnd(24)} ${state.padEnd(17)} ${kind.padEnd(12)} (${quality})`);
  }
  console.log(`\nAdded 10 sample sellers, 6 sample customers and ${orderCount} orders. Open the admin page > Statistics.`);
  console.log('Remove it all with: npm.cmd run sample -- remove');
}

async function remove() {
  const people = await prisma.user.findMany({ where: { OR: [{ phone: { startsWith: SELLER } }, { phone: { startsWith: CUSTOMER } }] }, select: { id: true } });
  const ids = people.map((p) => p.id);
  if (!ids.length) {
    console.log('There is no sample data.');
    return;
  }
  const orders = (
    await prisma.order.findMany({
      where: { OR: [{ customerId: { in: ids } }, { items: { some: { sellerId: { in: ids } } } }] },
      select: { id: true },
    })
  ).map((o) => o.id);
  const products = (await prisma.product.findMany({ where: { sellerId: { in: ids } }, select: { id: true } })).map((p) => p.id);
  await prisma.$transaction([
    prisma.payment.deleteMany({ where: { orderId: { in: orders } } }),
    prisma.orderItem.deleteMany({ where: { orderId: { in: orders } } }),
    prisma.order.deleteMany({ where: { id: { in: orders } } }),
    prisma.cartItem.deleteMany({ where: { productId: { in: products } } }),
    prisma.productTranslation.deleteMany({ where: { productId: { in: products } } }),
    prisma.product.deleteMany({ where: { id: { in: products } } }),
    prisma.sellerWarning.deleteMany({ where: { sellerId: { in: ids } } }),
    prisma.user.updateMany({ where: { shopId: { in: ids } }, data: { shopId: null } }),
    prisma.user.deleteMany({ where: { id: { in: ids } } }),
  ]);
  // the extra bag kinds, if nothing uses them now
  const unused = await prisma.category.deleteMany({ where: { name: { in: NEW_CATEGORIES }, products: { none: {} }, sellers: { none: {} } } });
  console.log(`Removed ${ids.length} sample people, ${products.length} products, ${orders.length} orders and ${unused.count} unused categories.`);
}

const what = process.argv[2];
(what === 'add' ? add() : what === 'remove' ? remove() : Promise.resolve(console.log('Usage: npm.cmd run sample -- add | remove')))
  .catch((err) => {
    console.error('Sample data failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
