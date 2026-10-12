import { prisma } from './db';

async function main() {
  const count = await prisma.product.count();
  if (count > 0) {
    console.log('Products already exist, skipping seed.');
    return;
  }

  const seller = await prisma.user.upsert({
    where: { phone: '919000000001' },
    update: { role: 'SELLER' },
    create: { phone: '919000000001', name: 'Test Seller', role: 'SELLER' },
  });

  await prisma.product.create({
    data: {
      name: 'Rice 1kg',
      price: 60,
      sellerId: seller.id,
      translations: {
        create: [
          { language: 'en', name: 'Rice 1kg' },
          { language: 'ta', name: 'அரிசி 1 கிலோ' },
          { language: 'hi', name: 'चावल 1 किलो' },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Honey 500g',
      price: 250,
      sellerId: seller.id,
      translations: {
        create: [
          { language: 'en', name: 'Honey 500g' },
          { language: 'ta', name: 'தேன் 500 கிராம்' },
          { language: 'hi', name: 'शहद 500 ग्राम' },
        ],
      },
    },
  });

  console.log('Seed done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());