const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  // User 1: Quản lý - ACTIVE
  await prisma.user.upsert({
    where: { username: '0901234567' },
    update: { status: 'ACTIVE', password: passwordHash },
    create: {
      username: '0901234567',
      phoneNumber: '0901234567',
      fullName: 'Thanh Phạm (Quản trị viên)',
      password: passwordHash,
      status: 'ACTIVE',
      role: 'CHU_TRO'
    }
  });

  // User 2: Nhân viên - INACTIVE (Chờ đổi mật khẩu)
  await prisma.user.upsert({
    where: { username: '0888888888' },
    update: { status: 'INACTIVE', password: passwordHash },
    create: {
      username: '0888888888',
      phoneNumber: '0888888888',
      fullName: 'Nguyễn Văn Nhân Viên',
      password: passwordHash,
      status: 'INACTIVE',
      role: 'NHAN_VIEN_QUAN_LY'
    }
  });

  // User 3: Nhân viên - LOCKED
  await prisma.user.upsert({
    where: { username: '0777777777' },
    update: { status: 'LOCKED', password: passwordHash },
    create: {
      username: '0777777777',
      phoneNumber: '0777777777',
      fullName: 'Lê Văn Khóa',
      password: passwordHash,
      status: 'LOCKED',
      role: 'NHAN_VIEN_QUAN_LY'
    }
  });

  console.log('Seeded successfully! Tài khoản test:');
  console.log('1. Quản trị viên (Vào thẳng): 0901234567 / 123456');
  console.log('2. Nhân viên (Ép đổi pass): 0888888888 / 123456');
  console.log('3. Nhân viên (Bị khóa): 0777777777 / 123456');
}

main().catch(console.error).finally(() => prisma.$disconnect());
