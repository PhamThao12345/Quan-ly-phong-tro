const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/role.middleware');

// Tất cả các route yêu cầu đăng nhập
router.use(verifyAuthTask);

router.get('/', checkPermission('dich_vu_khac', 'view'), serviceController.getAllServices);
router.get('/:id', checkPermission('dich_vu_khac', 'view'), serviceController.getServiceById);

router.post('/', checkPermission('dich_vu_khac', 'edit'), serviceController.createService);
router.put('/:id', checkPermission('dich_vu_khac', 'edit'), serviceController.updateService);
router.delete('/:id', checkPermission('dich_vu_khac', 'delete'), serviceController.deleteService);

router.post('/apply', checkPermission('dich_vu_khac', 'edit'), serviceController.applyToRooms);
router.post('/remove', checkPermission('dich_vu_khac', 'edit'), serviceController.removeFromRoom);

module.exports = router;
