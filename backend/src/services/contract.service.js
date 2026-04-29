const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');

// Tự động cập nhật trạng thái "Sắp hết hạn" cho các hợp đồng
const updateExpiringContracts = async () => {
  const now = new Date();
  const next30Days = new Date();
  next30Days.setDate(now.getDate() + 30);

  // Tìm các hợp đồng "Đang hiệu lực" mà ngày kết thúc <= 30 ngày tới
  await prisma.contract.updateMany({
    where: {
      status: 'DANG_HIEU_LUC',
      endDate: {
        lte: next30Days,
        gte: now
      }
    },
    data: {
      status: 'SAP_HET_HAN'
    }
  });

  // Chuyển sang "Đã kết thúc" nếu ngày kết thúc < hiện tại
  await prisma.contract.updateMany({
    where: {
      status: { in: ['DANG_HIEU_LUC', 'SAP_HET_HAN'] },
      endDate: {
        lt: now
      }
    },
    data: {
      status: 'DA_KET_THUC'
    }
  });
};

const getAllContracts = async (page, limit, search, filters = {}) => {
  await updateExpiringContracts(); // Luôn cập nhật trạng thái trước khi lấy danh sách
  const skip = (page - 1) * limit;
  const where = {};

  if (search) {
    where.OR = [
      { room: { roomNumber: { contains: search } } },
      { tenants: { some: { tenant: { fullName: { contains: search } } } } }
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.hostelId) {
    where.room = { hostelId: Number(filters.hostelId) };
  }

  if (filters.fromDate || filters.toDate) {
    where.startDate = {};
    if (filters.fromDate) where.startDate.gte = new Date(filters.fromDate);
    if (filters.toDate) where.startDate.lte = new Date(filters.toDate + 'T23:59:59.999Z');
  }

  const [total, contracts] = await Promise.all([
    prisma.contract.count({ where }),
    prisma.contract.findMany({
      where,
      skip,
      take: limit,
      include: {
        room: {
          include: { hostel: true }
        },
        tenants: {
          include: { tenant: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return { total, page, limit, totalPages: Math.ceil(total / limit), contracts };
};

const getContractById = async (id) => {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      room: {
        include: { hostel: true }
      },
      tenants: {
        include: { tenant: true }
      }
    }
  });
  if (!contract) throw { status: 404, message: 'Hợp đồng không tồn tại.' };
  return contract;
};

const createContract = async (data) => {
  const { roomId, startDate, endDate, deposit, content, tenants } = data;

  const room = await prisma.room.findUnique({ where: { id: Number(roomId) } });
  if (!room) throw { status: 404, message: 'Phòng không tồn tại.' };
  if (room.status !== 'TRONG') throw { status: 400, message: 'Hợp đồng chỉ có thể lập cho phòng đang trống.' };

  if (new Date(startDate) >= new Date(endDate)) {
    throw { status: 400, message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc.' };
  }

  return await prisma.$transaction(async (tx) => {
    const contract = await tx.contract.create({
      data: {
        roomId: Number(roomId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        deposit: Number(deposit) || 0,
        content,
        status: 'DANG_HIEU_LUC'
      }
    });

    if (tenants && tenants.length > 0) {
      for (const tData of tenants) {
        let tenant = await tx.tenant.findUnique({ where: { cccd: tData.cccd } });
        
        if (!tenant) {
          tenant = await tx.tenant.create({
            data: {
              fullName: tData.fullName,
              cccd: tData.cccd,
              phoneNumber: tData.phoneNumber,
              email: tData.email || null,
              dateOfBirth: tData.dateOfBirth ? new Date(tData.dateOfBirth) : null,
              hometown: tData.hometown || null,
              roomId: Number(roomId),
              status: 'DANG_THUE'
            }
          });
        } else {
          tenant = await tx.tenant.update({
            where: { id: tenant.id },
            data: { roomId: Number(roomId), status: 'DANG_THUE' }
          });
        }

        await tx.contractTenant.create({
          data: {
            contractId: contract.id,
            tenantId: tenant.id,
            isMain: tData.isMain || false
          }
        });
      }
    }

    await tx.room.update({
      where: { id: Number(roomId) },
      data: { status: 'DANG_O' }
    });

    return contract;
  });
};

// CẬP NHẬT HỢP ĐỒNG
const updateContract = async (id, data) => {
  const contract = await prisma.contract.findUnique({ 
    where: { id },
    include: { tenants: true }
  });
  if (!contract) throw { status: 404, message: 'Hợp đồng không tồn tại.' };

  const updateData = { ...data };
  
  // Logic tự động cập nhật trạng thái nếu thay đổi ngày kết thúc
  if (data.endDate) {
    const now = new Date();
    const end = new Date(data.endDate);
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    if (end < now) updateData.status = 'DA_KET_THUC';
    else if (diffDays <= 30) updateData.status = 'SAP_HET_HAN';
    else updateData.status = 'DANG_HIEU_LUC';
  }

  // Nếu người dùng chọn thủ công trạng thái, hãy ưu tiên nếu không thay đổi endDate cùng lúc
  if (data.status && !data.endDate) {
    updateData.status = data.status;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Xử lý thay đổi Phòng (Room change)
    if (data.roomId && Number(data.roomId) !== contract.roomId) {
      const oldRoomId = contract.roomId;
      const newRoomId = Number(data.roomId);

      // Cập nhật phòng cũ về Trống
      await tx.room.update({
        where: { id: oldRoomId },
        data: { status: 'TRONG' }
      });

      // Cập nhật phòng mới sang Đang ở
      await tx.room.update({
        where: { id: newRoomId },
        data: { status: 'DANG_O' }
      });

      // Cập nhật roomId cho các khách thuê thuộc hợp đồng này
      for (const ct of contract.tenants) {
        await tx.tenant.update({
          where: { id: ct.tenantId },
          data: { roomId: newRoomId, status: 'DANG_THUE' }
        });
      }
    }

    // 2. Cập nhật thông tin khách thuê
    if (data.tenants && data.tenants.length > 0) {
      for (const tData of data.tenants) {
        if (tData.tenantId || tData.id) {
          const tId = tData.tenantId || tData.id;
          await tx.tenant.update({
            where: { id: Number(tId) },
            data: {
              fullName: tData.fullName,
              cccd: tData.cccd,
              phoneNumber: tData.phoneNumber,
              email: tData.email,
              hometown: tData.hometown,
              dateOfBirth: tData.dateOfBirth ? new Date(tData.dateOfBirth) : null
            }
          });
        }
      }
    }

    // 3. Xử lý dữ liệu Contract
    delete updateData.tenants;
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.deposit) updateData.deposit = Number(updateData.deposit);
    if (updateData.roomId) updateData.roomId = Number(updateData.roomId);

    return await tx.contract.update({
      where: { id },
      data: updateData
    });
  });
};

// GIA HẠN HỢP ĐỒNG (Cộng 1 năm + Khôi phục trạng thái phòng/khách)
const renewContract = async (id) => {
  const contract = await prisma.contract.findUnique({ 
    where: { id },
    include: { tenants: true }
  });
  if (!contract) throw { status: 404, message: 'Hợp đồng không tồn tại.' };

  const oldEndDate = new Date(contract.endDate);
  const newEndDate = new Date(oldEndDate);
  newEndDate.setFullYear(oldEndDate.getFullYear() + 1);

  // Logic cập nhật trạng thái sau gia hạn
  const now = new Date();
  const diffDays = Math.ceil((newEndDate - now) / (1000 * 60 * 60 * 24));
  let newStatus = 'DANG_HIEU_LUC';
  if (newEndDate < now) newStatus = 'DA_KET_THUC';
  else if (diffDays <= 30) newStatus = 'SAP_HET_HAN';

  return await prisma.$transaction(async (tx) => {
    // 1. Đảm bảo phòng ở trạng thái DANG_O
    await tx.room.update({
      where: { id: contract.roomId },
      data: { status: 'DANG_O' }
    });

    // 2. Đảm bảo các khách thuê ở trạng thái DANG_THUE
    for (const ct of contract.tenants) {
      await tx.tenant.update({
        where: { id: ct.tenantId },
        data: { status: 'DANG_THUE', roomId: contract.roomId }
      });
    }

    // 3. Cập nhật HĐ
    return await tx.contract.update({
      where: { id },
      data: {
        endDate: newEndDate,
        status: newStatus
      }
    });
  });
};

// KẾT THÚC HỢP ĐỒNG
const terminateContract = async (id) => {
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) throw { status: 404, message: 'Hợp đồng không tồn tại.' };

  return await prisma.$transaction(async (tx) => {
    // 1. Cập nhật trạng thái HĐ
    const updated = await tx.contract.update({
      where: { id },
      data: { status: 'DA_KET_THUC', endDate: new Date() }
    });

    // 2. Cập nhật phòng về Trống
    await tx.room.update({
      where: { id: contract.roomId },
      data: { status: 'TRONG' }
    });

    // 3. Cập nhật trạng thái khách thuê
    const cTenants = await tx.contractTenant.findMany({ where: { contractId: id } });
    for (const ct of cTenants) {
      await tx.tenant.update({
        where: { id: ct.tenantId },
        data: { status: 'NGUNG_THUE', roomId: null }
      });
    }

    return updated;
  });
};

const deleteContract = async (id) => {
  const exists = await prisma.contract.findUnique({ where: { id } });
  if (!exists) throw { status: 404, message: 'Hợp đồng không tồn tại.' };

  return await prisma.contract.delete({ where: { id } });
};

const getStats = async () => {
  await updateExpiringContracts();
  
  const [activeContracts, expiringSoon, occupiedRooms] = await Promise.all([
    prisma.contract.count({
      where: { status: { in: ['DANG_HIEU_LUC', 'SAP_HET_HAN'] } }
    }),
    prisma.contract.count({
      where: { 
        status: 'SAP_HET_HAN'
      }
    }),
    prisma.room.findMany({
      where: { status: 'DANG_O' },
      select: { price: true }
    })
  ]);

  const expectedRevenue = occupiedRooms.reduce((sum, room) => sum + (room.price || 0), 0);

  return {
    activeContracts,
    expiringSoon,
    expectedRevenue
  };
};

// XUẤT FILE WORD
const generateWordContract = async (id) => {
  const contract = await getContractById(id);
  const mainTenant = contract.tenants.find(t => t.isMain)?.tenant || contract.tenants[0]?.tenant;
  const others = contract.tenants.filter(t => !t.isMain).map(t => t.tenant.fullName).join(', ');

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 28 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          text: "--------------------------",
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "HỢP ĐỒNG THUÊ PHÒNG TRỌ", bold: true, size: 36 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Hôm nay, ngày " + new Date().toLocaleDateString('vi-VN') + ", tại Emerald Ledger - T's House.", italic: true })
          ],
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: "BÊN CHO THUÊ (BÊN A):", bold: true })],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({ text: "Đại diện: Ban quản lý Emerald Ledger" }),
        new Paragraph({ text: "Địa chỉ: " + (contract.room?.hostel?.address || "Hồ Chí Minh") }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: "BÊN THUÊ (BÊN B):", bold: true })],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({ text: "Họ và tên: " + mainTenant?.fullName }),
        new Paragraph({ text: "Số CCCD: " + mainTenant?.cccd }),
        new Paragraph({ text: "Số điện thoại: " + mainTenant?.phoneNumber }),
        others ? new Paragraph({ text: "Người ở cùng: " + others }) : new Paragraph({ text: "" }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: "NỘI DUNG THỎA THUẬN:", bold: true })],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({ text: "1. Phòng thuê số: " + contract.room?.roomNumber + " tại khu " + contract.room?.hostel?.name }),
        new Paragraph({ text: "2. Thời hạn thuê: Từ " + new Date(contract.startDate).toLocaleDateString('vi-VN') + " đến " + new Date(contract.endDate).toLocaleDateString('vi-VN') }),
        new Paragraph({ text: "3. Giá thuê: " + contract.room?.price?.toLocaleString() + " VNĐ/tháng" }),
        new Paragraph({ text: "4. Tiền đặt cọc: " + contract.deposit?.toLocaleString() + " VNĐ" }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: "ĐIỀU KHOẢN CHI TIẾT:", bold: true })],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: contract.content || "Theo quy định chung của khu trọ." })],
          spacing: { after: 800 },
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "ĐẠI DIỆN BÊN A                                         ĐẠI DIỆN BÊN B", bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 800 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "(Ký và ghi rõ họ tên)                                  (Ký và ghi rõ họ tên)", italic: true })
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
};

// XUẤT DANH SÁCH HỢP ĐỒNG (CSV)
const exportContractsCsv = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.hostelId) where.room = { hostelId: Number(filters.hostelId) };
  if (filters.fromDate || filters.toDate) {
    where.startDate = {};
    if (filters.fromDate) where.startDate.gte = new Date(filters.fromDate);
    if (filters.toDate) where.startDate.lte = new Date(filters.toDate + 'T23:59:59.999Z');
  }

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      room: { include: { hostel: true } },
      tenants: { include: { tenant: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  let csv = '\ufeffMã HĐ,Người đại diện,SĐT,Khu trọ,Phòng,Ngày bắt đầu,Ngày kết thúc,Giá thuê,Tiền cọc,Trạng thái\n';
  contracts.forEach(c => {
    const mainTenant = c.tenants.find(t => t.isMain)?.tenant || c.tenants[0]?.tenant;
    csv += `HĐ-${c.id},"${mainTenant?.fullName}","${mainTenant?.phoneNumber}","${c.room?.hostel?.name}","${c.room?.roomNumber}",${new Date(c.startDate).toLocaleDateString('vi-VN')},${new Date(c.endDate).toLocaleDateString('vi-VN')},${c.room?.price},${c.deposit},"${c.status}"\n`;
  });

  return Buffer.from(csv, 'utf-8');
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
  generateWordContract,
  exportContractsCsv
};
