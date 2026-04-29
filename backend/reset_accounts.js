const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function resetAccounts() {
  const newHash = await bcrypt.hash('123456aA@', 10);
  
  // Reset tài khoản chủ trọ
  const u1 = await p.user.update({
    where: { username: '0901234567' },
    data: { status: 'ACTIVE', failedLoginAttempts: 0, password: newHash }
  });
  console.log('Reset CHU_TRO:', u1.username, u1.status);

  // Reset tài khoản nhân viên 1
  const u2 = await p.user.update({
    where: { username: '0888888888' },
    data: { status: 'ACTIVE', failedLoginAttempts: 0, password: newHash }
  });
  console.log('Reset NV1:', u2.username, u2.status);

  await p.$disconnect();
  console.log('Done! Login: 0901234567 / 123456aA@');
}

resetAccounts().catch(e => { console.error(e.message); p.$disconnect(); });
