import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import * as invoiceApi from '../../../services/invoice.service';
import * as hostelApi from '../../../services/hostel.service';
import InvoiceModal from '../components/InvoiceModal';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, loading, invoiceCode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden p-8 animate-in zoom-in duration-300">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <span className="material-symbols-outlined text-red-600 text-3xl">delete_forever</span>
        </div>
        <h3 className="text-xl font-extrabold text-center text-slate-900 mb-2 font-headline">Xác nhận xóa hóa đơn</h3>
        <p className="text-slate-500 text-center mb-8 text-sm leading-relaxed">
          Bạn có chắc chắn muốn xóa hóa đơn <span className="font-bold text-slate-900">{invoiceCode}</span>? <br/>
          Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-6 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm">Hủy bỏ</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-6 py-3.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-all text-sm flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-lg">delete</span>}
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  );
};

const InvoicePage = () => {
  const { user } = useContext(AuthContext);
  const isOwner = user?.role === 'CHU_TRO';
  const hasEditPermission = isOwner || user?.permissions?.hoa_don?.edit;

  const [invoices, setInvoices] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ hostelId: '', status: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), search: '' });
  const [showFilter, setShowFilter] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [editingId, setEditingId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  useEffect(() => {
    fetchInvoices();
    fetchHostels();
  }, [filters, pagination.page]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const result = await invoiceApi.getInvoices({ ...filters, page: pagination.page });
      setInvoices(result.data);
      setPagination(result.pagination);
    } catch (e) {
      showToast('Lỗi tải danh sách hóa đơn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHostels = async () => {
    try {
      const data = await hostelApi.getHostels();
      setHostels(data);
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const handleSendEmail = async (id) => {
    try {
      showToast('Đang gửi mail...', 'success');
      const result = await invoiceApi.sendEmail(id);
      showToast(result.message);
      fetchInvoices();
    } catch (e) {
      showToast(e.response?.data?.message || 'Lỗi khi gửi mail', 'error');
    }
  };

  const handleBulkSendEmail = async () => {
    showToast(`Đang gửi mail cho ${selectedInvoices.length} hóa đơn...`, 'success');
    let successCount = 0;
    for (const id of selectedInvoices) {
      try {
        await invoiceApi.sendEmail(id);
        successCount++;
      } catch (e) {
        console.error('Lỗi gửi mail hóa đơn ' + id, e);
      }
    }
    showToast(`Đã gửi thành công ${successCount}/${selectedInvoices.length} email`);
    setSelectedInvoices([]);
    fetchInvoices();
  };

  const exportToExcel = () => {
    const listToExport = selectedInvoices.length > 0 
      ? invoices.filter(inv => selectedInvoices.includes(inv.id))
      : invoices;

    if (listToExport.length === 0) return showToast('Không có dữ liệu để xuất', 'error');
    import('xlsx').then(XLSX => {
      const data = listToExport.map(inv => ({
        'Mã HĐ': inv.invoiceCode,
        'Khu trọ': inv.hostelName,
        'Số phòng': inv.roomNumber,
        'Khách thuê': inv.mainTenant,
        'Tháng/Năm': `${inv.month}/${inv.year}`,
        'Tổng tiền': inv.totalAmount,
        'Trạng thái': inv.status === 'DA_TAO' ? 'Đã tạo' : inv.status === 'DA_GUI' ? 'Đã gửi' : inv.status === 'DA_THANH_TOAN' ? 'Đã thanh toán' : 'Quá hạn',
        'Ngày tạo': new Date(inv.createdAt).toLocaleDateString('vi-VN')
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "HoaDon");
      XLSX.writeFile(wb, `Danh_sach_hoa_don_${Date.now()}.xlsx`);
    });
  };

  const handleDelete = async () => {
    if (!deletingInvoice) return;
    setDeleteLoading(true);
    try {
      await invoiceApi.deleteInvoice(deletingInvoice.id);
      showToast('Đã xóa hóa đơn');
      setIsDeleteModalOpen(false);
      fetchInvoices();
    } catch (e) {
      showToast(e.response?.data?.message || 'Lỗi khi xóa hóa đơn', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedInvoices(invoices.map(i => i.id));
    else setSelectedInvoices([]);
  };

  const toggleSelect = (id) => {
    setSelectedInvoices(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DA_THANH_TOAN': 
        return <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">Đã thanh toán</span>;
      case 'DA_GUI': 
        return <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 border border-blue-200">Đã gửi</span>;
      case 'DA_TAO': 
        return <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">Đã tạo</span>;
      case 'QUA_HAN': 
        return <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-rose-100 text-rose-700 border border-rose-200">Quá hạn</span>;
      default: 
        return <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-gray-100 text-gray-500">{status}</span>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-12 pb-12 pt-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-extrabold font-headline tracking-tight text-[#191c1d] mb-1">Hóa đơn</h2>
          <p className="text-[#3d4a42] font-body text-sm">Quản lý hóa đơn dịch vụ và thanh toán hàng tháng</p>
        </div>
        <div className="flex gap-3">
          {hasEditPermission && (
            <button 
              onClick={() => { setEditingId(null); setModalMode('add'); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#006948] text-white font-bold rounded-lg hover:bg-[#00855d] transition-all font-body text-sm shadow-md shadow-[#006948]/10 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Thêm hóa đơn mới
            </button>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#bccac0]/10">
        {/* Table Controls */}
        <div className="px-6 py-4 border-b border-[#edeeef] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-800 font-headline">Danh sách hóa đơn</h3>
            <span className="text-[10px] font-label bg-[#c0edd3] text-[#446d58] px-2 py-0.5 rounded-md">{pagination.total} Hóa đơn</span>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a72] text-sm">search</span>
              <input 
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
                placeholder="Tìm kiếm hóa đơn, phòng..."
                className="pl-10 pr-4 py-1.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl text-sm w-64 focus:outline-none focus:border-[#006948] transition-all"
                type="text" 
              />
            </div>
            <button onClick={() => setShowFilter(!showFilter)} className={`p-2 rounded-lg transition-all ${showFilter ? 'bg-[#006948] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button onClick={exportToExcel} title="Tải xuống Excel" className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 transition-all">
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>

        {/* Filter Row */}
        {showFilter && (
          <div className="px-6 py-3 bg-[#f8f9fa] border-b border-[#edeeef] flex gap-4 items-center animate-in slide-in-from-top duration-300">
            <select value={filters.hostelId} onChange={e => setFilters({...filters, hostelId: e.target.value})} className="text-xs border border-[#bccac0]/30 rounded-lg px-3 py-1.5 bg-white outline-none">
              <option value="">Tất cả khu trọ</option>
              {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <select value={filters.month} onChange={e => setFilters({...filters, month: e.target.value})} className="text-xs border border-[#bccac0]/30 rounded-lg px-3 py-1.5 bg-white outline-none">
               {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
            </select>
            <select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} className="text-xs border border-[#bccac0]/30 rounded-lg px-3 py-1.5 bg-white outline-none">
               {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="text-xs border border-[#bccac0]/30 rounded-lg px-3 py-1.5 bg-white outline-none">
              <option value="">Tất cả trạng thái</option>
              <option value="DA_TAO">Đã tạo</option>
              <option value="DA_GUI">Đã gửi</option>
              <option value="DA_THANH_TOAN">Đã thanh toán</option>
              <option value="QUA_HAN">Quá hạn</option>
            </select>
            <button onClick={() => setFilters({ hostelId: '', status: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), search: '' })} className="text-xs text-[#006948] font-bold hover:underline ml-auto">Xoá bộ lọc</button>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedInvoices.length > 0 && (
          <div className="bg-[#006948] text-white px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-inner">
            <div className="flex items-center gap-3">
               <span className="text-sm font-bold">Đã chọn {selectedInvoices.length} hóa đơn</span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleBulkSendEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">
                <span className="material-symbols-outlined text-sm">mail</span>
                Gửi mail hàng loạt
              </button>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body">
            <thead className="bg-[#f8f9fa] text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b border-[#edeeef]">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <input type="checkbox" onChange={handleSelectAll} checked={selectedInvoices.length === invoices.length && invoices.length > 0} className="rounded border-[#bccac0] text-[#006948] focus:ring-[#006948]/20 w-3.5 h-3.5" />
                </th>
                <th className="px-6 py-4">MÃ HĐ</th>
                <th className="px-6 py-4">Khu trọ</th>
                <th className="px-6 py-4">Số phòng</th>
                <th className="px-6 py-4">Họ và tên</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Số tiền</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f5]">
              {loading ? (
                <tr><td colSpan="9" className="px-6 py-10 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan="9" className="px-6 py-10 text-center text-slate-400">Không tìm thấy hóa đơn nào</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className={`hover:bg-[#f8f9fa] transition-colors cursor-pointer group ${selectedInvoices.includes(inv.id) ? 'bg-emerald-50/30' : ''}`}>
                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedInvoices.includes(inv.id)} 
                      onChange={() => toggleSelect(inv.id)}
                      className="rounded border-[#bccac0] text-[#006948] focus:ring-[#006948]/20 w-3.5 h-3.5" 
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">#{inv.invoiceCode}</td>
                  <td className="px-6 py-4 text-sm text-[#191c1d]">{inv.hostelName}</td>
                  <td className="px-6 py-4 text-sm font-bold text-[#191c1d]">{inv.roomNumber}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{inv.mainTenant}</td>
                  <td className="px-6 py-4 text-center">{getStatusBadge(inv.status)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(inv.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[#006948] text-right whitespace-nowrap">{inv.totalAmount.toLocaleString()}đ</td>
                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center gap-2 text-slate-400">
                      <button onClick={() => { setEditingId(inv.id); setModalMode('view'); setIsModalOpen(true); }} className="p-1.5 hover:text-[#006948] hover:bg-emerald-50 rounded-lg transition-all" title="Xem chi tiết"><span className="material-symbols-outlined text-xl">visibility</span></button>
                      {hasEditPermission && <button onClick={() => { setEditingId(inv.id); setModalMode('edit'); setIsModalOpen(true); }} className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Chỉnh sửa"><span className="material-symbols-outlined text-xl">edit</span></button>}
                      {hasEditPermission && <button onClick={() => { setDeletingInvoice(inv); setIsDeleteModalOpen(true); }} className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Xóa"><span className="material-symbols-outlined text-xl">delete</span></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-4 bg-[#f8f9fa] flex justify-between items-center border-t border-[#edeeef]">
          <p className="text-xs text-[#3d4a42] font-medium">Hiển thị {invoices.length} trên {pagination.total} hóa đơn</p>
          <div className="flex gap-1">
            <button disabled={pagination.page === 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})} className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-30"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button key={i+1} onClick={() => setPagination({...pagination, page: i+1})} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${pagination.page === i+1 ? 'bg-[#006948] text-white shadow-md' : 'hover:bg-white text-[#191c1d]'}`}>{i+1}</button>
            ))}
            <button disabled={pagination.page === pagination.totalPages} onClick={() => setPagination({...pagination, page: pagination.page + 1})} className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-30"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
          </div>
        </div>
      </div>

      <InvoiceModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingId(null); }}
        invoiceId={editingId}
        mode={modalMode}
        onSuccess={fetchInvoices}
      />

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        invoiceCode={deletingInvoice?.invoiceCode}
      />

      {toast.show && (
        <div className={`fixed bottom-8 right-8 px-8 py-5 rounded-[20px] shadow-2xl font-bold text-sm z-[200] flex items-center gap-3 border animate-in slide-in-from-right duration-500 ${toast.type === 'success' ? 'bg-[#006948] text-white border-emerald-400' : 'bg-red-600 text-white border-red-400'}`}>
          <span className="material-symbols-outlined">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default InvoicePage;
