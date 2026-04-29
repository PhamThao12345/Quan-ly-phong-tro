const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contract.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/role.middleware');

router.use(verifyAuthTask);

// Thống kê
router.get('/stats', checkPermission('hop_dong', 'view'), contractController.getStats);

// Export
router.get('/export-bulk', checkPermission('hop_dong', 'view'), contractController.exportBulk);
router.get('/:id/export', checkPermission('hop_dong', 'view'), contractController.exportWord);

// CRUD & Action
router.get('/', checkPermission('hop_dong', 'view'), contractController.getAllContracts);
router.get('/:id', checkPermission('hop_dong', 'view'), contractController.getContractById);
router.post('/', checkPermission('hop_dong', 'edit'), contractController.createContract);
router.put('/:id', checkPermission('hop_dong', 'edit'), contractController.updateContract);
router.post('/:id/renew', checkPermission('hop_dong', 'edit'), contractController.renewContract);
router.post('/:id/terminate', checkPermission('hop_dong', 'edit'), contractController.terminateContract);
router.delete('/:id', checkPermission('hop_dong', 'delete'), contractController.deleteContract);

module.exports = router;
