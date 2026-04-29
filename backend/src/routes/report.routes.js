const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/role.middleware');

router.use(verifyAuthTask);

router.get('/dashboard', checkPermission('bao_cao', 'view'), reportController.getDashboardReport);

module.exports = router;
