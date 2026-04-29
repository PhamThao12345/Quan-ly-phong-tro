const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMeterIndices = async (month, year) => {
  // Lấy tất cả các phòng đang ở
  const rooms = await prisma.room.findMany({
    where: { status: 'DANG_O' },
    include: {
      hostel: true,
      electricityMeters: {
        where: { month: Number(month), year: Number(year) }
      }
    }
  });

  // Lấy giá điện mặc định từ bảng Service
  const electricityService = await prisma.service.findFirst({
    where: { name: { contains: 'Điện' }, status: 'ACTIVE' }
  });
  const defaultPrice = electricityService ? electricityService.price : 3500;

  return rooms.map(room => {
    const meter = room.electricityMeters[0];
    return {
      roomId: room.id,
      roomNumber: room.roomNumber,
      hostelName: room.hostel.name,
      previousIndex: meter ? meter.previousIndex : (room.electricityIndex || 0),
      currentIndex: meter ? meter.currentIndex : 0,
      consumption: meter ? meter.consumption : 0,
      amount: meter ? meter.amount : 0,
      unitPrice: meter ? meter.unitPrice : defaultPrice,
      status: meter ? 'DA_NHAP' : 'CHUA_NHAP'
    };
  });
};

const updateMeterIndex = async (data) => {
  const { roomId, month, year, currentIndex } = data;
  
  if (currentIndex === undefined || currentIndex === null) {
    throw { status: 400, message: 'Vui lòng nhập chỉ số điện hiện tại.' };
  }

  const room = await prisma.room.findUnique({
    where: { id: Number(roomId) },
    include: {
      electricityMeters: {
        where: {
          OR: [
            { month: Number(month), year: Number(year) },
            // Tìm kỳ trước đó để lấy số cũ nếu cần (nhưng ở đây ta lấy từ Room.electricityIndex hoặc bản ghi tháng này)
          ]
        }
      }
    }
  });

  if (!room) throw { status: 404, message: 'Phòng không tồn tại.' };

  // Tìm giá điện
  const electricityService = await prisma.service.findFirst({
    where: { name: { contains: 'Điện' }, status: 'ACTIVE' }
  });
  const unitPrice = electricityService ? electricityService.price : 3500;

  // Lấy chỉ số cũ & Đơn giá
  // Ưu tiên: 1. Bản ghi hiện tại (nếu đang update), 2. Bản ghi tháng trước, 3. Room.electricityIndex
  let previousIndex = room.electricityIndex || 0;
  let unitPriceToUse = unitPrice;
  
  // Nếu đã có bản ghi tháng này, lấy previousIndex và unitPrice từ đó (trường hợp cập nhật)
  const existingMeter = await prisma.electricityMeter.findUnique({
    where: { roomId_month_year: { roomId: Number(roomId), month: Number(month), year: Number(year) } }
  });

  if (existingMeter) {
    previousIndex = existingMeter.previousIndex;
    unitPriceToUse = existingMeter.unitPrice; // Giữ nguyên đơn giá cũ đã tính
  } else {
    // Thử tìm tháng trước để lấy chỉ số cũ
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMeter = await prisma.electricityMeter.findUnique({
      where: { roomId_month_year: { roomId: Number(roomId), month: prevMonth, year: prevYear } }
    });
    if (prevMeter) {
      previousIndex = prevMeter.currentIndex;
    }
  }

  if (Number(currentIndex) < previousIndex) {
    throw { status: 400, message: `Chỉ số mới (${currentIndex}) không được nhỏ hơn chỉ số cũ (${previousIndex}).` };
  }

  const consumption = Number(currentIndex) - previousIndex;
  const amount = consumption * unitPriceToUse;

  return await prisma.$transaction(async (tx) => {
    // 1. Lưu/Cập nhật chỉ số điện
    const meter = await tx.electricityMeter.upsert({
      where: { roomId_month_year: { roomId: Number(roomId), month: Number(month), year: Number(year) } },
      update: {
        currentIndex: Number(currentIndex),
        consumption,
        amount,
        unitPrice: unitPriceToUse
      },
      create: {
        roomId: Number(roomId),
        month: Number(month),
        year: Number(year),
        previousIndex,
        currentIndex: Number(currentIndex),
        consumption,
        amount,
        unitPrice: unitPriceToUse
      }
    });

    // 2. Cập nhật chỉ số điện mới nhất vào bảng Room
    await tx.room.update({
      where: { id: Number(roomId) },
      data: { electricityIndex: Number(currentIndex) }
    });

    return meter;
  });
};

const saveAllMeters = async (metersData) => {
  // metersData: array of { roomId, month, year, currentIndex }
  const results = [];
  for (const data of metersData) {
    if (data.currentIndex !== undefined && data.currentIndex !== null && data.currentIndex !== '') {
        const res = await updateMeterIndex(data);
        results.push(res);
    }
  }
  return results;
};

module.exports = {
  getMeterIndices,
  updateMeterIndex,
  saveAllMeters
};
