const reportService = require('../services/report.service');
const activityService = require('../services/activity.service');

const getDashboardReport = async (req, res) => {
  try {
    const { filterType = 'month', year, month } = req.query;
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const y = year ? parseInt(year) : currentYear;
    const m = month ? parseInt(month) : currentMonth;

    const data = await reportService.getDashboardReport(filterType, y, m);
    
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getDashboardReport
};
