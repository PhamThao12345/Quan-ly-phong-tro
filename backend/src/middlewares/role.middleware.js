const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Yêu cầu đăng nhập' });
    }
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'error', 
        message: `Bạn không có quyền thực hiện chức năng này. Quyền yêu cầu: ${allowedRoles.join(' hoặc ')}` 
      });
    }
    next();
  };
};

module.exports = { requireRole };
