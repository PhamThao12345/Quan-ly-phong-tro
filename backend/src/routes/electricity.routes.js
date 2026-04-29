const express = require('express');
const router = express.Router();
const electricityController = require('../controllers/electricity.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/role.middleware');

// Tất cả các route yêu cầu đăng nhập
router.use(verifyAuthTask);

router.get('/', checkPermission('chi_so_dien', 'view'), electricityController.getMeterIndices);

// Cập nhật chỉ số
router.post('/update', checkPermission('chi_so_dien', 'edit'), electricityController.updateMeterIndex);
router.post('/save-batch', checkPermission('chi_so_dien', 'edit'), electricityController.saveAllMeters);

module.exports = router;
