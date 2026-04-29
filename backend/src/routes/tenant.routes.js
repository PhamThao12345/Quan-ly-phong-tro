const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/role.middleware');

router.use(verifyAuthTask);

// Thống kê
router.get('/stats', checkPermission('khach_thue', 'view'), tenantController.getStats);

// Export CSV
router.get('/export', checkPermission('khach_thue', 'view'), tenantController.exportTenants);

// CRUD
router.get('/', checkPermission('khach_thue', 'view'), tenantController.getAllTenants);
router.get('/:id', checkPermission('khach_thue', 'view'), tenantController.getTenantById);
router.post('/', checkPermission('khach_thue', 'edit'), tenantController.createTenant);
router.put('/:id', checkPermission('khach_thue', 'edit'), tenantController.updateTenant);
router.delete('/:id', checkPermission('khach_thue', 'delete'), tenantController.deleteTenant);

module.exports = router;
