const roomService = require('../services/room.service');
const activityService = require('../services/activity.service');
const notificationService = require('../services/notification.service');


const getAllRooms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const result = await roomService.getAllRooms(page, limit, search);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const createRoom = async (req, res) => {
  try {
    if (!req.body.roomNumber || !req.body.hostelId) 
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn Khu trọ và nhập Số phòng' });
    const room = await roomService.createRoom(req.body);
    await activityService.logActivity(req.user.id, `Đã thêm phòng trọ mới: ${room.roomNumber}`, 'PHONG_TRO');
    await notificationService.createNotification({
      title: 'Phòng mới',
      message: `Phòng "${room.roomNumber}" vừa được thêm vào hệ thống.`,
      type: 'SUCCESS'
    });
    res.status(201).json({ status: 'success', data: room });

  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    if (!req.body.roomNumber) 
      return res.status(400).json({ status: 'error', message: 'Số phòng là bắt buộc.' });
    const room = await roomService.updateRoom(Number(req.params.id), req.body);
    await activityService.logActivity(req.user.id, `Đã cập nhật thông tin phòng: ${room.roomNumber}`, 'PHONG_TRO');
    await notificationService.createNotification({
      title: 'Cập nhật phòng',
      message: `Thông tin phòng "${room.roomNumber}" vừa được chỉnh sửa.`,
      type: 'INFO'
    });
    res.status(200).json({ status: 'success', data: room });

  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    await roomService.deleteRoom(Number(req.params.id));
    await activityService.logActivity(req.user.id, `Đã xóa một phòng trọ`, 'PHONG_TRO');
    res.status(200).json({ status: 'success', message: 'Xoá phòng trọ thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getAllRooms, createRoom, updateRoom, deleteRoom };
