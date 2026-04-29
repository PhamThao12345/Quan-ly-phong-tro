const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyAuthTask, verifyAdminTask } = require('../middlewares/auth.middleware');

// Protect all user routes, require Authentication AND Admin role
router.use(verifyAuthTask);
router.use(verifyAdminTask);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/:id/reset-password', userController.resetPassword);

module.exports = router;
