const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

// Tất cả các route yêu cầu đăng nhập
router.use(verifyAuthTask);

router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);

// Chỉ Chủ trọ được thêm, sửa, xóa dịch vụ định mức
router.post('/', requireRole('CHU_TRO'), serviceController.createService);
router.put('/:id', requireRole('CHU_TRO'), serviceController.updateService);
router.delete('/:id', requireRole('CHU_TRO'), serviceController.deleteService);

// Chủ trọ và Nhân viên đều có thể gán/gỡ dịch vụ cho phòng
router.post('/apply', serviceController.applyToRooms);
router.post('/remove', serviceController.removeFromRoom);

module.exports = router;
