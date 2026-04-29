const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllHostels = async (search) => {
  return await prisma.hostel.findMany({
    where: {
      name: { contains: search }
    },
    include: {
      _count: {
        select: { rooms: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const createHostel = async (data) => {
  const exists = await prisma.hostel.findUnique({ where: { name: data.name } });
  if (exists) throw { status: 400, message: 'Tên khu trọ đã tồn tại trên hệ thống.' };
  
  return await prisma.hostel.create({ data });
};

const updateHostel = async (id, data) => {
  const exists = await prisma.hostel.findUnique({ 
    where: { id },
    include: { rooms: { include: { tenants: { where: { status: 'DANG_THUE' } } } } }
  });
  if (!exists) throw { status: 404, message: 'Khu trọ không tồn tại.' };

  if (data.name) {
    const nameCheck = await prisma.hostel.findFirst({ where: { name: data.name, id: { not: id } } });
    if (nameCheck) throw { status: 400, message: 'Tên khu trọ này đã tồn tại.' };
  }

  // Logic chuyển trạng thái
  if (data.status && data.status !== exists.status) {
    // 1. Ngừng hoạt động: Phải không còn khách
    if (data.status === 'NGUNG_HOAT_DONG') {
      const activeTenantsCount = exists.rooms.reduce((acc, room) => acc + room.tenants.length, 0);
      if (activeTenantsCount > 0) {
        throw { status: 400, message: 'Không thể ngừng hoạt động khu trọ vẫn còn khách thuê đang ở.' };
      }
    }

    // Thực hiện cập nhật trong transaction
    return await prisma.$transaction(async (tx) => {
      const updatedHostel = await tx.hostel.update({ where: { id }, data });

      // 2. Bảo trì: Chuyển tất cả phòng sang BAO_TRI
      if (data.status === 'BAO_TRI') {
        await tx.room.updateMany({
          where: { hostelId: id },
          data: { status: 'BAO_TRI' }
        });
      }

      // 3. Hoạt động lại: Tính toán lại trạng thái từng phòng
      if (data.status === 'HOAT_DONG') {
        const rooms = await tx.room.findMany({ 
          where: { hostelId: id },
          include: { tenants: { where: { status: 'DANG_THUE' } } }
        });

        for (const room of rooms) {
          const newStatus = room.tenants.length > 0 ? 'DANG_O' : 'TRONG';
          await tx.room.update({
            where: { id: room.id },
            data: { status: newStatus }
          });
        }
      }

      return updatedHostel;
    });
  }

  return await prisma.hostel.update({ where: { id }, data });
};

const deleteHostel = async (id) => {
  const exists = await prisma.hostel.findUnique({
    where: { id },
    include: { _count: { select: { rooms: true } } }
  });
  if (!exists) throw { status: 404, message: 'Khu trọ không tồn tại.' };
  if (exists._count.rooms > 0) throw { status: 400, message: 'Không thể xoá khu trọ đang chứa phòng trọ.' };

  return await prisma.hostel.delete({ where: { id } });
};

module.exports = { getAllHostels, createHostel, updateHostel, deleteHostel };
