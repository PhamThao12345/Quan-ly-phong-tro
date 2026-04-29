const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostel.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/role.middleware');

router.use(verifyAuthTask);

router.get('/', checkPermission('khu_phong', 'view'), hostelController.getAllHostels);
router.post('/', checkPermission('khu_phong', 'edit'), hostelController.createHostel);
router.put('/:id', checkPermission('khu_phong', 'edit'), hostelController.updateHostel);
router.delete('/:id', checkPermission('khu_phong', 'delete'), hostelController.deleteHostel);

module.exports = router;
