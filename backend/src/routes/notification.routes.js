const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');

router.use(verifyAuthTask);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;
