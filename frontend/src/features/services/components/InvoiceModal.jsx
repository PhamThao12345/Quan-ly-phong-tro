import React, { useState, useEffect } from 'react';
import * as invoiceApi from '../../../services/invoice.service';
import * as hostelApi from '../../../services/hostel.service';
import * as roomApi from '../../../services/room.service';

const InvoiceModal = ({ isOpen, onClose, invoiceId, mode = 'add', onSuccess }) => {
  // 1. Khai báo State theo yêu cầu
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]); // Mặc định là mảng rỗng
  
  const [formData, setFormData] = useState({
    hostelId: '',
    roomId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: 'DA_TAO',
    discount: 0
  });

  const [previewData, setPreviewData] = useState(null);

  // Load danh sách khu trọ ban đầu
  useEffect(() => {
    if (isOpen) {
      fetchHostels();
      if (invoiceId) {
        fetchInvoiceDetails(invoiceId);
      } else {
        // Reset state khi thêm mới
        setFormData({
          hostelId: '',
          roomId: '',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          status: 'DA_TAO',
          discount: 0
        });
        setPreviewData(null);
        setRooms([]);
      }
    }
  }, [isOpen, invoiceId]);

  // 3. Logic Tự động điền (Auto-fill) bằng useEffect
  useEffect(() => {
    // Chỉ tự động fetch preview ở chế độ thêm mới hoặc nếu roomId thay đổi
    if (formData.roomId && !invoiceId) {
      fetchPreview(formData.roomId, formData.month, formData.year);
    }
  }, [formData.roomId, formData.month, formData.year, invoiceId]);

  const fetchHostels = async () => {
    try {
      const data = await hostelApi.getHostels();
      setHostels(data);
    } catch (e) {
      console.error('Lỗi tải khu trọ:', e);
    }
  };

  const fetchInvoiceDetails = async (id) => {
    setPreviewLoading(true);
    try {
      const current = await invoiceApi.getInvoiceById(id);
      if (current) {
        setFormData({
          hostelId: current.room.hostelId,
          roomId: current.roomId,
          month: current.month,
          year: current.year,
          status: current.status,
          discount: current.discount || 0
        });
        setPreviewData(current);
        await fetchRoomsByHostel(current.room.hostelId);
      }
    } catch (e) {
      console.error('Lỗi tải hóa đơn:', e);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 2. Sửa lỗi Dropdown Số phòng (Fix triệt để)
  const fetchRoomsByHostel = async (hostelId) => {
    if (!hostelId) {
      setRooms([]);
      return;
    }
    try {
      const response = await roomApi.getRooms(1, 1000);
      
      // API trả về object { rooms: [], total: ... }, cần lấy trường rooms
      const allRooms = response?.rooms || (Array.isArray(response) ? response : []);
      
      const filtered = allRooms.filter(r => 
        Number(r.hostelId) === Number(hostelId) && 
        (invoiceId ? true : r.status === 'DANG_O')
      );
      setRooms(filtered);
    } catch (e) {
      console.error('Lỗi tải phòng:', e);
      setRooms([]);
    }
  };

  const handleHostelChange = (e) => {
    const hId = e.target.value;
    setFormData(prev => ({ ...prev, hostelId: hId, roomId: '' }));
    setPreviewData(null);
    if (hId) {
      fetchRoomsByHostel(hId);
    } else {
      setRooms([]);
    }
  };

  const handleRoomChange = (e) => {
    const rId = e.target.value;
    setFormData(prev => ({ ...prev, roomId: rId }));
    
    // Nếu chọn rỗng thì xóa previewData
    if (!rId) {
      setPreviewData(null);
    } else if (!invoiceId) {
      // Gọi fetch ngay lập tức để UX mượt hơn
      fetchPreview(rId, formData.month, formData.year);
    }
  };

  const fetchPreview = async (roomId, month, year) => {
    setPreviewLoading(true);
    try {
      const response = await invoiceApi.calculatePreview({ roomId, month, year });
      // Đề phòng backend trả về { status: 'success', data: { ... } }
      const data = response?.data || response;
      setPreviewData(data);
    } catch (e) {
      console.error('Lỗi preview:', e);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };
  
  // Tính tổng tiền sau khi trừ
  const calculateFinalTotal = () => {
    if (!previewData) return 0;
    // Nếu là preview chưa lưu, totalAmount là tổng các items
    // Nếu là hóa đơn đã lưu, totalAmount đã bao gồm discount cũ? 
    // Thống nhất: totalAmount từ backend cho preview/getById là TỔNG CHƯA TRỪ? 
    // Không, totalAmount trong DB là tổng CUỐI CÙNG.
    // Để an toàn, tính tổng từ items
    const itemsSum = previewData.items?.reduce((sum, item) => sum + item.amount, 0) || 0;
    return itemsSum - (formData.discount || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'view') return onClose();
    if (!previewData) return;

    setLoading(true);
    try {
      const finalTotal = calculateFinalTotal();
      if (invoiceId) {
        await invoiceApi.updateInvoice(invoiceId, { 
          status: formData.status,
          items: previewData.items,
          totalAmount: finalTotal,
          discount: formData.discount
        });
      } else {
        await invoiceApi.createInvoice({
          roomId: formData.roomId,
          month: formData.month,
          year: formData.year,
          items: previewData.items,
          totalAmount: finalTotal,
          discount: formData.discount
        });
      }
      onSuccess();
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi khi lưu hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  // Helper hiển thị giá trị mặc định
  const getItemValue = (name) => {
    if (!previewData || !previewData.items) return '---';
    const item = previewData.items.find(it => it.serviceName.toLowerCase().includes(name.toLowerCase()));
    return item ? `${item.amount.toLocaleString()}đ` : '0đ';
  };

  const getItemDesc = (name) => {
    if (!previewData || !previewData.items) return '';
    const item = previewData.items.find(it => it.serviceName.toLowerCase().includes(name.toLowerCase()));
    return item ? item.description : '';
  };

  if (!isOpen) return null;

  const isView = mode === 'view';
  const safeRooms = Array.isArray(rooms) ? rooms : [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-2xl font-extrabold text-slate-900 font-headline">
            {isView ? 'Chi tiết hóa đơn' : (invoiceId ? 'Cập nhật hóa đơn' : 'Thêm hóa đơn mới')}
          </h2>
          <div className="flex items-center gap-3">
            {invoiceId && !isView && (
              <button 
                type="button"
                onClick={() => fetchPreview(formData.roomId, formData.month, formData.year)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-amber-100 transition-all border border-amber-200"
                title="Lấy lại giá dịch vụ và danh sách dịch vụ mới nhất từ hệ thống"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Cập nhật giá mới
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-8 pt-8 pb-4 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar bg-white">
          
          {/* 1. Tháng & Năm */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Tháng</label>
              <select 
                value={formData.month}
                onChange={e => setFormData(prev => ({...prev, month: Number(e.target.value)}))}
                disabled={!!invoiceId || isView}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium disabled:opacity-70"
              >
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Năm</label>
              <select 
                value={formData.year}
                onChange={e => setFormData(prev => ({...prev, year: Number(e.target.value)}))}
                disabled={!!invoiceId || isView}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium disabled:opacity-70"
              >
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* 2. Khu trọ & Số phòng */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Khu trọ</label>
              <select 
                value={formData.hostelId}
                onChange={handleHostelChange}
                disabled={!!invoiceId || isView}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
              >
                <option value="">Chọn khu trọ</option>
                {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Số phòng</label>
              <select 
                value={formData.roomId}
                onChange={handleRoomChange}
                disabled={!!invoiceId || !formData.hostelId || isView}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
              >
                <option value="">Chọn phòng</option>
                {safeRooms.length > 0 ? (
                  safeRooms.map(room => <option key={room.id} value={room.id}>Phòng {room.roomNumber}</option>)
                ) : (
                  <option disabled>Không có phòng...</option>
                )}
              </select>
            </div>
          </div>

          {/* Luôn hiển thị các trường thông tin bên dưới */}
          <div className={`space-y-5 transition-opacity duration-300 ${previewLoading ? 'opacity-50' : 'opacity-100'}`}>
            
            {/* Danh sách dịch vụ động - Không fix cứng 5 loại nữa */}
            {previewData?.items?.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {previewData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          item.serviceName.toLowerCase().includes('điện') ? 'bg-amber-50 text-amber-600' :
                          item.serviceName.toLowerCase().includes('nước') ? 'bg-blue-50 text-blue-600' :
                          item.serviceName.toLowerCase().includes('phòng') ? 'bg-emerald-50 text-emerald-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          <span className="material-symbols-outlined text-xl">
                            {item.serviceName.toLowerCase().includes('điện') ? 'bolt' :
                             item.serviceName.toLowerCase().includes('nước') ? 'water_drop' :
                             item.serviceName.toLowerCase().includes('phòng') ? 'home' :
                             'service_toolbox'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{item.serviceName}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase">{item.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-slate-900">{item.amount.toLocaleString()}đ</p>
                        <p className="text-[10px] text-slate-400 italic">
                          {item.quantity} {item.serviceName.toLowerCase().includes('phòng') ? 'tháng' : ''} x {item.unitPrice.toLocaleString()}đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">description</span>
                <p className="text-sm text-slate-400 font-medium">Vui lòng chọn phòng để xem chi tiết chi phí</p>
              </div>
            )}

            {/* Ô Được trừ - Chỉ hiện khi Sửa hoặc Xem Chi tiết */}
            {invoiceId && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5 col-span-2">
                  <label className="block text-xs font-bold text-red-500 uppercase tracking-widest px-1">Được trừ (VNĐ)</label>
                  <div className="relative">
                    {isView ? (
                      <input 
                        className="w-full px-4 py-3 bg-red-50/50 border border-red-100 rounded-xl text-red-600 font-bold outline-none text-base cursor-not-allowed" 
                        readOnly 
                        type="text" 
                        value={`${(formData.discount || 0).toLocaleString()}đ`}
                      />
                    ) : (
                      <>
                        <input 
                          className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-base font-bold text-red-600 pr-12" 
                          type="number"
                          value={formData.discount}
                          onChange={e => setFormData(prev => ({...prev, discount: Number(e.target.value)}))}
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-300 font-bold text-sm">VNĐ</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isView && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Trạng thái thanh toán</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData(prev => ({...prev, status: e.target.value}))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold text-emerald-700"
                >
                  <option value="DA_TAO">Đã tạo</option>
                  <option value="DA_GUI">Đã gửi</option>
                  <option value="DA_THANH_TOAN">Đã thanh toán</option>
                  <option value="QUA_HAN">Quá hạn</option>
                </select>
              </div>
            )}

            {/* Tổng tiền */}
            <div className="mt-8 px-6 py-5 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <label className="block text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest mb-1">Tổng tiền thanh toán</label>
                <p className="text-xs text-slate-500">
                  {previewData ? `Tháng ${formData.month}/${formData.year} - Phòng ${previewData?.roomNumber || '...'}` : 'Đang chờ chọn phòng...'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-emerald-600 font-headline">
                  {previewData ? `${calculateFinalTotal().toLocaleString()}đ` : '0đ'}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 items-center">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-all">
            Hủy
          </button>
          {!isView && (
            <button 
              onClick={handleSubmit}
              disabled={loading || (!previewData && !invoiceId)}
              className="px-8 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">save</span>
                  {invoiceId ? 'Lưu thông tin' : 'Lưu hóa đơn'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
