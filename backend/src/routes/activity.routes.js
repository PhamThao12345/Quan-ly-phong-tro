const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');

router.use(verifyAuthTask);

const verifyAccess = (req, res, next) => {
  if (req.user.role !== 'CHU_TRO' && req.user.role !== 'MANAGER') {
    return res.status(403).json({ status: 'error', message: 'Bạn không có quyền xem lịch sử hoạt động' });
  }
  next();
};

router.get('/', verifyAccess, activityController.getActivities);
router.delete('/', verifyAccess, activityController.clearActivities);

module.exports = router;
