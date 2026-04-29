const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllTenants = async (page, limit, search, filters = {}) => {
  const skip = (page - 1) * limit;
  const where = {};

  // Tìm kiếm theo tên hoặc CCCD hoặc SĐT
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { cccd: { contains: search } },
      { phoneNumber: { contains: search } },
    ];
  }

  // Lọc theo trạng thái thuê
  if (filters.status) {
    where.status = filters.status;
  }

  // Lọc theo trạng thái tạm trú
  if (filters.residencyStatus) {
    where.residencyStatus = filters.residencyStatus;
  }

  // Lọc theo khu trọ
  if (filters.hostelId) {
    where.room = { hostelId: Number(filters.hostelId) };
  }

  // Lọc theo phòng
  if (filters.roomId) {
    where.roomId = Number(filters.roomId);
  }

  // Lọc theo thời gian tạo
  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
    if (filters.toDate) where.createdAt.lte = new Date(filters.toDate + 'T23:59:59.999Z');
  }

  const [total, tenants] = await Promise.all([
    prisma.tenant.count({ where }),
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            hostel: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return { total, page, limit, totalPages: Math.ceil(total / limit), tenants };
};

const getTenantById = async (id) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          price: true,
          hostel: { select: { id: true, name: true, address: true, city: true, district: true } }
        }
      }
    }
  });
  if (!tenant) throw { status: 404, message: 'Khách thuê không tồn tại.' };
  return tenant;
};

const createTenant = async (data) => {
  const { fullName, cccd, phoneNumber, email, gender, dateOfBirth, address, hometown, roomId } = data;

  // Kiểm tra CCCD trùng
  const existingCccd = await prisma.tenant.findUnique({ where: { cccd } });
  if (existingCccd) throw { status: 400, message: 'Căn cước công dân đã tồn tại trong hệ thống.' };

  // Kiểm tra trạng thái khu trọ
  if (roomId) {
    const room = await prisma.room.findUnique({
      where: { id: Number(roomId) },
      include: { hostel: true }
    });
    if (!room) throw { status: 404, message: 'Phòng không tồn tại.' };
    if (room.hostel.status === 'BAO_TRI') throw { status: 400, message: 'Khu trọ đang bảo trì, không thể thêm khách mới.' };
    if (room.hostel.status === 'NGUNG_HOAT_DONG') throw { status: 400, message: 'Khu trọ đã ngừng hoạt động.' };
  }

  // Dùng transaction để đảm bảo atomic: tạo tenant + cập nhật phòng
  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        fullName,
        cccd,
        phoneNumber,
        email: email || null,
        gender: gender || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || null,
        hometown: hometown || null,
        roomId: roomId ? Number(roomId) : null,
        status: 'DANG_THUE',
        residencyStatus: 'CHUA_DANG_KY',
      }
    });

    // Tự động chuyển trạng thái phòng sang DANG_O
    if (roomId) {
      await tx.room.update({
        where: { id: Number(roomId) },
        data: { status: 'DANG_O' }
      });
    }

    return tenant;
  });

  return result;
};

const updateTenant = async (id, data) => {
  const exists = await prisma.tenant.findUnique({ where: { id } });
  if (!exists) throw { status: 404, message: 'Khách thuê không tồn tại.' };

  const { fullName, cccd, phoneNumber, email, gender, dateOfBirth, address, hometown, roomId, status, residencyStatus } = data;

  // Kiểm tra CCCD trùng (trừ chính mình)
  if (cccd && cccd !== exists.cccd) {
    const cccdCheck = await prisma.tenant.findUnique({ where: { cccd } });
    if (cccdCheck) throw { status: 400, message: 'Căn cước công dân đã tồn tại trong hệ thống.' };
  }

  // Kiểm tra trạng thái khu trọ nếu thay đổi phòng
  if (roomId && roomId !== exists.roomId) {
    const room = await prisma.room.findUnique({
      where: { id: Number(roomId) },
      include: { hostel: true }
    });
    if (!room) throw { status: 404, message: 'Phòng không tồn tại.' };
    if (room.hostel.status === 'BAO_TRI') throw { status: 400, message: 'Khu trọ đang bảo trì, không thể chuyển khách vào.' };
    if (room.hostel.status === 'NGUNG_HOAT_DONG') throw { status: 400, message: 'Khu trọ đã ngừng hoạt động.' };
  }

  const oldRoomId = exists.roomId;
  const newRoomId = roomId !== undefined ? (roomId ? Number(roomId) : null) : oldRoomId;
  const oldStatus = exists.status;
  const newStatus = status || oldStatus;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Cập nhật thông tin khách
    const updatedTenant = await tx.tenant.update({
      where: { id },
      data: {
        fullName,
        cccd,
        phoneNumber,
        email: email || null,
        gender: gender || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || null,
        hometown: hometown || null,
        roomId: newRoomId,
        status: newStatus,
        residencyStatus,
      }
    });

    // 2. Xử lý trạng thái phòng cũ (nếu thay đổi phòng hoặc ngừng thuê)
    if (oldRoomId && (newRoomId !== oldRoomId || newStatus === 'NGUNG_THUE')) {
      const otherTenants = await tx.tenant.count({
        where: { roomId: oldRoomId, status: 'DANG_THUE', id: { not: id } }
      });
      if (otherTenants === 0) {
        await tx.room.update({ where: { id: oldRoomId }, data: { status: 'TRONG' } });
      }
    }

    // 3. Xử lý trạng thái phòng mới (nếu chuyển đến hoặc quay lại thuê)
    if (newRoomId && newStatus === 'DANG_THUE') {
      await tx.room.update({ where: { id: newRoomId }, data: { status: 'DANG_O' } });
    }

    return updatedTenant;
  });

  return result;
};

const deleteTenant = async (id) => {
  const exists = await prisma.tenant.findUnique({ where: { id } });
  if (!exists) throw { status: 404, message: 'Khách thuê không tồn tại.' };

  const roomId = exists.roomId;

  await prisma.$transaction(async (tx) => {
    // 1. Xóa khách
    await tx.tenant.delete({ where: { id } });

    // 2. Nếu phòng cũ không còn khách đang thuê nào khác -> chuyển về TRONG
    if (roomId) {
      const otherTenants = await tx.tenant.count({
        where: { roomId: roomId, status: 'DANG_THUE' }
      });
      if (otherTenants === 0) {
        await tx.room.update({ where: { id: roomId }, data: { status: 'TRONG' } });
      }
    }
  });

  return true;
};

const getStats = async () => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [
    totalTenants, 
    registeredResidency,
    newTenantsThisMonth,
    newTenantsLastMonth,
    registeredThisMonth,
    registeredLastMonth,
    occupiedRooms,
    emptyRooms,
    maintenanceRooms,
    expiringSoon
  ] = await Promise.all([
    prisma.tenant.count({ where: { status: 'DANG_THUE' } }),
    prisma.tenant.count({ where: { status: 'DANG_THUE', residencyStatus: 'DA_DANG_KY' } }),
    // Khách mới tháng này
    prisma.tenant.count({ where: { createdAt: { gte: startOfThisMonth } } }),
    // Khách mới tháng trước
    prisma.tenant.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    // Tạm trú mới tháng này
    prisma.tenant.count({ where: { residencyStatus: 'DA_DANG_KY', updatedAt: { gte: startOfThisMonth } } }),
    // Tạm trú mới tháng trước
    prisma.tenant.count({ where: { residencyStatus: 'DA_DANG_KY', updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    
    prisma.room.count({ where: { status: 'DANG_O' } }),
    prisma.room.count({ where: { status: 'TRONG' } }),
    prisma.room.count({ where: { status: 'BAO_TRI' } }),
    prisma.contract.count({ where: { status: 'SAP_HET_HAN' } }),
  ]);

  // Hiệu suất lấp đầy = (Tổng số phòng đang ở / (Tổng số phòng trống + bảo trì + đang ở)) * 100%
  const totalRelevantRooms = occupiedRooms + emptyRooms + maintenanceRooms;
  const occupancyRate = totalRelevantRooms > 0 ? Math.round((occupiedRooms / totalRelevantRooms) * 100) : 0;

  // Tỷ lệ thay đổi tổng khách: (Tháng này / Tháng trước) * 100
  const totalChangeRate = newTenantsLastMonth > 0 ? Math.round((newTenantsThisMonth / newTenantsLastMonth) * 100) : (newTenantsThisMonth > 0 ? 100 : 0);

  // Tỷ lệ thay đổi tạm trú: (Tháng này / Tháng trước) * 100
  const residencyChangeRate = registeredLastMonth > 0 ? Math.round((registeredThisMonth / registeredLastMonth) * 100) : (registeredThisMonth > 0 ? 100 : 0);

  return {
    totalTenants,
    registeredResidency,
    expiringSoon,
    occupancyRate,
    occupiedRooms,
    emptyRooms,
    maintenanceRooms,
    totalChangeRate,
    residencyChangeRate
  };
};

const getTenantsForExport = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.residencyStatus) where.residencyStatus = filters.residencyStatus;
  if (filters.hostelId) where.room = { hostelId: Number(filters.hostelId) };
  if (filters.roomId) where.roomId = Number(filters.roomId);

  return await prisma.tenant.findMany({
    where,
    include: {
      room: {
        select: {
          roomNumber: true,
          hostel: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

module.exports = { getAllTenants, getTenantById, createTenant, updateTenant, deleteTenant, getStats, getTenantsForExport };
