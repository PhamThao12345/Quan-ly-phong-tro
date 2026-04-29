const authService = require('../services/auth.service');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    const result = await authService.login(username, password);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    const statusCode = error.status || 500;
    res.status(statusCode).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    // Auth Middleware sẽ gán data vào req.user
    if (!req.user || !req.user.id) {
       return res.status(401).json({ status: 'error', message: 'Không truy xuất được phiên xác thực tạm thời' });
    }

    if (!newPassword) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp mật khẩu mới để đổi' });
    }

    const result = await authService.changePassword(req.user.id, newPassword);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    const statusCode = error.status || 500;
    res.status(statusCode).json({ status: 'error', message: error.message || 'Lỗi server khi đổi mật khẩu' });
  }
};

module.exports = {
  login,
  changePassword
};
