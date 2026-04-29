const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456aA@', 10);

  // 1. Reset Chủ trọ
  const owner = await prisma.user.upsert({
    where: { username: '0901234567' },
    update: {
      password: hashedPassword,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      role: 'CHU_TRO'
    },
    create: {
      username: '0901234567',
      password: hashedPassword,
      fullName: 'Chủ trọ (T\'s House)',
      phoneNumber: '0901234567',
      role: 'CHU_TRO',
      status: 'ACTIVE'
    },
  });

  // 2. Reset Nhân viên
  const staff = await prisma.user.upsert({
    where: { username: '0888888888' },
    update: {
      password: hashedPassword,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      role: 'NHAN_VIEN'
    },
    create: {
      username: '0888888888',
      password: hashedPassword,
      fullName: 'Nguyễn Văn Quản Lý',
      phoneNumber: '0888888888',
      role: 'NHAN_VIEN',
      status: 'ACTIVE'
    },
  });

  console.log('--- RESET THÀNH CÔNG ---');
  console.log('1. CHỦ TRỌ:');
  console.log('   Username:', owner.username);
  console.log('   Password: 123456aA@');
  console.log('2. NHÂN VIÊN:');
  console.log('   Username:', staff.username);
  console.log('   Password: 123456aA@');
  console.log('-------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
