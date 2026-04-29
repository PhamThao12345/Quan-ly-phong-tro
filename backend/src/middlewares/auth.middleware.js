const { verifyToken } = require('../utils/jwt.util');

const verifyAuthTask = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Request bị chặn do không có token xác thực' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ status: 'error', message: 'Phiên xác thực không hợp lệ hoặc đã hết hạn' });
  }

  req.user = decoded; // id, username, role, status
  next();
};

const verifyAdminTask = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
  }

  // Parse permissions from token payload if it is string
  let perms = req.user.permissions;
  if (typeof perms === 'string') {
    try { perms = JSON.parse(perms); } catch(e) { perms = {}; }
  } else if (!perms) {
    perms = {};
  }
  
  const hasView = perms?.nguoi_dung?.view === true;
  const hasEdit = perms?.nguoi_dung?.edit === true;

  if (req.user.role !== 'CHU_TRO') {
    if (req.method === 'GET' && !hasView) {
      return res.status(403).json({ status: 'error', message: 'Bạn không có quyền xem thông tin này' });
    }
    if (req.method !== 'GET' && !hasEdit) {
      return res.status(403).json({ status: 'error', message: 'Bạn không có quyền chỉnh sửa thông tin này' });
    }
  }

  next();
};

module.exports = {
  verifyAuthTask,
  verifyAdminTask
};
