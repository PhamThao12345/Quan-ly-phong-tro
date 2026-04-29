const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.use(verifyAuthTask);

// Thống kê — tất cả đều xem được
router.get('/stats', tenantController.getStats);

// Export CSV — chỉ Chủ trọ
router.get('/export', requireRole('CHU_TRO'), tenantController.exportTenants);

// CRUD
router.get('/', tenantController.getAllTenants);
router.get('/:id', tenantController.getTenantById);
router.post('/', requireRole('CHU_TRO'), tenantController.createTenant);
router.put('/:id', requireRole('CHU_TRO'), tenantController.updateTenant);
router.delete('/:id', requireRole('CHU_TRO'), tenantController.deleteTenant);

module.exports = router;
