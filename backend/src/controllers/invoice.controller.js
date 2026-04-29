const invoiceService = require('../services/invoice.service');
const activityService = require('../services/activity.service');
const notificationService = require('../services/notification.service');


const getInvoices = async (req, res) => {
  try {
    const result = await invoiceService.getInvoices(req.query);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const calculatePreview = async (req, res) => {
  try {
    const { roomId, month, year } = req.body;
    if (!roomId || !month || !year) {
      return res.status(400).json({ message: 'Thiếu thông tin roomId, month hoặc year' });
    }
    const result = await invoiceService.calculateInvoicePreview(roomId, month, year);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const result = await invoiceService.createInvoice(req.body);
    await activityService.logActivity(req.user.id, `Đã tạo hóa đơn cho phòng ${result.room?.roomNumber || 'không xác định'}`, 'HOA_DON');
    await notificationService.createNotification({
      title: 'Hóa đơn mới',
      message: `Hóa đơn cho phòng ${result.room?.roomNumber || 'không xác định'} vừa được tạo.`,
      type: 'SUCCESS'
    });
    res.status(201).json(result);

  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const result = await invoiceService.updateInvoice(req.params.id, req.body);
    await activityService.logActivity(req.user.id, `Đã cập nhật hóa đơn #${result.invoiceCode}`, 'HOA_DON');
    await notificationService.createNotification({
      title: 'Cập nhật hóa đơn',
      message: `Hóa đơn #${result.invoiceCode} vừa được cập nhật trạng thái.`,
      type: 'INFO'
    });
    res.json(result);

  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    // Need to get invoice before delete to log its code
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    await invoiceService.deleteInvoice(req.params.id);
    await activityService.logActivity(req.user.id, `Đã xóa hóa đơn #${invoice.invoiceCode}`, 'HOA_DON');
    await notificationService.createNotification({
      title: 'Xóa hóa đơn',
      message: `Hóa đơn #${invoice.invoiceCode} đã bị xóa khỏi hệ thống.`,
      type: 'WARNING'
    });
    res.json({ message: 'Đã xóa hóa đơn thành công' });

  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const sendEmail = async (req, res) => {
  try {
    const result = await invoiceService.sendInvoiceEmail(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const result = await invoiceService.getInvoiceById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  calculatePreview,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendEmail
};
