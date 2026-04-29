import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import * as tenantService from '../../../services/tenant.service';
import * as hostelService from '../../../services/hostel.service';
import * as roomService from '../../../services/room.service';

import { useNavigate } from 'react-router-dom';

const KhachThuePage = () => {
  const { user, hasPermission } = useContext(AuthContext);
  const navigate = useNavigate();

  const canView = hasPermission('khach_thue', 'view');
  const canEdit = hasPermission('khach_thue', 'edit');
  const canDelete = hasPermission('khach_thue', 'delete');

  useEffect(() => {
    if (user && !canView) {
      navigate('/dashboard');
    }
  }, [user, canView, navigate]);
  const [tenants, setTenants] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ totalTenants: 0, registeredResidency: 0, expiringSoon: 0, occupancyRate: 0, totalChangeRate: 0, residencyChangeRate: 0 });
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({ status: '', residencyStatus: '', hostelId: '', roomId: '', fromDate: '', toDate: '' });
  const [showFilter, setShowFilter] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalAction, setModalAction] = useState('ADD');
  const [modalData, setModalData] = useState(null);
  const [modalRooms, setModalRooms] = useState([]);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  const fetchTenants = async () => {
    try {
      const data = await tenantService.getTenants(page, 10, search, filters);
      setTenants(data.tenants); setTotalPages(data.totalPages); setTotalCount(data.total);
    } catch (e) { showToast(e.response?.data?.message || 'Lỗi tải danh sách', 'error'); }
  };
  const fetchStats = async () => { try { const s = await tenantService.getTenantStats(); setStats(s); } catch {} };
  const fetchHostels = async () => { try { setHostels(await hostelService.getHostels()); } catch {} };
  const fetchRooms = async () => { try { const d = await roomService.getRooms(1, 200, ''); setRooms(d.rooms); } catch {} };

  useEffect(() => { fetchTenants(); }, [page, search, filters]);
  useEffect(() => { fetchStats(); fetchHostels(); fetchRooms(); }, []);

  const showToast = (msg, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000); };
  const closeModal = () => { setModalType(null); setModalData(null); };

  const loadModalRooms = (hostelId) => {
    const filtered = rooms.filter(r => r.hostelId === Number(hostelId) || r.hostel?.id === Number(hostelId));
    setModalRooms(filtered);
  };

  const openAdd = () => {
    setModalType('TENANT'); setModalAction('ADD');
    setModalData({ fullName:'', cccd:'', phoneNumber:'', email:'', gender:'', dateOfBirth:'', hometown:'', roomId:'', hostelId: hostels[0]?.id || '' });
    if (hostels[0]) loadModalRooms(hostels[0].id);
  };
  const openEdit = (t) => {
    setModalType('TENANT'); setModalAction('EDIT');
    const hId = t.room?.hostel?.id || '';
    setModalData({ ...t, hostelId: hId, dateOfBirth: t.dateOfBirth ? t.dateOfBirth.split('T')[0] : '' });
    if (hId) loadModalRooms(hId);
  };
  const openView = (t) => { setModalType('TENANT'); setModalAction('VIEW'); setModalData(t); };
  const openDelete = (t) => { setModalType('DELETE'); setModalData(t); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { fullName: modalData.fullName, cccd: modalData.cccd, phoneNumber: modalData.phoneNumber, email: modalData.email, gender: modalData.gender, dateOfBirth: modalData.dateOfBirth || null, hometown: modalData.hometown, roomId: modalData.roomId || null, status: modalData.status, residencyStatus: modalData.residencyStatus };
      if (modalAction === 'ADD') await tenantService.createTenant(payload);
      else await tenantService.updateTenant(modalData.id, payload);
      showToast(modalAction === 'ADD' ? 'Thêm khách thuê thành công!' : 'Cập nhật thành công!');
      closeModal(); fetchTenants(); fetchStats(); fetchRooms();
    } catch (e) { showToast(e.response?.data?.message || 'Lỗi thao tác', 'error'); }
  };

  const handleDelete = async () => {
    try { await tenantService.deleteTenant(modalData.id); showToast('Xóa thành công!'); closeModal(); fetchTenants(); fetchStats(); }
    catch (e) { showToast(e.response?.data?.message || 'Không thể xóa', 'error'); closeModal(); }
  };

  const handleExport = async () => { try { await tenantService.exportTenants(filters); showToast('Xuất file thành công!'); } catch { showToast('Lỗi xuất file', 'error'); } };

  const statusLabel = (s) => s === 'DANG_THUE' ? 'Đang thuê' : 'Ngừng thuê';
  const residencyLabel = (s) => s === 'DA_DANG_KY' ? 'Đã đăng ký' : 'Chưa đăng ký';
  const genderLabel = (g) => g === 'NAM' ? 'Nam' : g === 'NU' ? 'Nữ' : g === 'KHAC' ? 'Khác' : '';

  const inp = "w-full bg-[#f8f9fa] border border-[#bccac0]/20 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#006948]/20 transition-all outline-none";
  const lbl = "text-[11px] font-bold text-[#3d4a42] uppercase tracking-widest px-1";

  return (<>
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-3xl font-['Manrope'] font-[800] text-[#191c1d] tracking-tight">Khách thuê</h2>
        <p className="text-slate-500 text-sm mt-1">Quản lý thông tin cư dân và lịch sử thuê phòng tại T's House.</p>
      </div>
      {canEdit && <button onClick={openAdd} className="bg-[#006948] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-900/10 hover:bg-emerald-700 transition-all">
        <span className="material-symbols-outlined text-lg">add</span> Thêm khách thuê mới
      </button>}
    </div>

    {/* Stats Widgets */}
    <div className="grid grid-cols-12 gap-4 mb-8">
      <div className="col-span-12 lg:col-span-8 grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#bccac0]/10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng số khách</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-['Manrope'] font-[800] text-[#006948]">{stats.totalTenants}</span>
            <span className={`text-[10px] font-bold ${stats.totalChangeRate >= 100 ? 'text-emerald-600' : 'text-orange-500'}`}>
              {stats.totalChangeRate >= 100 ? '+' : ''}{stats.totalChangeRate}%
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#bccac0]/10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Đang tạm trú</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-['Manrope'] font-[800] text-[#191c1d]">{stats.registeredResidency}</span>
            <span className={`text-[10px] font-bold ${stats.residencyChangeRate >= 100 ? 'text-emerald-600' : 'text-orange-500'}`}>
              {stats.residencyChangeRate >= 100 ? '+' : ''}{stats.residencyChangeRate}%
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#bccac0]/10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sắp hết hạn</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-['Manrope'] font-[800] text-[#9b3e3b]">{String(stats.expiringSoon).padStart(2,'0')}</span>
            <span className="text-[10px] text-[#9b3e3b] font-bold">Cần gia hạn</span>
          </div>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-4 bg-[#00855d] p-4 rounded-xl text-white relative overflow-hidden flex flex-col justify-center">
        <h3 className="text-base font-bold mb-0.5">Hiệu suất lấp đầy</h3>
        <div className="flex items-center justify-between mb-2"><p className="text-xs opacity-80">Phòng có người ở</p><p className="text-[10px] font-bold uppercase tracking-widest">{stats.occupancyRate}%</p></div>
        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden"><div className="bg-white h-full transition-all" style={{width:`${stats.occupancyRate}%`}}></div></div>
        <div className="absolute -right-2 -bottom-2 opacity-10"><span className="material-symbols-outlined text-7xl">apartment</span></div>
      </div>
    </div>

    {/* Table */}
    <div className="bg-white rounded-xl border border-[#bccac0]/20 overflow-hidden shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between border-b border-[#bccac0]/10">
        <h3 className="text-lg font-bold text-[#191c1d]">Danh sách khách thuê</h3>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Tìm kiếm khách thuê..." className="w-full pl-10 pr-4 py-1.5 bg-[#f8f9fa] border border-[#bccac0]/30 rounded-lg text-sm focus:ring-2 focus:ring-[#006948]/20 outline-none"/>
          </div>
          <button onClick={()=>setShowFilter(!showFilter)} className="p-2 text-[#6d7a72] hover:bg-[#f8f9fa] rounded-lg"><span className="material-symbols-outlined">filter_list</span></button>
          {canEdit && <button onClick={handleExport} className="p-2 text-[#6d7a72] hover:bg-[#f8f9fa] rounded-lg"><span className="material-symbols-outlined">download</span></button>}
        </div>
      </div>
      {/* Filter Row */}
      {showFilter && <div className="px-6 py-3 bg-[#f8f9fa] border-b border-[#bccac0]/10 flex gap-3 flex-wrap items-center">
        <select value={filters.hostelId} onChange={e=>setFilters({...filters, hostelId:e.target.value, roomId:''})} className="text-xs border border-[#bccac0]/30 rounded-lg px-3 py-1.5 bg-white outline-none">
          <option value="">Tất cả khu trọ</option>{hostels.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <select value={filters.status} onChange={e=>setFilters({...filters, status:e.target.value})} className="text-xs border border-[#bccac0]/30 rounded-lg px-3 py-1.5 bg-white outline-none">
          <option value="">Tất cả trạng thái</option><option value="DANG_THUE">Đang thuê</option><option value="NGUNG_THUE">Ngừng thuê</option>
        </select>
        <select value={filters.residencyStatus} onChange={e=>setFilters({...filters, residencyStatus:e.target.value})} className="text-xs border border-[#bccac0]/30 rounded-lg px-3 py-1.5 bg-white outline-none">
          <option value="">Tất cả tạm trú</option>
          <option value="DA_DANG_KY">Đã đăng ký</option>
          <option value="CHUA_DANG_KY">Chưa đăng ký</option>
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Từ</span>
          <input type="date" value={filters.fromDate} onChange={e=>setFilters({...filters, fromDate:e.target.value})} className="text-xs border border-[#bccac0]/30 rounded-lg px-2 py-1.5 bg-white outline-none"/>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Đến</span>
          <input type="date" value={filters.toDate} onChange={e=>setFilters({...filters, toDate:e.target.value})} className="text-xs border border-[#bccac0]/30 rounded-lg px-2 py-1.5 bg-white outline-none"/>
        </div>
        <button onClick={()=>{setFilters({status:'',residencyStatus:'',hostelId:'',roomId:'',fromDate:'',toDate:''});setPage(1);}} className="text-xs text-[#006948] font-bold hover:underline">Xóa bộ lọc</button>
      </div>}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#f8f9fa] border-b border-[#bccac0]/20">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mã KH</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Họ và tên</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Khu trọ</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Số phòng</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">SĐT</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">CCCD</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-[#bccac0]/10">
            {tenants.map(t => (
              <tr key={t.id} className="hover:bg-[#f8f9fa] transition-colors">
                <td className="px-6 py-4 font-medium text-slate-500">KT{String(t.id).padStart(3,'0')}</td>
                <td className="px-6 py-4 font-semibold text-[#191c1d]">{t.fullName}</td>
                <td className="px-6 py-4 text-slate-600 font-medium">{t.room?.hostel?.name || '-'}</td>
                <td className="px-6 py-4 text-center text-slate-600 font-medium">{t.room?.roomNumber || '-'}</td>
                <td className="px-6 py-4 text-slate-600">{t.phoneNumber}</td>
                <td className="px-6 py-4 text-slate-600">{t.cccd}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 text-slate-500">
                    <button onClick={()=>openView(t)} className="hover:text-[#006948] transition-colors"><span className="material-symbols-outlined text-lg">visibility</span></button>
                    {canEdit && <button onClick={()=>openEdit(t)} className="hover:text-[#006948] transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>}
                    {canDelete && <button onClick={()=>openDelete(t)} className="hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>}
                  </div>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-10 text-[#6d7a72]">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">group</span>
                  Chưa có khách thuê nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-[#f8f9fa] flex items-center justify-between border-t border-[#bccac0]/10">
        <p className="text-xs text-slate-500">Hiển thị <b className="text-[#191c1d]">{tenants.length}</b> trên <b className="text-[#191c1d]">{totalCount}</b> khách thuê</p>
        <div className="flex items-center gap-1">
          <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="p-2 text-slate-400 hover:text-[#006948] disabled:opacity-30"><span className="material-symbols-outlined">chevron_left</span></button>
          <button className="w-8 h-8 rounded-lg bg-[#006948] text-white text-xs font-bold">{page}</button>
          <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="p-2 text-slate-400 hover:text-[#006948] disabled:opacity-30"><span className="material-symbols-outlined">chevron_right</span></button>
        </div>
      </div>
    </div>

    {/* Modal: Thêm/Sửa/Xem */}
    {modalType === 'TENANT' && modalData && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[1.25rem] shadow-2xl overflow-hidden">
        <div className="px-8 py-6 bg-[#f8f9fa] flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-[800] text-[#191c1d] font-['Manrope']">{modalAction==='ADD'?'Thêm khách thuê mới':modalAction==='EDIT'?'Cập nhật khách thuê':'Chi tiết khách thuê'}</h3>
            <p className="text-xs text-[#3d4a42] tracking-wide uppercase mt-1">Thông tin cá nhân & Liên lạc</p>
          </div>
          <button onClick={closeModal} className="w-10 h-10 rounded-full hover:bg-[#e7e8e9] flex items-center justify-center"><span className="material-symbols-outlined text-[#3d4a42]">close</span></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-8 max-h-[65vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5"><label className={lbl}>Họ và tên <span className="text-red-500">*</span></label><input required disabled={modalAction==='VIEW'} value={modalData.fullName||''} onChange={e=>setModalData({...modalData,fullName:e.target.value})} className={inp} placeholder="Nhập họ và tên"/></div>
              <div className="space-y-1.5"><label className={lbl}>Số CCCD / Hộ chiếu <span className="text-red-500">*</span></label><input required disabled={modalAction==='VIEW'} value={modalData.cccd||''} onChange={e=>setModalData({...modalData,cccd:e.target.value})} className={inp} placeholder="Nhập số CCCD"/></div>
              <div className="space-y-1.5"><label className={lbl}>Số điện thoại <span className="text-red-500">*</span></label><input required disabled={modalAction==='VIEW'} value={modalData.phoneNumber||''} onChange={e=>setModalData({...modalData,phoneNumber:e.target.value})} className={inp} placeholder="0xxx.xxx.xxx" type="tel"/></div>
              <div className="space-y-1.5"><label className={lbl}>Địa chỉ Email</label><input disabled={modalAction==='VIEW'} value={modalData.email||''} onChange={e=>setModalData({...modalData,email:e.target.value})} className={inp} placeholder="example@gmail.com" type="email"/></div>
              <div className="space-y-1.5"><label className={lbl}>Giới tính</label><select disabled={modalAction==='VIEW'} value={modalData.gender||''} onChange={e=>setModalData({...modalData,gender:e.target.value})} className={inp+' appearance-none'}><option value="">Chọn giới tính</option><option value="NAM">Nam</option><option value="NU">Nữ</option><option value="KHAC">Khác</option></select></div>
              <div className="space-y-1.5"><label className={lbl}>Ngày sinh</label><input disabled={modalAction==='VIEW'} type="date" value={modalData.dateOfBirth||''} onChange={e=>setModalData({...modalData,dateOfBirth:e.target.value})} className={inp}/></div>
              <div className="col-span-1 md:col-span-2 space-y-1.5"><label className={lbl}>Quê quán / Thường trú</label><input disabled={modalAction==='VIEW'} value={modalData.hometown||''} onChange={e=>setModalData({...modalData,hometown:e.target.value})} className={inp} placeholder="Nhập địa chỉ đầy đủ"/></div>
              {modalAction !== 'VIEW' && <>
                <div className="space-y-1.5"><label className={lbl}>Khu trọ</label><select value={modalData.hostelId||''} onChange={e=>{setModalData({...modalData,hostelId:e.target.value,roomId:''});loadModalRooms(e.target.value);}} className={inp+' appearance-none'}><option value="">-- Chọn khu trọ --</option>{hostels.filter(h => h.status === 'HOAT_DONG' || h.id === modalData.hostelId).map(h=><option key={h.id} value={h.id}>{h.name} {h.status !== 'HOAT_DONG' ? `(${h.status})` : ''}</option>)}</select></div>
                <div className="space-y-1.5"><label className={lbl}>Phòng</label><select value={modalData.roomId||''} onChange={e=>setModalData({...modalData,roomId:e.target.value})} className={inp+' appearance-none'}><option value="">-- Chọn phòng --</option>{modalRooms.map(r=><option key={r.id} value={r.id}>{r.roomNumber} {r.status==='TRONG'?'(Trống)':r.status==='DANG_O'?'(Đang ở)':''}</option>)}</select></div>
              </>}
              {modalAction === 'VIEW' && modalData.room && <div className="col-span-2 space-y-1.5"><label className={lbl}>Phòng hiện tại</label><p className="px-4 py-3 bg-[#f8f9fa] rounded-xl text-sm">{modalData.room.hostel?.name} — {modalData.room.roomNumber}</p></div>}
              {modalAction === 'EDIT' && <>
                <div className="space-y-1.5"><label className={lbl}>Trạng thái khách</label><select value={modalData.status||'DANG_THUE'} onChange={e=>setModalData({...modalData,status:e.target.value})} className={inp+' appearance-none'}><option value="DANG_THUE">Đang thuê</option><option value="NGUNG_THUE">Ngừng thuê</option></select></div>
                <div className="space-y-1.5"><label className={lbl}>Trạng thái tạm trú</label><select value={modalData.residencyStatus||'CHUA_DANG_KY'} onChange={e=>setModalData({...modalData,residencyStatus:e.target.value})} className={inp+' appearance-none'}><option value="CHUA_DANG_KY">Chưa đăng ký tạm trú</option><option value="DA_DANG_KY">Đã đăng ký tạm trú</option></select></div>
              </>}
            </div>
          </div>
          <div className="px-8 py-6 bg-[#f8f9fa] flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-6 py-2.5 text-[#191c1d] text-sm font-bold rounded-xl hover:bg-[#e7e8e9] transition-all">{modalAction==='VIEW'?'Đóng':'Hủy'}</button>
            {modalAction !== 'VIEW' && <button type="submit" className="px-10 py-2.5 bg-[#006948] text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-900/10 transition-all active:scale-95">Lưu thông tin</button>}
          </div>
        </form>
      </div>
    </div>}

    {/* Modal: Xóa */}
    {modalType === 'DELETE' && modalData && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5"><span className="material-symbols-outlined text-[32px]" style={{fontVariationSettings:"'FILL' 1"}}>warning</span></div>
        <h3 className="font-['Manrope'] text-xl font-[800] text-[#191c1d] mb-2">Xác nhận xóa?</h3>
        <p className="text-[#6d7a72] mb-8 text-sm">Bạn sắp xóa khách thuê <b className="text-[#191c1d]">"{modalData.fullName}"</b>. Thao tác này không thể hoàn tác.</p>
        <div className="flex justify-center gap-3">
          <button onClick={closeModal} className="flex-1 py-3 text-[#6d7a72] font-bold bg-[#f8f9fa] hover:bg-[#e1e3e4] rounded-xl transition-all text-sm">Giữ lại</button>
          <button onClick={handleDelete} className="flex-1 py-3 text-white font-bold bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-md shadow-red-500/20 text-sm">Xóa vĩnh viễn</button>
        </div>
      </div>
    </div>}

    {/* Toast */}
    {toast.show && <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm z-[150] flex items-center gap-3 border ${toast.type==='error'?'bg-red-50 text-red-700 border-red-200':'bg-[#e8f7f2] text-[#006948] border-emerald-200'}`}>
      <span className="material-symbols-outlined" style={{fontVariationSettings:"'FILL' 1"}}>{toast.type==='error'?'error':'check_circle'}</span>{toast.msg}
    </div>}
  </>);
};

export default KhachThuePage;
