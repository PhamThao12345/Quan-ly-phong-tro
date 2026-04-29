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

const checkPermission = (moduleId, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Yêu cầu đăng nhập' });
    }

    // Chủ trọ luôn có toàn quyền
    if (req.user.role === 'CHU_TRO') {
      return next();
    }

    // Parse permissions từ token payload (là JSON string trong JWT)
    let perms = req.user.permissions;
    if (typeof perms === 'string') {
      try {
        perms = JSON.parse(perms);
      } catch (e) {
        perms = {};
      }
    }

    // Kiểm tra quyền cụ thể cho module và action
    // action có thể là: 'view', 'edit', 'delete'
    if (perms && perms[moduleId] && perms[moduleId][action] === true) {
      return next();
    }

    return res.status(403).json({ 
      status: 'error', 
      message: `Bạn không có quyền thực hiện hành động '${action}' trên phân hệ '${moduleId}'` 
    });
  };
};

module.exports = { requireRole, checkPermission };
