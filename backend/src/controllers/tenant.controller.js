const tenantService = require('../services/tenant.service');
const activityService = require('../services/activity.service');
const notificationService = require('../services/notification.service');


const getAllTenants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const filters = {
      status: req.query.status || '',
      residencyStatus: req.query.residencyStatus || '',
      hostelId: req.query.hostelId || '',
      roomId: req.query.roomId || '',
      fromDate: req.query.fromDate || '',
      toDate: req.query.toDate || '',
    };
    const result = await tenantService.getAllTenants(page, limit, search, filters);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const getTenantById = async (req, res) => {
  try {
    const tenant = await tenantService.getTenantById(Number(req.params.id));
    res.status(200).json({ status: 'success', data: tenant });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const createTenant = async (req, res) => {
  try {
    const { fullName, cccd, phoneNumber, email, gender, dateOfBirth, address, hometown, roomId } = req.body;
    if (!fullName || !cccd || !phoneNumber) {
      return res.status(400).json({ status: 'error', message: 'Họ tên, CCCD và Số điện thoại là bắt buộc.' });
    }
    const tenant = await tenantService.createTenant({ fullName, cccd, phoneNumber, email, gender, dateOfBirth, address, hometown, roomId });
    await activityService.logActivity(req.user.id, `Đã thêm khách thuê mới: ${tenant.fullName}`, 'KHACH_THUE');
    await notificationService.createNotification({
      title: 'Khách thuê mới',
      message: `Khách thuê "${tenant.fullName}" vừa được thêm vào hệ thống.`,
      type: 'SUCCESS'
    });
    res.status(201).json({ status: 'success', data: tenant });

  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const updateTenant = async (req, res) => {
  try {
    const { fullName, cccd, phoneNumber, email, gender, dateOfBirth, address, hometown, roomId, status, residencyStatus } = req.body;
    if (!fullName || !cccd || !phoneNumber) {
      return res.status(400).json({ status: 'error', message: 'Họ tên, CCCD và Số điện thoại là bắt buộc.' });
    }
    const tenant = await tenantService.updateTenant(Number(req.params.id), {
      fullName, cccd, phoneNumber, email, gender, dateOfBirth, address, hometown, roomId, status, residencyStatus
    });
    await activityService.logActivity(req.user.id, `Đã cập nhật thông tin khách thuê: ${tenant.fullName}`, 'KHACH_THUE');
    await notificationService.createNotification({
      title: 'Cập nhật khách thuê',
      message: `Thông tin khách thuê "${tenant.fullName}" vừa được chỉnh sửa.`,
      type: 'INFO'
    });
    res.status(200).json({ status: 'success', data: tenant });

  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const deleteTenant = async (req, res) => {
  try {
    const tenant = await tenantService.getTenantById(Number(req.params.id));
    await tenantService.deleteTenant(Number(req.params.id));
    await activityService.logActivity(req.user.id, `Đã xóa khách thuê: ${tenant.fullName}`, 'KHACH_THUE');
    res.status(200).json({ status: 'success', message: 'Xóa khách thuê thành công.' });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await tenantService.getStats();
    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const exportTenants = async (req, res) => {
  try {
    const filters = {
      status: req.query.status || '',
      residencyStatus: req.query.residencyStatus || '',
      hostelId: req.query.hostelId || '',
      roomId: req.query.roomId || '',
    };
    const tenants = await tenantService.getTenantsForExport(filters);

    // Tạo CSV content (thay vì dùng thêm lib xlsx)
    const header = 'Mã KH,Họ và tên,CCCD,SĐT,Email,Giới tính,Ngày sinh,Quê quán,Khu trọ,Phòng,Trạng thái,Tạm trú\n';
    const rows = tenants.map((t, i) => {
      const gender = t.gender === 'NAM' ? 'Nam' : t.gender === 'NU' ? 'Nữ' : t.gender === 'KHAC' ? 'Khác' : '';
      const dob = t.dateOfBirth ? new Date(t.dateOfBirth).toLocaleDateString('vi-VN') : '';
      const status = t.status === 'DANG_THUE' ? 'Đang thuê' : 'Ngừng thuê';
      const residency = t.residencyStatus === 'DA_DANG_KY' ? 'Đã đăng ký' : 'Chưa đăng ký';
      return `KT${String(t.id).padStart(3, '0')},"${t.fullName}",${t.cccd},${t.phoneNumber},${t.email || ''},${gender},${dob},"${t.hometown || ''}",${t.room?.hostel?.name || ''},${t.room?.roomNumber || ''},${status},${residency}`;
    }).join('\n');

    const bom = '\uFEFF'; // UTF-8 BOM for Excel
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=danh-sach-khach-thue-${Date.now()}.csv`);
    res.status(200).send(bom + header + rows);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getAllTenants, getTenantById, createTenant, updateTenant, deleteTenant, getStats, exportTenants };
