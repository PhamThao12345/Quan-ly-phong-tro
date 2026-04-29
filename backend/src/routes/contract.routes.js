const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contract.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.use(verifyAuthTask);

// Thống kê
router.get('/stats', contractController.getStats);

// Export
router.get('/export-bulk', contractController.exportBulk);
router.get('/:id/export', contractController.exportWord);

// CRUD & Action
router.get('/', contractController.getAllContracts);
router.get('/:id', contractController.getContractById);
router.post('/', requireRole('CHU_TRO'), contractController.createContract);
router.put('/:id', requireRole('CHU_TRO'), contractController.updateContract);
router.post('/:id/renew', requireRole('CHU_TRO'), contractController.renewContract);
router.post('/:id/terminate', requireRole('CHU_TRO'), contractController.terminateContract);
router.delete('/:id', requireRole('CHU_TRO'), contractController.deleteContract);

module.exports = router;
