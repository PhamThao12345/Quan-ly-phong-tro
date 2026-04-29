const electricityService = require('../services/electricity.service');
const activityService = require('../services/activity.service');

const getMeterIndices = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tháng và năm.' });
    }
    const data = await electricityService.getMeterIndices(month, year);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMeterIndex = async (req, res) => {
  try {
    const data = await electricityService.updateMeterIndex(req.body);
    await activityService.logActivity(req.user.id, `Đã cập nhật chỉ số điện cho phòng ${data.room?.roomNumber || 'không xác định'}`, 'CHI_SO_DIEN');
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const saveAllMeters = async (req, res) => {
  try {
    const { meters } = req.body;
    if (!Array.isArray(meters)) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
    }
    const results = await electricityService.saveAllMeters(meters);
    await activityService.logActivity(req.user.id, `Đã lưu chỉ số điện cho ${results.length} phòng`, 'CHI_SO_DIEN');
    res.json({ message: `Đã lưu thành công ${results.length} bản ghi.`, data: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMeterIndices,
  updateMeterIndex,
  saveAllMeters
};
