import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.contact.createMany({
    data: [
      { name: 'Ada Lovelace', email: 'ada@example.com', message: 'Quiero más info', tags: ['lead','es'] },
      { name: 'Grace Hopper', email: 'grace@example.com', message: 'Agenden demo', tags: ['demo'] },
      { name: 'Alan Turing', email: 'alan@example.com', message: '¿Precios?', tags: [] }
    ],
    skipDuplicates: true
  });
}

main().finally(async () => prisma.$disconnect());
