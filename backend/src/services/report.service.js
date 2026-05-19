const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardReport = async (filterType, year, month) => {
  // Tự động chuyển các hóa đơn đã tạo, đã gửi quá 10 ngày sang trạng thái quá hạn
  try {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    await prisma.invoice.updateMany({
      where: {
        status: { in: ['DA_TAO', 'DA_GUI'] },
        createdAt: { lte: tenDaysAgo }
      },
      data: {
        status: 'QUA_HAN'
      }
    });
  } catch (error) {
    console.error('Lỗi khi tự động cập nhật hóa đơn quá hạn trong Báo cáo:', error);
  }

  // 1. Tổng khách thuê (status: DANG_THUE)
  const totalTenants = await prisma.tenant.count({
    where: { status: 'DANG_THUE' }
  });

  // 2. Tình trạng phòng
  const allRooms = await prisma.room.findMany();
  const totalRooms = allRooms.length;
  let rentedRooms = 0;
  let maintenanceRooms = 0;

  allRooms.forEach(room => {
    if (room.status === 'DANG_O') rentedRooms++;
    else if (room.status === 'BAO_TRI') maintenanceRooms++;
  });

  const vacantRooms = totalRooms - rentedRooms - maintenanceRooms;

  // 3. Doanh thu (Theo bộ lọc: month hoặc year)
  let revenueCondition = {};
  if (filterType === 'month') {
    revenueCondition = { month: parseInt(month), year: parseInt(year) };
  } else if (filterType === 'year') {
    revenueCondition = { year: parseInt(year) };
  }

  const invoices = await prisma.invoice.findMany({
    where: revenueCondition
  });
  
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // 4. Doanh thu 12 tháng của năm được chọn (Phục vụ biểu đồ)
  const yearInvoices = filterType === 'year' ? invoices : await prisma.invoice.findMany({
    where: { year: parseInt(year) }
  });

  const revenue12Months = Array(12).fill(0);
  yearInvoices.forEach(inv => {
    revenue12Months[inv.month - 1] += inv.totalAmount;
  });

  return {
    totalTenants,
    totalRooms,
    rentedRooms,
    maintenanceRooms,
    vacantRooms,
    totalRevenue,
    revenue12Months
  };
};

module.exports = {
  getDashboardReport
};
