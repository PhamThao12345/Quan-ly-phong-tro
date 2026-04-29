const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_jwt_key_for_dev';
const TOKEN_EXPIRE = process.env.JWT_EXPIRES_IN || '1d';
const TEMP_TOKEN_EXPIRE = '15m'; // Token tạm thời cho đổi mật khẩu

const generateToken = (payload, isTemp = false) => {
  return jwt.sign(payload, SECRET_KEY, {
    expiresIn: isTemp ? TEMP_TOKEN_EXPIRE : TOKEN_EXPIRE,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};
