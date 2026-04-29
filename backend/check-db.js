const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findUnique({ where: { username: '0258963121' } });
  console.log(u.role, u.permissions);
  const u2 = await prisma.user.findUnique({ where: { username: '0888888888' } });
  console.log(u2.role, u2.permissions);
}

main().catch(console.error).finally(() => prisma.$disconnect());
