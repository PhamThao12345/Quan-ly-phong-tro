const serviceService = require('../services/service.service');
const activityService = require('../services/activity.service');

const getAllServices = async (req, res) => {
  try {
    const services = await serviceService.getAllServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    res.json(service);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const createService = async (req, res) => {
  try {
    const service = await serviceService.createService(req.body);
    await activityService.logActivity(req.user.id, `Đã thêm dịch vụ mới: ${service.name}`, 'DICH_VU_KHAC');
    res.status(201).json(service);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const service = await serviceService.updateService(req.params.id, req.body);
    await activityService.logActivity(req.user.id, `Đã cập nhật dịch vụ: ${service.name}`, 'DICH_VU_KHAC');
    res.json(service);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    await serviceService.deleteService(req.params.id);
    await activityService.logActivity(req.user.id, `Đã xóa dịch vụ: ${service.name}`, 'DICH_VU_KHAC');
    res.json({ message: 'Xóa dịch vụ thành công.' });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const applyToRooms = async (req, res) => {
  try {
    const { serviceId, roomIds } = req.body;
    await serviceService.applyServiceToRooms(serviceId, roomIds);
    res.json({ message: 'Áp dụng dịch vụ cho phòng thành công.' });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const removeFromRoom = async (req, res) => {
  try {
    const { serviceId, roomId } = req.body;
    await serviceService.removeServiceFromRoom(serviceId, roomId);
    res.json({ message: 'Ngừng áp dụng dịch vụ cho phòng thành công.' });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  applyToRooms,
  removeFromRoom
};
