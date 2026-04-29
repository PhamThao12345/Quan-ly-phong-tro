const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { role: 'CHU_TRO' }
  });
  console.log('Updated ADMIN to CHU_TRO');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
