const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

const generateRandomPassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const sendCredentialsEmail = async (email, username, password, fullName) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('SMTP credentials not found. Skip sending email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"T's House Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Thông tin tài khoản T\'s House',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Xin chào ${fullName || 'bạn'},</h2>
        <p>Tài khoản của bạn trên hệ thống quản lý T's House đã được tạo / cấp lại mật khẩu.</p>
        <p><strong>Thông tin đăng nhập:</strong></p>
        <ul>
          <li>Tên đăng nhập: <strong>${username}</strong></li>
          <li>Mật khẩu: <strong>${password}</strong></li>
        </ul>
        <p>Vui lòng đăng nhập và đổi mật khẩu ngay trong lần đầu tiên để đảm bảo an toàn.</p>
        <br/>
        <p>Trân trọng,<br/>T's House Team</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      employeeCode: true,
      username: true,
      fullName: true,
      cccd: true,
      phoneNumber: true,
      email: true,
      status: true,
      role: true,
      permissions: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

const getUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      employeeCode: true,
      username: true,
      fullName: true,
      cccd: true,
      phoneNumber: true,
      email: true,
      status: true,
      role: true,
      permissions: true
    }
  });
};

const createUser = async (data) => {
  const { employeeCode, username, fullName, cccd, phoneNumber, email, role, permissions } = data;
  
  // Validate unique fields
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email },
        { phoneNumber: phoneNumber ? phoneNumber : undefined },
        { employeeCode: employeeCode ? employeeCode : undefined }
      ]
    }
  });

  if (existingUser) {
    if (existingUser.username === username) throw { status: 400, message: 'Tên đăng nhập đã tồn tại' };
    if (existingUser.email === email) throw { status: 400, message: 'Email đã tồn tại' };
    if (employeeCode && existingUser.employeeCode === employeeCode) throw { status: 400, message: 'Mã nhân viên đã tồn tại' };
    if (phoneNumber && existingUser.phoneNumber === phoneNumber) throw { status: 400, message: 'Số điện thoại đã tồn tại' };
  }

  const rawPassword = generateRandomPassword();
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const newUser = await prisma.user.create({
    data: {
      employeeCode: employeeCode || `NV${Date.now().toString().slice(-4)}`,
      username,
      password: hashedPassword,
      fullName,
      cccd,
      phoneNumber,
      email,
      role: role || 'STAFF',
      permissions: permissions ? JSON.stringify(permissions) : '{}',
      status: 'INACTIVE' // Require password change on first login
    }
  });

  // Send email asynchronously
  sendCredentialsEmail(email, username, rawPassword, fullName).catch(err => {
    console.error('Lỗi khi gửi email:', err);
  });

  return newUser;
};

const updateUser = async (id, data, requestUser) => {
  const { employeeCode, fullName, cccd, phoneNumber, email, role, permissions, status } = data;

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) throw { status: 404, message: 'Người dùng không tồn tại' };

  if (existingUser.role === 'CHU_TRO' && requestUser?.role !== 'CHU_TRO') {
    throw { status: 403, message: 'Bạn không có quyền thao tác với tài khoản Chủ trọ' };
  }

  // check unique fields if they are changed
  const checkUnique = await prisma.user.findFirst({
    where: {
      id: { not: id },
      OR: [
        { email },
        { phoneNumber: phoneNumber ? phoneNumber : undefined },
        { employeeCode: employeeCode ? employeeCode : undefined }
      ]
    }
  });

  if (checkUnique) {
    if (checkUnique.email === email) throw { status: 400, message: 'Email đã tồn tại' };
    if (employeeCode && checkUnique.employeeCode === employeeCode) throw { status: 400, message: 'Mã nhân viên đã tồn tại' };
    if (phoneNumber && checkUnique.phoneNumber === phoneNumber) throw { status: 400, message: 'Số điện thoại đã tồn tại' };
  }

  const updatedData = {
    employeeCode,
    fullName,
    cccd,
    phoneNumber,
    email,
    role,
    status
  };

  if (permissions) {
    updatedData.permissions = JSON.stringify(permissions);
  }

  return await prisma.user.update({
    where: { id },
    data: updatedData,
    select: {
      id: true,
      employeeCode: true,
      username: true,
      fullName: true,
      email: true,
      role: true
    }
  });
};

const deleteUser = async (id, requestUser) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) throw { status: 404, message: 'Người dùng không tồn tại' };

  if (existingUser.role === 'CHU_TRO' && requestUser?.role !== 'CHU_TRO') {
    throw { status: 403, message: 'Bạn không có quyền thao tác với tài khoản Chủ trọ' };
  }

  return await prisma.user.delete({ where: { id } });
};

const resetPassword = async (id, requestUser) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };

  if (user.role === 'CHU_TRO' && requestUser?.role !== 'CHU_TRO') {
    throw { status: 403, message: 'Bạn không có quyền thao tác với tài khoản Chủ trọ' };
  }

  const rawPassword = generateRandomPassword();
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { 
      password: hashedPassword,
      status: 'INACTIVE', // Bắt buộc đổi lại mật khẩu
      failedLoginAttempts: 0
    }
  });

  sendCredentialsEmail(user.email, user.username, rawPassword, user.fullName).catch(err => {
    console.error('Lỗi khi gửi email:', err);
  });

  return { message: 'Mật khẩu mới đã được gửi vào email của người dùng' };
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword
};
