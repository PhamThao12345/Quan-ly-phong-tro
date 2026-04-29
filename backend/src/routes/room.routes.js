const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { verifyAuthTask } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.use(verifyAuthTask);

router.get('/', roomController.getAllRooms);
router.post('/', requireRole('CHU_TRO'), roomController.createRoom);
router.put('/:id', requireRole('CHU_TRO'), roomController.updateRoom);
router.delete('/:id', requireRole('CHU_TRO'), roomController.deleteRoom);

module.exports = router;
