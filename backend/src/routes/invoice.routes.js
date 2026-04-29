const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.use(verifyAuthTask);

router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/calculate-preview', invoiceController.calculatePreview);
router.post('/', requireRole(['CHU_TRO', 'NHAN_VIEN_QUAN_LY']), invoiceController.createInvoice);
router.put('/:id', requireRole(['CHU_TRO', 'NHAN_VIEN_QUAN_LY']), invoiceController.updateInvoice);
router.delete('/:id', requireRole(['CHU_TRO', 'NHAN_VIEN_QUAN_LY']), invoiceController.deleteInvoice);
router.post('/:id/send-email', requireRole(['CHU_TRO', 'NHAN_VIEN_QUAN_LY']), invoiceController.sendEmail);

module.exports = router;
