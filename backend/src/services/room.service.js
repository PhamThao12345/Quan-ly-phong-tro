const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllRooms = async (page, limit, search) => {
  const skip = (page - 1) * limit;
  const where = {
    roomNumber: { contains: search },
    hostel: {
      status: { not: 'NGUNG_HOAT_DONG' }
    }
  };

  const [total, rooms] = await Promise.all([
    prisma.room.count({ where }),
    prisma.room.findMany({
      where,
      skip,
      take: limit,
      include: {
        hostel: {
          select: { name: true, address: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return { total, page, limit, totalPages: Math.ceil(total / limit), rooms };
};

const createRoom = async (data) => {
  const { hostelId, roomNumber, floor, price, status, description, electricityIndex } = data;
  
  const hExist = await prisma.hostel.findUnique({ where: { id: Number(hostelId) } });
  if (!hExist) throw { status: 404, message: 'Khu trọ không tồn tại.' };

  const exists = await prisma.room.findUnique({
    where: { hostelId_roomNumber: { hostelId: Number(hostelId), roomNumber } }
  });
  if (exists) throw { status: 400, message: `Số phòng ${roomNumber} đã tồn tại trong khu trọ này.` };
  
  return await prisma.room.create({
    data: {
      hostelId: Number(hostelId),
      roomNumber,
      floor: floor ? Number(floor) : null,
      price: price ? Number(price) : null,
      electricityIndex: electricityIndex ? Number(electricityIndex) : 0,
      description,
      status: status || 'TRONG',
    }
  });
};

const updateRoom = async (id, data) => {
  const { roomNumber, floor, price, status, hostelId, description, electricityIndex } = data;
  const exists = await prisma.room.findUnique({ where: { id } });
  if (!exists) throw { status: 404, message: 'Phòng không tồn tại.' };

  if (roomNumber && roomNumber !== exists.roomNumber) {
    const targetHostel = hostelId ? Number(hostelId) : exists.hostelId;
    const nameCheck = await prisma.room.findUnique({
      where: { hostelId_roomNumber: { hostelId: targetHostel, roomNumber } }
    });
    if (nameCheck) throw { status: 400, message: `Số phòng ${roomNumber} đã tồn tại trong khu trọ này.` };
  }

  return await prisma.room.update({
    where: { id },
    data: {
      hostelId: hostelId ? Number(hostelId) : undefined,
      roomNumber,
      floor: floor !== undefined ? Number(floor) : undefined,
      price: price !== undefined ? Number(price) : undefined,
      electricityIndex: electricityIndex !== undefined ? Number(electricityIndex) : undefined,
      description,
      status
    }
  });
};

const deleteRoom = async (id) => {
  const exists = await prisma.room.findUnique({ where: { id } });
  if (!exists) throw { status: 404, message: 'Phòng không tồn tại.' };

  if (exists.status === 'DANG_O') {
    throw { status: 400, message: 'Không thể xoá. Phòng trọ hiện đang có người thuê.' };
  }

  return await prisma.room.delete({ where: { id } });
};

module.exports = { getAllRooms, createRoom, updateRoom, deleteRoom };
