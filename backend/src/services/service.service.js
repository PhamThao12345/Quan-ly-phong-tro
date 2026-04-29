const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllServices = async () => {
  return await prisma.service.findMany({
    include: {
      rooms: {
        include: {
          room: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const getServiceById = async (id) => {
  const service = await prisma.service.findUnique({
    where: { id: Number(id) },
    include: {
      rooms: {
        include: { room: true }
      }
    }
  });
  if (!service) throw { status: 404, message: 'Dịch vụ không tồn tại.' };
  return service;
};

const createService = async (data) => {
  const { name, price, unit } = data;
  if (!name) throw { status: 400, message: 'Tên dịch vụ không được để trống.' };
  if (price === undefined || price < 0) throw { status: 400, message: 'Giá dịch vụ phải lớn hơn hoặc bằng 0.' };

  return await prisma.service.create({
    data: {
      name,
      price: Number(price),
      unit,
      status: 'ACTIVE'
    }
  });
};

const updateService = async (id, data) => {
  const service = await prisma.service.findUnique({ where: { id: Number(id) } });
  if (!service) throw { status: 404, message: 'Dịch vụ không tồn tại.' };

  const { name, price, unit, status } = data;

  if (price !== undefined && Number(price) < 0) {
    throw { status: 400, message: 'Giá dịch vụ phải lớn hơn hoặc bằng 0.' };
  }

  return await prisma.service.update({
    where: { id: Number(id) },
    data: {
      name,
      price: price !== undefined ? Number(price) : undefined,
      unit,
      status
    }
  });
};

const deleteService = async (id) => {
  const service = await prisma.service.findUnique({
    where: { id: Number(id) },
    include: { rooms: true }
  });

  if (!service) throw { status: 404, message: 'Dịch vụ không tồn tại.' };

  // Kiểm tra nếu đang áp dụng cho phòng
  if (service.rooms.length > 0) {
    throw { status: 400, message: 'Không thể xóa dịch vụ đang được áp dụng cho phòng.' };
  }

  // TODO: Kiểm tra nếu đã được sử dụng trong hóa đơn tháng hiện tại
  // Hiện tại chưa có module Hóa đơn nên bỏ qua bước này hoặc để placeholder

  return await prisma.service.delete({
    where: { id: Number(id) }
  });
};

// Áp dụng dịch vụ cho các phòng
const applyServiceToRooms = async (serviceId, roomIds) => {
  const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
  if (!service) throw { status: 404, message: 'Dịch vụ không tồn tại.' };

  return await prisma.$transaction(
    roomIds.map(roomId => 
      prisma.roomService.upsert({
        where: {
          roomId_serviceId: {
            roomId: Number(roomId),
            serviceId: Number(serviceId)
          }
        },
        update: {},
        create: {
          roomId: Number(roomId),
          serviceId: Number(serviceId)
        }
      })
    )
  );
};

// Ngừng áp dụng dịch vụ cho phòng
const removeServiceFromRoom = async (serviceId, roomId) => {
  return await prisma.roomService.delete({
    where: {
      roomId_serviceId: {
        roomId: Number(roomId),
        serviceId: Number(serviceId)
      }
    }
  });
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  applyServiceToRooms,
  removeServiceFromRoom
};
