const hostelService = require('../services/hostel.service');
const activityService = require('../services/activity.service');

const getAllHostels = async (req, res) => {
  try {
    const search = req.query.search || '';
    const hostels = await hostelService.getAllHostels(search);
    res.status(200).json({ status: 'success', data: hostels });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const createHostel = async (req, res) => {
  try {
    const { name, address, city, district, description, status } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'Tên khu trọ là bắt buộc.' });
    const hostel = await hostelService.createHostel({ name, address, city, district, description, status });
    await activityService.logActivity(req.user.id, `Đã thêm khu trọ mới: ${hostel.name}`, 'KHU_TRO');
    res.status(201).json({ status: 'success', data: hostel });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const updateHostel = async (req, res) => {
  try {
    const { name, address, city, district, description, status } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'Tên khu trọ là bắt buộc.' });
    const hostel = await hostelService.updateHostel(Number(req.params.id), {
      name, address, city, district, description, status
    });
    await activityService.logActivity(req.user.id, `Đã cập nhật thông tin khu trọ: ${hostel.name}`, 'KHU_TRO');
    res.status(200).json({ status: 'success', data: hostel });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const deleteHostel = async (req, res) => {
  try {
    await hostelService.deleteHostel(Number(req.params.id));
    await activityService.logActivity(req.user.id, `Đã xóa một khu trọ`, 'KHU_TRO');
    res.status(200).json({ status: 'success', message: 'Xoá khu trọ thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getAllHostels, createHostel, updateHostel, deleteHostel };
