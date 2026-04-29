const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.activityLog.findMany().then(res => {
  console.log('LOGS:', res);
  prisma.$disconnect();
});
