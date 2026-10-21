import { prisma } from './db';

// Sample handmade products for a new, empty database.
// They have no photo yet, so customers only see them after the seller sends
// PHOTO <number> and an admin sends APPROVEPRODUCT <number>.
async function main() {
  const count = await prisma.product.count();
  if (count > 0) {
    console.log('Products already exist, skipping seed.');
    return;
  }

  const seller = await prisma.user.upsert({
    where: { phone: '919000000001' },
    update: { role: 'SELLER' },
    create: { phone: '919000000001', name: 'Test Seller', role: 'SELLER', shopName: 'Test Shop' },
  });

  await prisma.product.create({
    data: {
      name: 'Jute Handbag',
      price: 450,
      sellerId: seller.id,
      translations: {
        create: [
          { language: 'en', name: 'Jute Handbag' },
          { language: 'or', name: 'ଝୋଟ ହ୍ୟାଣ୍ଡବ୍ୟାଗ' },
          { language: 'hi', name: 'जूट हैंडबैग' },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Embroidered Girls Bag',
      price: 350,
      sellerId: seller.id,
      translations: {
        create: [
          { language: 'en', name: 'Embroidered Girls Bag' },
          { language: 'or', name: 'ଏମ୍ବ୍ରଏଡରି ଝିଅମାନଙ୍କ ବ୍ୟାଗ' },
          { language: 'hi', name: 'कढ़ाई वाला लड़कियों का बैग' },
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
