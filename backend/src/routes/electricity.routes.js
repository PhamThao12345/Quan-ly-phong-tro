const express = require('express');
const router = express.Router();
const electricityController = require('../controllers/electricity.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

// Tất cả các route yêu cầu đăng nhập
router.use(verifyAuthTask);

router.get('/', electricityController.getMeterIndices);

// Cập nhật chỉ số (Chủ trọ hoặc Nhân viên quản lý đều được)
router.post('/update', electricityController.updateMeterIndex);
router.post('/save-batch', electricityController.saveAllMeters);

module.exports = router;
