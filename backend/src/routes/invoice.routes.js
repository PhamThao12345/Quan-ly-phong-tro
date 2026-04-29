const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/role.middleware');

router.use(verifyAuthTask);

router.get('/', checkPermission('hoa_don', 'view'), invoiceController.getInvoices);
router.get('/:id', checkPermission('hoa_don', 'view'), invoiceController.getInvoiceById);
router.post('/calculate-preview', checkPermission('hoa_don', 'view'), invoiceController.calculatePreview);
router.post('/', checkPermission('hoa_don', 'edit'), invoiceController.createInvoice);
router.put('/:id', checkPermission('hoa_don', 'edit'), invoiceController.updateInvoice);
router.delete('/:id', checkPermission('hoa_don', 'delete'), invoiceController.deleteInvoice);
router.post('/:id/send-email', checkPermission('hoa_don', 'edit'), invoiceController.sendEmail);

module.exports = router;
