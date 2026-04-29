const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt.util');

const prisma = new PrismaClient();
const MAX_LOGIN_ATTEMPTS = 5;

const login = async (username, password) => {
  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) {
    throw { status: 400, message: 'Tên đăng nhập không tồn tại' };
  }

  if (user.status === 'LOCKED') {
    throw { status: 403, message: 'Tài khoản của bạn đã bị khóa do nhập sai nhiều lần hoặc bị vô hiệu hóa. Vui lòng liên hệ quản trị.' };
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const newAttempts = user.failedLoginAttempts + 1;
    let newStatus = user.status;
    
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      newStatus = 'LOCKED';
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        failedLoginAttempts: newAttempts,
        status: newStatus
      }
    });

    if (newStatus === 'LOCKED') {
      throw { status: 403, message: `Bạn đã nhập sai mật khẩu ${MAX_LOGIN_ATTEMPTS} lần. Tài khoản hiện đã bị hệ thống khóa. ` };
    }

    throw { status: 401, message: 'Mật khẩu không chính xác' };
  }

  // Xoá log đăng nhập sai nếu vào thành công
  if (user.failedLoginAttempts > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0 }
    });
  }

  // Xử lý luồng bắt đổi mật khẩu
  if (user.status === 'INACTIVE' || user.status === 'RESET') {
    const tempToken = generateToken({ id: user.id, username: user.username, role: user.role, status: user.status }, true);
    return {
      requirePasswordChange: true,
      tempToken,
      message: 'Yêu cầu đổi mật khẩu trước khi tiếp tục truy cập sử dụng nền tảng',
      status: user.status
    };
  }

  // Active user / Luồng thành công
  const accessToken = generateToken({ id: user.id, username: user.username, role: user.role, permissions: user.permissions });
  return {
    requirePasswordChange: false,
    accessToken,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions
    }
  };
};

const changePassword = async (userId, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      status: 'ACTIVE' // Chuyển trạng thái sang ACTIVE sau khi đổi pass thành công
    }
  });

  const accessToken = generateToken({ id: updatedUser.id, username: updatedUser.username, role: updatedUser.role, permissions: updatedUser.permissions });
  return {
    accessToken,
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      permissions: updatedUser.permissions
    }
  };
};

module.exports = {
  login,
  changePassword
};
