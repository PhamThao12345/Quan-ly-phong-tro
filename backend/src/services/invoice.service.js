const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Tính toán xem trước hóa đơn cho một phòng
 */
/**
 * Tính toán xem trước hóa đơn cho một phòng (chưa lưu vào DB)
 */
const calculateInvoicePreview = async (roomId, month, year) => {
  const m = Number(month);
  const y = Number(year);
  const rId = Number(roomId);

  // 1. Lấy thông tin phòng, khu trọ, khách thuê đang ở và các dịch vụ của phòng
  const room = await prisma.room.findUnique({
    where: { id: rId },
    include: {
      hostel: true,
      tenants: {
        where: { status: 'DANG_THUE' }
      },
      services: {
        where: {
          service: { status: 'ACTIVE' }
        },
        include: { service: true }
      }
    }
  });

  if (!room) throw { status: 404, message: 'Không tìm thấy thông tin phòng.' };

  const tenantsCount = room.tenants.length;
  const items = [];

  // 2. Tiền phòng
  items.push({
    serviceName: 'Tiền phòng',
    quantity: 1,
    unitPrice: room.price || 0,
    amount: room.price || 0,
    description: `Tiền thuê phòng tháng ${m}/${y}`
  });

  // 3. Xử lý Chỉ số điện (Tháng hiện tại và tháng trước)
  const currentMeter = await prisma.electricityMeter.findUnique({
    where: { roomId_month_year: { roomId: rId, month: m, year: y } }
  });

  // Tìm chỉ số cũ từ tháng trước để hiển thị nếu chưa có bản ghi tháng này
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevYear = m === 1 ? y - 1 : y;
  const prevMeter = await prisma.electricityMeter.findUnique({
    where: { roomId_month_year: { roomId: rId, month: prevMonth, year: prevYear } }
  });

  if (currentMeter) {
    items.push({
      serviceName: 'Tiền điện',
      quantity: currentMeter.consumption,
      unitPrice: currentMeter.unitPrice,
      amount: currentMeter.amount,
      description: `Chỉ số: ${currentMeter.previousIndex} -> ${currentMeter.currentIndex} (${currentMeter.consumption} kWh)`
    });
  } else {
    // Nếu chưa nhập chỉ số tháng này, lấy giá điện từ hệ thống
    const elecSvc = await prisma.service.findFirst({ where: { name: { contains: 'Điện' } } });
    const uPrice = elecSvc ? elecSvc.price : 3500;
    const startIndex = prevMeter ? prevMeter.currentIndex : (room.electricityIndex || 0);
    
    items.push({
      serviceName: 'Tiền điện',
      quantity: 0,
      unitPrice: uPrice,
      amount: 0,
      description: `Chỉ số cũ: ${startIndex}. (Chưa nhập chỉ số tháng ${m})`
    });
  }

  // 4. Tính toán các dịch vụ khác (ưu tiên các dịch vụ tính theo đầu người)
  room.services.forEach(rs => {
    const s = rs.service;
    if (s.name.toLowerCase().includes('điện')) return; // Bỏ qua điện vì đã tính riêng

    let quantity = 1;
    let desc = s.name;

    // Logic tính theo đầu người hoặc theo phòng
    if (s.unit.toLowerCase().includes('người')) {
      quantity = tenantsCount;
      desc = `${s.name} (${tenantsCount} người)`;
    } else if (s.unit.toLowerCase().includes('phòng')) {
      quantity = 1;
      desc = `${s.name} (Tính theo phòng)`;
    }

    items.push({
      serviceName: s.name,
      quantity,
      unitPrice: s.price,
      amount: s.price * quantity,
      description: desc
    });
  });

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    roomNumber: room.roomNumber,
    hostelName: room.hostel.name,
    mainTenant: room.tenants[0]?.fullName || 'Chưa có khách thuê',
    tenantsCount,
    items,
    totalAmount,
    month: m,
    year: y
  };
};

/**
 * Tạo hóa đơn mới
 */
const createInvoice = async (data) => {
  const { roomId, month, year, items, totalAmount } = data;

  // Tạo mã hóa đơn dựa trên ID lớn nhất hiện tại và timestamp để đảm bảo duy nhất
  const lastInvoice = await prisma.invoice.findFirst({
    orderBy: { id: 'desc' }
  });
  const nextId = lastInvoice ? lastInvoice.id + 1 : 1;
  const timestamp = Math.floor(Date.now() / 1000).toString().slice(-4);
  const invoiceCode = `INV-${nextId.toString().padStart(4, '0')}-${timestamp}`;

  return await prisma.invoice.create({
    data: {
      invoiceCode,
      roomId: Number(roomId),
      month: Number(month),
      year: Number(year),
      totalAmount: Number(totalAmount),
      status: 'DA_TAO',
      items: {
        create: items.map(item => ({
          serviceName: item.serviceName,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          amount: Number(item.amount),
          description: item.description
        }))
      }
    },
    include: { items: true, room: { include: { hostel: true } } }
  });
};

/**
 * Lấy danh sách hóa đơn
 */
const getInvoices = async (params) => {
  const { page = 1, limit = 10, hostelId, roomId, status, month, year, search } = params;
  const skip = (page - 1) * limit;

  const where = {};
  if (hostelId) where.room = { hostelId: Number(hostelId) };
  if (roomId) where.roomId = Number(roomId);
  if (status) where.status = status;
  if (month) where.month = Number(month);
  if (year) where.year = Number(year);
  if (search) {
    where.OR = [
      { invoiceCode: { contains: search } },
      { room: { roomNumber: { contains: search } } },
      { room: { hostel: { name: { contains: search } } } }
    ];
  }

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      include: {
        room: {
          include: {
            hostel: true,
            tenants: { where: { status: 'DANG_THUE' } }
          }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    data: invoices.map(inv => ({
      ...inv,
      hostelName: inv.room.hostel.name,
      roomNumber: inv.room.roomNumber,
      mainTenant: inv.room.tenants[0]?.fullName || 'N/A'
    })),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Cập nhật hóa đơn
 */
const updateInvoice = async (id, data) => {
  const { status, totalAmount, items } = data;

  // Nếu cập nhật items, chúng ta sẽ xóa items cũ và tạo lại (để đơn giản)
  if (items) {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: Number(id) } });
    return await prisma.invoice.update({
      where: { id: Number(id) },
      data: {
        status,
        totalAmount: Number(totalAmount),
        items: {
          create: items.map(item => ({
            serviceName: item.serviceName,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            amount: Number(item.amount),
            description: item.description
          }))
        }
      },
      include: { items: true }
    });
  }

  return await prisma.invoice.update({
    where: { id: Number(id) },
    data: { status },
    include: { items: true }
  });
};

/**
 * Xóa hóa đơn
 */
const deleteInvoice = async (id) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: Number(id) } });
  if (!invoice) throw { status: 404, message: 'Không tìm thấy hóa đơn' };
  
  if (invoice.status === 'DA_THANH_TOAN') {
    throw { status: 400, message: 'Không thể xóa hóa đơn đã thanh toán' };
  }

  return await prisma.invoice.delete({ where: { id: Number(id) } });
};

const nodemailer = require('nodemailer');

/**
 * Gửi email hóa đơn
 */
const sendInvoiceEmail = async (id) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: {
      room: {
        include: {
          hostel: true,
          tenants: { where: { status: 'DANG_THUE' } }
        }
      },
      items: true
    }
  });

  if (!invoice) throw { status: 404, message: 'Không tìm thấy hóa đơn' };

  const mainTenant = invoice.room.tenants[0];
  if (!mainTenant || !mainTenant.email) {
    throw { status: 400, message: 'Khách thuê chưa có địa chỉ email' };
  }

  // Tạo link QR VietQR (Ví dụ: Ngân hàng MB, STK: 0901234567)
  const bankId = process.env.BANK_ID || 'MB';
  const accountNo = process.env.BANK_ACCOUNT_NO || '0901234567';
  const accountName = process.env.BANK_ACCOUNT_NAME || 'CHU NHA';
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${invoice.totalAmount}&addInfo=${encodeURIComponent(invoice.invoiceCode)}&accountName=${encodeURIComponent(accountName)}`;

  // Cấu hình transporter (Lưu ý: user cần thêm EMAIL_USER và EMAIL_PASS vào .env)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'test@example.com',
      pass: process.env.EMAIL_PASS || 'password'
    }
  });

  // Tạo nội dung chi tiết hóa đơn
  const itemsHtml = invoice.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.serviceName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice.toLocaleString()}đ</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${item.amount.toLocaleString()}đ</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"Quản Lý Phòng Trọ" <${process.env.EMAIL_USER || 'test@example.com'}>`,
    to: mainTenant.email,
    subject: `Hóa đơn tiền nhà tháng ${invoice.month}/${invoice.year} - Phòng ${invoice.room.roomNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #006948; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Hóa đơn tiền nhà tháng ${invoice.month}/${invoice.year}</h2>
          <p style="margin: 5px 0 0 0;">Phòng: ${invoice.room.roomNumber} - Khu: ${invoice.room.hostel.name}</p>
        </div>
        <div style="padding: 20px;">
          <p>Xin chào <strong>${mainTenant.fullName}</strong>,</p>
          <p>Dưới đây là chi tiết hóa đơn tiền phòng và các dịch vụ của bạn trong tháng ${invoice.month}/${invoice.year}.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Dịch vụ</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Số lượng</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Đơn giá</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 16px;">Tổng cộng:</td>
                <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px; color: #e53e3e;">
                  ${invoice.totalAmount.toLocaleString()}đ
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 30px; text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #333;">Quét mã QR để thanh toán</h3>
            <p style="color: #666; font-size: 14px;">Mã QR đã bao gồm số tiền và nội dung chuyển khoản tự động.</p>
            <img src="${qrUrl}" alt="QR Code Thanh Toán" style="max-width: 250px; border: 1px solid #ddd; border-radius: 8px; margin-top: 10px;" />
            <p style="font-weight: bold; margin-top: 15px;">Mã hóa đơn: ${invoice.invoiceCode}</p>
          </div>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #ddd;">
          <p style="margin: 0;">Email này được gửi tự động từ hệ thống Quản lý phòng trọ. Vui lòng không trả lời.</p>
        </div>
      </div>
    `
  };

  // Nếu không có mật khẩu cấu hình, bỏ qua gửi mail thực tế để không sập app (nhưng vẫn update status)
  if (process.env.EMAIL_PASS) {
    await transporter.sendMail(mailOptions);
  } else {
    console.warn("Chưa cấu hình EMAIL_USER và EMAIL_PASS trong file .env. Bỏ qua gửi email thực tế.");
  }

  // Cập nhật trạng thái
  await prisma.invoice.update({
    where: { id: Number(id) },
    data: { status: 'DA_GUI' }
  });

  return {
    success: true,
    message: process.env.EMAIL_PASS ? `Đã gửi email tới ${mainTenant.email}` : `Đã mô phỏng gửi mail (Thiếu cấu hình SMTP)`,
    qrUrl
  };
};

/**
 * Lấy chi tiết một hóa đơn
 */
const getInvoiceById = async (id) => {
  const inv = await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: {
      room: {
        include: {
          hostel: true,
          tenants: { where: { status: 'DANG_THUE' } }
        }
      },
      items: true
    }
  });

  if (!inv) throw { status: 404, message: 'Không tìm thấy hóa đơn' };

  return {
    ...inv,
    hostelName: inv.room.hostel.name,
    roomNumber: inv.room.roomNumber,
    mainTenant: inv.room.tenants[0]?.fullName || 'N/A'
  };
};

module.exports = {
  calculateInvoicePreview,
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  sendInvoiceEmail
};
