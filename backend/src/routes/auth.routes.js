const express = require('express');
const authController = require('../controllers/auth.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/change-password', verifyAuthTask, authController.changePassword);

module.exports = router;
