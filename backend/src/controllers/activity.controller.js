const activityService = require('../services/activity.service');

const getActivities = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const activities = await activityService.getActivities(limit);
    res.status(200).json({ status: 'success', data: activities });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const clearActivities = async (req, res) => {
  try {
    // Only Admin can clear
    if (req.user.role !== 'CHU_TRO') {
      return res.status(403).json({ status: 'error', message: 'Chỉ Chủ trọ mới được phép xóa toàn bộ lịch sử' });
    }
    await activityService.clearActivities();
    await activityService.logActivity(req.user.id, 'Đã xóa toàn bộ lịch sử hoạt động', 'SYSTEM');
    res.status(200).json({ status: 'success', message: 'Đã xóa toàn bộ lịch sử' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getActivities,
  clearActivities
};
