const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/role.middleware');

router.use(verifyAuthTask);

router.get('/', checkPermission('khu_phong', 'view'), roomController.getAllRooms);
router.post('/', checkPermission('khu_phong', 'edit'), roomController.createRoom);
router.put('/:id', checkPermission('khu_phong', 'edit'), roomController.updateRoom);
router.delete('/:id', checkPermission('khu_phong', 'delete'), roomController.deleteRoom);

module.exports = router;
