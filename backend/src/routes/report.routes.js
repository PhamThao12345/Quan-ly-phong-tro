const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');

router.use(verifyAuthTask);

const verifyAccess = (req, res, next) => {
  if (req.user.role !== 'CHU_TRO' && req.user.role !== 'MANAGER') {
    return res.status(403).json({ status: 'error', message: 'Bạn không có quyền truy cập chức năng báo cáo' });
  }
  next();
};

router.get('/dashboard', verifyAccess, reportController.getDashboardReport);

module.exports = router;
