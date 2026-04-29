import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient';

const ITEMS_PER_PAGE = 8;

const DetailModal = ({ type, onClose, filterYear, filterMonth, filterType }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [hostels, setHostels] = useState([]);
  const [filters, setFilters] = useState({ status: '', hostelId: '' });

  const titles = {
    tenants: 'Danh sách Khách thuê',
    rooms: 'Danh sách Phòng',
    invoices: 'Danh sách Hóa đơn',
  };

  useEffect(() => {
    fetchData();
    fetchHostels();
  }, [type]);

  const fetchHostels = async () => {
    try {
      const res = await apiClient.get('/hostels');
      setHostels(res.data.data || []);
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (type === 'tenants') {
        const res = await apiClient.get('/tenants?limit=200');
        setData(res.data.data?.tenants || res.data.data || []);
      } else if (type === 'rooms') {
        const res = await apiClient.get('/rooms?limit=200');
        setData(res.data.data?.rooms || res.data.data || []);
      } else if (type === 'invoices') {
        const params = filterType === 'month'
          ? `month=${filterMonth}&year=${filterYear}`
          : `year=${filterYear}`;
        const res = await apiClient.get(`/invoices?${params}&limit=200`);
        setData(res.data.data?.invoices || res.data.data || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = data.filter(item => {
    const searchLower = search.toLowerCase();
    let matchSearch = true;
    let matchStatus = true;
    let matchHostel = true;

    if (type === 'tenants') {
      matchSearch = (item.fullName || '').toLowerCase().includes(searchLower) ||
        (item.phoneNumber || '').toLowerCase().includes(searchLower) ||
        (item.room?.roomNumber || '').toLowerCase().includes(searchLower);
      if (filters.status) matchStatus = item.status === filters.status;
      if (filters.hostelId) matchHostel = String(item.room?.hostelId) === filters.hostelId;
    } else if (type === 'rooms') {
      matchSearch = (item.roomNumber || '').toLowerCase().includes(searchLower) ||
        (item.hostel?.name || '').toLowerCase().includes(searchLower);
      if (filters.status) matchStatus = item.status === filters.status;
      if (filters.hostelId) matchHostel = String(item.hostelId) === filters.hostelId;
    } else if (type === 'invoices') {
      matchSearch = (item.invoiceCode || '').toLowerCase().includes(searchLower) ||
        (item.room?.roomNumber || '').toLowerCase().includes(searchLower);
      if (filters.status) matchStatus = item.status === filters.status;
      if (filters.hostelId) matchHostel = String(item.room?.hostelId) === filters.hostelId;
    }
    return matchSearch && matchStatus && matchHostel;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const StatusBadge = ({ status, type: t }) => {
    const map = {
      tenants: { DANG_THUE: ['bg-[#c0edd3] text-[#264e3c]', 'Đang thuê'], NGUNG_THUE: ['bg-[#e1e3e4] text-[#6d7a72]', 'Ngừng thuê'] },
      rooms: { DANG_O: ['bg-[#c0edd3] text-[#264e3c]', 'Đang ở'], TRONG: ['bg-[#e1e3e4] text-[#6d7a72]', 'Trống'], BAO_TRI: ['bg-[#ffdad7] text-[#7f2928]', 'Bảo trì'] },
      invoices: { DA_THANH_TOAN: ['bg-[#c0edd3] text-[#264e3c]', 'Đã thanh toán'], DA_TAO: ['bg-[#e7e8e9] text-[#3d4a42]', 'Đã tạo'], DA_GUI: ['bg-[#85f8c4] text-[#002114]', 'Đã gửi'], QUA_HAN: ['bg-[#ffdad7] text-[#7f2928]', 'Quá hạn'] },
    };
    const [cls, label] = map[t]?.[status] || ['bg-gray-100 text-gray-600', status];
    return <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-tight ${cls}`}>{label}</span>;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#191c1d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl max-h-[88vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 bg-emerald-50/50 border-b border-[#bccac0]/20">
          <div>
            <h2 className="text-2xl font-headline font-extrabold text-[#191c1d]">{titles[type]}</h2>
            <p className="text-sm text-[#6d7a72] mt-0.5">T's House • Dữ liệu thực tế</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-100 rounded-full transition-colors"><span className="material-symbols-outlined">close</span></button>
        </div>

        {/* Search + Filter */}
        <div className="px-8 pt-5 pb-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a72] text-lg">search</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2.5 bg-[#f3f4f5] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#006948]/20" placeholder={type === 'tenants' ? 'Tìm tên, SĐT, phòng...' : type === 'rooms' ? 'Tìm số phòng, khu trọ...' : 'Tìm mã HĐ, số phòng...'} />
          </div>
          <button onClick={() => setShowFilter(!showFilter)} className={`p-1 transition-colors ${showFilter ? 'text-[#006948]' : 'text-[#6d7a72] hover:text-[#006948]'}`}>
            <span className="material-symbols-outlined text-xl">filter_list</span>
          </button>
        </div>

        {showFilter && (
          <div className="px-8 pb-3 flex gap-3 flex-wrap">
            <select value={filters.hostelId} onChange={e => { setFilters({ ...filters, hostelId: e.target.value }); setPage(1); }} className="text-xs border border-[#bccac0]/30 rounded-lg px-3 py-2 bg-white outline-none">
              <option value="">Tất cả khu trọ</option>
              {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <select value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }} className="text-xs border border-[#bccac0]/30 rounded-lg px-3 py-2 bg-white outline-none">
              <option value="">Tất cả trạng thái</option>
              {type === 'tenants' && <><option value="DANG_THUE">Đang thuê</option><option value="NGUNG_THUE">Ngừng thuê</option></>}
              {type === 'rooms' && <><option value="DANG_O">Đang ở</option><option value="TRONG">Trống</option><option value="BAO_TRI">Bảo trì</option></>}
              {type === 'invoices' && <><option value="DA_TAO">Đã tạo</option><option value="DA_GUI">Đã gửi</option><option value="DA_THANH_TOAN">Đã thanh toán</option><option value="QUA_HAN">Quá hạn</option></>}
            </select>
            <button onClick={() => { setFilters({ status: '', hostelId: '' }); setPage(1); }} className="text-xs text-[#6d7a72] hover:text-[#191c1d] px-3 py-2 border border-dashed border-[#bccac0]/50 rounded-lg">Xóa bộ lọc</button>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto px-8 py-2">
          {loading ? <div className="text-center py-12 text-[#6d7a72]">Đang tải...</div> : (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] text-[#6d7a72] uppercase tracking-widest font-bold">
                  {type === 'tenants' && <><th className="pb-2 pl-4">Họ và tên</th><th className="pb-2">Khu trọ</th><th className="pb-2">Số phòng</th><th className="pb-2">Số điện thoại</th><th className="pb-2">Trạng thái</th></>}
                  {type === 'rooms' && <><th className="pb-2 pl-4">Khu trọ</th><th className="pb-2">Số phòng</th><th className="pb-2">Tầng</th><th className="pb-2">Giá thuê</th><th className="pb-2">Trạng thái</th></>}
                  {type === 'invoices' && <><th className="pb-2 pl-4">Mã hóa đơn</th><th className="pb-2">Khu trọ</th><th className="pb-2">Số phòng</th><th className="pb-2">Tháng/Năm</th><th className="pb-2">Tổng tiền</th><th className="pb-2">Trạng thái</th></>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {paginated.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-[#6d7a72]">Không có dữ liệu</td></tr>
                )}
                {paginated.map(item => (
                  <tr key={item.id} className="group">
                    {type === 'tenants' && <>
                      <td className="py-3 pl-4 rounded-l-xl bg-[#f3f4f5] group-hover:bg-emerald-50/50 font-bold text-emerald-900">{item.fullName}</td>
                      <td className="py-3 bg-[#f3f4f5] group-hover:bg-emerald-50/50 text-[#3d4a42]">{item.room?.hostel?.name || '—'}</td>
                      <td className="py-3 bg-[#f3f4f5] group-hover:bg-emerald-50/50 text-[#3d4a42]">{item.room?.roomNumber || '—'}</td>
                      <td className="py-3 bg-[#f3f4f5] group-hover:bg-emerald-50/50 font-mono text-[#3d4a42]">{item.phoneNumber}</td>
                      <td className="py-3 pr-4 rounded-r-xl bg-[#f3f4f5] group-hover:bg-emerald-50/50"><StatusBadge status={item.status} type="tenants" /></td>
                    </>}
                    {type === 'rooms' && <>
                      <td className="py-3 pl-4 rounded-l-xl bg-[#f3f4f5] group-hover:bg-emerald-50/50 text-[#3d4a42]">{item.hostel?.name || '—'}</td>
                      <td className="py-3 bg-[#f3f4f5] group-hover:bg-emerald-50/50 font-bold text-emerald-900">{item.roomNumber}</td>
                      <td className="py-3 bg-[#f3f4f5] group-hover:bg-emerald-50/50 text-[#3d4a42]">{item.floor || '—'}</td>
                      <td className="py-3 bg-[#f3f4f5] group-hover:bg-emerald-50/50 text-emerald-800">{item.price ? item.price.toLocaleString('vi-VN') + 'đ' : '—'}</td>
                      <td className="py-3 pr-4 rounded-r-xl bg-[#f3f4f5] group-hover:bg-emerald-50/50"><StatusBadge status={item.status} type="rooms" /></td>
                    </>}
                    {type === 'invoices' && <>
                      <td className="py-3 pl-4 rounded-l-xl bg-[#f3f4f5] group-hover:bg-emerald-50/50 font-mono text-emerald-900 font-bold text-xs">{item.invoiceCode}</td>
                      <td className="py-3 bg-[#f3f4f5] group-hover:bg-emerald-50/50 text-[#3d4a42]">{item.room?.hostel?.name || '—'}</td>
                      <td className="py-3 bg-[#f3f4f5] group-hover:bg-emerald-50/50 text-[#3d4a42]">{item.room?.roomNumber || '—'}</td>
                      <td className="py-3 bg-[#f3f4f5] group-hover:bg-emerald-50/50 text-[#3d4a42]">T{item.month}/{item.year}</td>
                      <td className="py-3 bg-[#f3f4f5] group-hover:bg-emerald-50/50 font-bold text-emerald-800">{item.totalAmount?.toLocaleString('vi-VN')}đ</td>
                      <td className="py-3 pr-4 rounded-r-xl bg-[#f3f4f5] group-hover:bg-emerald-50/50"><StatusBadge status={item.status} type="invoices" /></td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-[#f3f4f5] border-t border-[#bccac0]/20 flex items-center justify-between">
          <span className="text-xs text-[#6d7a72]">Hiển thị <span className="text-[#191c1d] font-semibold">{paginated.length}</span> trên tổng số <span className="text-[#191c1d] font-semibold">{filtered.length}</span> bản ghi</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-[#6d7a72] hover:bg-[#006948] hover:text-white transition-colors disabled:opacity-40"><span className="material-symbols-outlined text-lg">chevron_left</span></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-[#006948] text-white' : 'bg-white text-[#6d7a72] hover:bg-emerald-100'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-[#6d7a72] hover:bg-[#006948] hover:text-white transition-colors disabled:opacity-40"><span className="material-symbols-outlined text-lg">chevron_right</span></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
