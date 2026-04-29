const contractService = require('../services/contract.service');
const activityService = require('../services/activity.service');

const getAllContracts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const filters = {
      status: req.query.status || '',
      hostelId: req.query.hostelId || '',
      fromDate: req.query.fromDate || '',
      toDate: req.query.toDate || ''
    };
    
    const result = await contractService.getAllContracts(page, limit, search, filters);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const getContractById = async (req, res) => {
  try {
    const contract = await contractService.getContractById(Number(req.params.id));
    res.status(200).json({ status: 'success', data: contract });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const createContract = async (req, res) => {
  try {
    const { roomId, startDate, endDate, tenants } = req.body;
    if (!roomId || !startDate || !endDate || !tenants || tenants.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập đầy đủ thông tin phòng, ngày tháng và ít nhất một khách thuê.' });
    }
    const contract = await contractService.createContract(req.body);
    await activityService.logActivity(req.user.id, `Đã tạo hợp đồng mới cho phòng ${contract.room?.roomNumber || 'không xác định'}`, 'HOP_DONG');
    res.status(201).json({ status: 'success', data: contract });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const updateContract = async (req, res) => {
  try {
    const contract = await contractService.updateContract(Number(req.params.id), req.body);
    await activityService.logActivity(req.user.id, `Đã cập nhật hợp đồng của phòng ${contract.room?.roomNumber || 'không xác định'}`, 'HOP_DONG');
    res.status(200).json({ status: 'success', data: contract });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const deleteContract = async (req, res) => {
  try {
    await contractService.deleteContract(Number(req.params.id));
    await activityService.logActivity(req.user.id, `Đã xóa một hợp đồng`, 'HOP_DONG');
    res.status(200).json({ status: 'success', message: 'Xoá hợp đồng thành công.' });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await contractService.getStats();
    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const renewContract = async (req, res) => {
  try {
    const contract = await contractService.renewContract(Number(req.params.id));
    res.status(200).json({ status: 'success', data: contract, message: 'Gia hạn hợp đồng thành công (thêm 1 năm).' });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const terminateContract = async (req, res) => {
  try {
    const contract = await contractService.terminateContract(Number(req.params.id));
    res.status(200).json({ status: 'success', data: contract, message: 'Đã kết thúc hợp đồng và trả phòng về trạng thái Trống.' });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const exportWord = async (req, res) => {
  try {
    const buffer = await contractService.generateWordContract(Number(req.params.id));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=hop_dong_${req.params.id}.docx`);
    res.send(buffer);
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const exportBulk = async (req, res) => {
  try {
    const filters = {
      status: req.query.status || '',
      hostelId: req.query.hostelId || '',
      fromDate: req.query.fromDate || '',
      toDate: req.query.toDate || ''
    };
    const buffer = await contractService.exportContractsCsv(filters);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=danh_sach_hop_dong.csv');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { 
  getAllContracts, 
  getContractById, 
  createContract, 
  updateContract,
  deleteContract, 
  getStats,
  renewContract,
  terminateContract,
  exportWord,
  exportBulk
};
