const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { username: '0901234567' },
    data: { fullName: 'Nguyễn Đình Việt', role: 'CHU_TRO' }
  }).catch(() => {});

  await prisma.user.update({
    where: { username: '0258963121' },
    data: { role: 'MANAGER' }
  }).catch(() => {});

  await prisma.user.update({
    where: { username: '0888888888' },
    data: { role: 'STAFF' }
  }).catch(() => {});

  console.log('Done DB Update');
}

main().catch(console.error).finally(() => prisma.$disconnect());
