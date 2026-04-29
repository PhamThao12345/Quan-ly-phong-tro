const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostel.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.use(verifyAuthTask);

router.get('/', hostelController.getAllHostels);
router.post('/', requireRole('CHU_TRO'), hostelController.createHostel);
router.put('/:id', requireRole('CHU_TRO'), hostelController.updateHostel);
router.delete('/:id', requireRole('CHU_TRO'), hostelController.deleteHostel);

module.exports = router;
