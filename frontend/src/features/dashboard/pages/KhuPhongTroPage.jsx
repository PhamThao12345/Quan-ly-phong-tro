import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as hostelService from '../../../services/hostel.service';
import * as roomService from '../../../services/room.service';

const VN_LOCATIONS = {
  "Hồ Chí Minh": ["Quận 1","Quận 2","Quận 3","Quận 4","Quận 5","Quận 6","Quận 7","Quận 8","Quận 9","Quận 10","Quận 11","Quận 12","Bình Tân","Bình Thạnh","Gò Vấp","Phú Nhuận","Tân Bình","Tân Phú","Thủ Đức","Bình Chánh","Cần Giờ","Củ Chi","Hóc Môn","Nhà Bè"],
  "Hà Nội": ["Ba Đình","Hoàn Kiếm","Tây Hồ","Long Biên","Cầu Giấy","Đống Đa","Hai Bà Trưng","Hoàng Mai","Thanh Xuân","Sóc Sơn","Đông Anh","Gia Lâm","Nam Từ Liêm","Thanh Trì","Bắc Từ Liêm","Mê Linh","Hà Đông","Sơn Tây","Ba Vì","Phúc Thọ","Đan Phượng","Hoài Đức","Quốc Oai","Thạch Thất","Chương Mỹ","Thanh Oai","Thường Tín","Phú Xuyên","Ứng Hòa","Mỹ Đức"],
  "Đà Nẵng": ["Hải Châu","Thanh Khê","Sơn Trà","Ngũ Hành Sơn","Liên Chiểu","Cẩm Lệ","Hòa Vang","Hoàng Sa"],
  "Cần Thơ": ["Ninh Kiều","Bình Thủy","Cái Răng","Ô Môn","Phong Điền","Cờ Đỏ","Thới Lai","Vĩnh Thạnh"],
  "Hải Phòng": ["Hồng Bàng","Lê Chân","Ngô Quyền","Kiến An","Hải An","Đồ Sơn","Dương Kinh","An Dương","An Lão","Kiến Thụy","Tiên Lãng","Vĩnh Bảo","Cát Hải","Bạch Long Vĩ"],
  "Bình Dương": ["Thủ Dầu Một","Thuận An","Dĩ An","Tân Uyên","Bến Cát","Bàu Bàng","Bắc Tân Uyên","Dầu Tiếng","Phú Giáo"],
  "Đồng Nai": ["Biên Hòa","Long Khánh","Nhơn Trạch","Long Thành","Trảng Bom","Vĩnh Cửu","Định Quán","Xuân Lộc","Cẩm Mỹ","Tân Phú","Thống Nhất"],
};

const StatusBadge = ({ type }) => {
  const styles = {
    TRONG: 'bg-emerald-50 text-emerald-700',
    DANG_O: 'bg-blue-50 text-blue-700',
    BAO_TRI: 'bg-orange-50 text-orange-700',
    HOAT_DONG: 'bg-emerald-50 text-emerald-700',
    NGUNG_HOAT_DONG: 'bg-slate-100 text-slate-600',
  };
  const labels = {
    TRONG: 'Trống', DANG_O: 'Đang ở', BAO_TRI: 'Bảo trì',
    HOAT_DONG: 'Hoạt động', NGUNG_HOAT_DONG: 'Ngừng Hoạt động',
  };
  const dotColors = {
    TRONG: 'bg-emerald-600', DANG_O: 'bg-blue-600', BAO_TRI: 'bg-orange-600',
    HOAT_DONG: 'bg-emerald-600', NGUNG_HOAT_DONG: 'bg-slate-500',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${styles[type] || 'bg-slate-50 text-slate-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${dotColors[type] || 'bg-slate-400'}`}></span>
      {labels[type] || type}
    </span>
  );
};

const KhuPhongTroPage = () => {
  const { user, hasPermission } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const canView = hasPermission('khu_phong', 'view');
  const canEdit = hasPermission('khu_phong', 'edit');
  const canDelete = hasPermission('khu_phong', 'delete');

  useEffect(() => {
    if (user && !canView) {
      navigate('/dashboard');
    }
  }, [user, canView, navigate]);

  const [hostels, setHostels] = useState([]);
  const [hostelSearch, setHostelSearch] = useState('');

  const [rooms, setRooms] = useState([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [roomPage, setRoomPage] = useState(1);
  const [roomTotalPages, setRoomTotalPages] = useState(1);
  const [totalRoomsCnt, setTotalRoomsCnt] = useState(0);

  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalAction, setModalAction] = useState('ADD');
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  const fetchHostels = async () => {
    try {
      const data = await hostelService.getHostels(hostelSearch);
      setHostels(data);
    } catch (e) {
      showToast(e.response?.data?.message || 'Lỗi tải danh sách Khu trọ', 'error');
    }
  };

  const fetchRooms = async () => {
    try {
      const data = await roomService.getRooms(roomPage, 10, roomSearch);
      setRooms(data.rooms);
      setRoomTotalPages(data.totalPages);
      setTotalRoomsCnt(data.total);
    } catch (e) {
      showToast(e.response?.data?.message || 'Lỗi tải danh sách Phòng', 'error');
    }
  };

  useEffect(() => { fetchHostels(); }, [hostelSearch]);
  useEffect(() => { fetchRooms(); }, [roomSearch, roomPage]);

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const closeModals = () => { setModalType(null); setModalData(null); };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setModalData({ ...modalData, city, district: '' });
  };

  const handleHostelSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalAction === 'ADD') await hostelService.createHostel(modalData);
      else await hostelService.updateHostel(modalData.id, modalData);
      showToast('Cập nhật khu trọ thành công!');
      closeModals();
      fetchHostels();
    } catch (e) {
      showToast(e.response?.data?.message || 'Lỗi thao tác khu trọ', 'error');
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalAction === 'ADD') await roomService.createRoom(modalData);
      else await roomService.updateRoom(modalData.id, modalData);
      showToast('Cập nhật phòng trọ thành công!');
      closeModals();
      fetchRooms();
      fetchHostels();
    } catch (e) {
      showToast(e.response?.data?.message || 'Lỗi thao tác phòng trọ', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      if (modalData.target === 'HOSTEL') await hostelService.deleteHostel(modalData.id);
      else await roomService.deleteRoom(modalData.id);
      showToast('Xóa thành công!');
      closeModals();
      if (modalData.target === 'HOSTEL') fetchHostels();
      else { fetchRooms(); fetchHostels(); }
    } catch (e) {
      showToast(e.response?.data?.message || 'Không thể xóa!', 'error');
      closeModals();
    }
  };

  return (
    <>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="font-['Manrope'] text-2xl font-[800] text-[#191c1d]">Khu &amp; Phòng trọ</h1>
      </div>

      {/* ========== SECTION 1: KHU TRỌ ========== */}
      <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#e1e3e4]/50 mb-10">
        <div className="px-8 py-6 flex justify-between items-center border-b border-[#f3f4f5]">
          <div>
            <h3 className="font-['Manrope'] text-xl font-[800] text-[#191c1d]">Danh sách Khu trọ</h3>
            <p className="text-sm text-[#6d7a72]">Quản lý các tòa nhà và khu vực lưu trú</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a72] text-[18px]">search</span>
              <input
                value={hostelSearch}
                onChange={e => setHostelSearch(e.target.value)}
                placeholder="Tìm khu trọ..."
                className="h-10 pl-9 pr-4 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl text-sm focus:outline-none focus:border-[#006948] transition-all w-48"
              />
            </div>
            {canEdit && (
              <button
                onClick={() => { setModalType('HOSTEL'); setModalAction('ADD'); setModalData({ name: '', address: '', city: 'Hồ Chí Minh', district: '', status: 'HOAT_DONG' }); }}
                className="bg-[#006948] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-900/10 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> Thêm khu trọ mới
              </button>
            )}
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#f8f9fa]">
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72]">Khu trọ</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72]">Địa chỉ</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72] text-center">Số phòng</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72] text-center">Trạng thái</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f5]">
            {hostels.map(h => (
              <tr key={h.id} className="hover:bg-[#f8f9fa] transition-colors group">
                <td className="px-8 py-4 font-['Manrope'] font-[800] text-[#191c1d]">{h.name}</td>
                <td className="px-8 py-4 text-sm text-[#6d7a72]">
                  {[h.address, h.district, h.city].filter(Boolean).join(', ') || 'Đang cập nhật'}
                </td>
                <td className="px-8 py-4 text-center font-bold text-[#191c1d]">{h._count?.rooms || 0}</td>
                <td className="px-8 py-4 text-center"><StatusBadge type={h.status} /></td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-3 text-slate-400">
                    <button onClick={() => { setModalType('HOSTEL'); setModalAction('VIEW'); setModalData(h); }} className="hover:text-[#006948] transition-colors p-1">
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                    {canEdit && (
                      <button onClick={() => { setModalType('HOSTEL'); setModalAction('EDIT'); setModalData(h); }} className="hover:text-[#006948] transition-colors p-1">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => { setModalType('DELETE'); setModalData({ id: h.id, target: 'HOSTEL', name: h.name }); }} className="hover:text-red-500 transition-colors p-1">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {hostels.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-10 text-[#6d7a72] font-medium">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">location_city</span>
                  Chưa có khu trọ nào. Hãy thêm mới!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ========== SECTION 2: PHÒNG TRỌ ========== */}
      <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#e1e3e4]/50">
        <div className="px-8 py-6 flex justify-between items-center border-b border-[#f3f4f5]">
          <div>
            <h3 className="font-['Manrope'] text-xl font-[800] text-[#191c1d]">Danh sách Phòng</h3>
            <p className="text-sm text-[#6d7a72]">Hiển thị thông tin chi tiết về các đơn vị lưu trú</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a72] text-[18px]">search</span>
              <input
                value={roomSearch}
                onChange={e => { setRoomSearch(e.target.value); setRoomPage(1); }}
                placeholder="Tìm phòng..."
                className="h-10 pl-9 pr-4 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl text-sm focus:outline-none focus:border-[#006948] transition-all w-48"
              />
            </div>
            {canEdit && (
              <button
                onClick={() => { setModalType('ROOM'); setModalAction('ADD'); setModalData({ roomNumber: '', floor: '', price: '', electricityIndex: 0, status: 'TRONG', hostelId: hostels[0]?.id || '' }); }}
                className="bg-[#006948] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-900/10 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> Thêm phòng mới
              </button>
            )}
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#f8f9fa]">
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72]">Khu trọ</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72]">Số phòng</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72]">Tầng</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72]">Giá thuê</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72]">Trạng thái</th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f5]">
            {rooms.map(room => (
              <tr key={room.id} className="hover:bg-[#f8f9fa] transition-colors">
                <td className="px-8 py-4 text-sm font-medium text-[#6d7a72]">{room.hostel?.name || '-'}</td>
                <td className="px-8 py-4 font-['Manrope'] font-[800] text-[#191c1d] text-lg">{room.roomNumber}</td>
                <td className="px-8 py-4 font-bold text-[#191c1d]">{room.floor || '-'}</td>
                <td className="px-8 py-4 text-sm font-[700] text-emerald-700">
                  {room.price ? Number(room.price).toLocaleString('vi-VN') + 'đ' : '-'}
                </td>
                <td className="px-8 py-4"><StatusBadge type={room.status} /></td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-3 text-slate-400">
                    <button onClick={() => { setModalType('ROOM'); setModalAction('VIEW'); setModalData(room); }} className="hover:text-[#006948] transition-colors p-1">
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                    {canEdit && (
                      <button onClick={() => { setModalType('ROOM'); setModalAction('EDIT'); setModalData(room); }} className="hover:text-[#006948] transition-colors p-1">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => { setModalType('DELETE'); setModalData({ id: room.id, target: 'ROOM', name: room.roomNumber }); }} className="hover:text-red-500 transition-colors p-1">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-10 text-[#6d7a72] font-medium">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">door_front</span>
                  Chưa có phòng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="px-8 py-4 bg-[#f8f9fa] flex justify-between items-center border-t border-[#f3f4f5]">
          <p className="text-xs text-[#6d7a72] font-medium">
            Hiển thị {rooms.length} trong tổng số {totalRoomsCnt} phòng
          </p>
          <div className="flex gap-1">
            <button
              disabled={roomPage === 1}
              onClick={() => setRoomPage(p => p - 1)}
              className="p-2 hover:bg-[#e1e3e4] rounded-lg transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="px-3 py-1 bg-[#006948] text-white rounded-lg text-xs font-bold">{roomPage}</button>
            <button
              disabled={roomPage === roomTotalPages || roomTotalPages === 0}
              onClick={() => setRoomPage(p => p + 1)}
              className="p-2 hover:bg-[#e1e3e4] rounded-lg transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========== MODAL: KHU TRỌ ========== */}
      {modalType === 'HOSTEL' && modalData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 flex items-center justify-between border-b border-[#f3f4f5]">
              <h3 className="font-['Manrope'] text-2xl font-[800] text-[#191c1d]">
                {modalAction === 'ADD' ? 'Thêm khu trọ mới' : modalAction === 'EDIT' ? 'Cập nhật khu trọ' : 'Chi tiết khu trọ'}
              </h3>
              <button type="button" onClick={closeModals} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-[#f8f9fa] transition-colors">
                <span className="material-symbols-outlined text-[#6d7a72]">close</span>
              </button>
            </div>
            <form onSubmit={handleHostelSubmit}>
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tên khu trọ */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">
                      Tên khu trọ <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      disabled={modalAction === 'VIEW'}
                      value={modalData.name || ''}
                      onChange={e => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full h-[52px] px-5 bg-white border border-[#e1e3e4] rounded-[10px] text-[#191c1d] focus:outline-none focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] transition-all disabled:opacity-70 disabled:bg-[#f8f9fa]"
                      placeholder="Ví dụ: T's House Quận 10"
                      type="text"
                    />
                  </div>
                  {/* Địa chỉ */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">
                      Địa chỉ chi tiết <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      disabled={modalAction === 'VIEW'}
                      value={modalData.address || ''}
                      onChange={e => setModalData({ ...modalData, address: e.target.value })}
                      className="w-full h-[52px] px-5 bg-white border border-[#e1e3e4] rounded-[10px] text-[#191c1d] focus:outline-none focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] transition-all disabled:opacity-70 disabled:bg-[#f8f9fa]"
                      placeholder="Số nhà, tên đường, phường/xã..."
                      type="text"
                    />
                  </div>
                  {/* Tỉnh thành */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">Tỉnh / Thành phố</label>
                    <div className="relative">
                      <select
                        disabled={modalAction === 'VIEW'}
                        value={modalData.city || 'Hồ Chí Minh'}
                        onChange={handleCityChange}
                        className="w-full h-[52px] px-5 bg-white border border-[#e1e3e4] rounded-[10px] text-[#191c1d] focus:outline-none focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] transition-all appearance-none disabled:opacity-70 disabled:bg-[#f8f9fa]"
                      >
                        {Object.keys(VN_LOCATIONS).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6d7a72]">expand_more</span>
                    </div>
                  </div>
                  {/* Quận huyện */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">Quận / Huyện</label>
                    <div className="relative">
                      <select
                        disabled={modalAction === 'VIEW'}
                        value={modalData.district || ''}
                        onChange={e => setModalData({ ...modalData, district: e.target.value })}
                        className="w-full h-[52px] px-5 bg-white border border-[#e1e3e4] rounded-[10px] text-[#191c1d] focus:outline-none focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] transition-all appearance-none disabled:opacity-70 disabled:bg-[#f8f9fa]"
                      >
                        <option value="">-- Chọn quận/huyện --</option>
                        {(VN_LOCATIONS[modalData.city || 'Hồ Chí Minh'] || []).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6d7a72]">expand_more</span>
                    </div>
                  </div>
                  {/* Trạng thái - chỉ hiện khi EDIT/VIEW */}
                  {modalAction !== 'ADD' && (
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">Trạng thái khu trọ</label>
                      <div className="relative">
                        <select
                          disabled={modalAction === 'VIEW'}
                          value={modalData.status || 'HOAT_DONG'}
                          onChange={e => setModalData({ ...modalData, status: e.target.value })}
                          className="w-full h-[52px] px-5 bg-white border border-[#e1e3e4] rounded-[10px] text-[#191c1d] focus:outline-none focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] transition-all appearance-none disabled:opacity-70 disabled:bg-[#f8f9fa] font-bold"
                        >
                          <option value="HOAT_DONG">Hoạt động</option>
                          <option value="BAO_TRI">Bảo trì</option>
                          <option value="NGUNG_HOAT_DONG">Ngừng Hoạt động</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6d7a72]">expand_more</span>
                      </div>
                    </div>
                  )}
                  {/* Ghi chú */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">Ghi chú / Mô tả</label>
                    <textarea
                      disabled={modalAction === 'VIEW'}
                      value={modalData.description || ''}
                      onChange={e => setModalData({ ...modalData, description: e.target.value })}
                      className="w-full py-4 px-5 bg-white border border-[#e1e3e4] rounded-[10px] text-[#191c1d] focus:outline-none focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] transition-all resize-none disabled:opacity-70 disabled:bg-[#f8f9fa]"
                      placeholder="Thông tin bổ sung về khu trọ..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>
              <div className="px-8 py-6 bg-[#f8f9fa] flex justify-end gap-3 border-t border-[#f3f4f5]">
                <button type="button" onClick={closeModals} className="px-6 py-2.5 text-[#6d7a72] text-[14px] font-bold rounded-xl hover:bg-[#e1e3e4] transition-all">
                  {modalAction === 'VIEW' ? 'Đóng' : 'Hủy'}
                </button>
                {modalAction !== 'VIEW' && (
                  <button type="submit" className="px-10 py-2.5 bg-[#006948] text-white text-[14px] font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-900/10 transition-all active:scale-95">
                    Lưu thông tin
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL: PHÒNG TRỌ ========== */}
      {modalType === 'ROOM' && modalData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#f3f4f5]">
              <h3 className="font-['Manrope'] text-2xl font-[800] text-[#191c1d]">
                {modalAction === 'ADD' ? 'Thêm phòng mới' : modalAction === 'EDIT' ? 'Cập nhật phòng' : 'Thông tin phòng'}
              </h3>
              <button type="button" onClick={closeModals} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-[#f8f9fa] transition-colors">
                <span className="material-symbols-outlined text-[#6d7a72]">close</span>
              </button>
            </div>
            <form onSubmit={handleRoomSubmit} className="p-8 flex flex-col gap-6 max-h-[75vh] overflow-y-auto">
              {/* Chọn khu trọ */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">
                  Chọn khu trọ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    disabled={modalAction === 'VIEW'}
                    value={modalData.hostelId || ''}
                    onChange={e => setModalData({ ...modalData, hostelId: Number(e.target.value) })}
                    className="w-full h-[52px] bg-white border border-[#e1e3e4] rounded-[10px] px-5 text-[#191c1d] focus:outline-none focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] transition-all appearance-none disabled:opacity-70 disabled:bg-[#f8f9fa]"
                  >
                    <option value="">-- Chọn khu trọ --</option>
                    {hostels.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6d7a72]">expand_more</span>
                </div>
              </div>
              {/* Số phòng + Tầng */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">
                    Số phòng <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    disabled={modalAction === 'VIEW'}
                    value={modalData.roomNumber || ''}
                    onChange={e => setModalData({ ...modalData, roomNumber: e.target.value })}
                    className="h-[52px] px-5 bg-white border border-[#e1e3e4] rounded-[10px] text-[#191c1d] focus:outline-none focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] transition-all disabled:opacity-70 disabled:bg-[#f8f9fa] font-bold"
                    placeholder="VD: 101"
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">Tầng</label>
                  <input
                    disabled={modalAction === 'VIEW'}
                    type="number"
                    value={modalData.floor || ''}
                    onChange={e => setModalData({ ...modalData, floor: e.target.value })}
                    className="h-[52px] px-5 bg-white border border-[#e1e3e4] rounded-[10px] text-[#191c1d] focus:outline-none focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] transition-all disabled:opacity-70 disabled:bg-[#f8f9fa]"
                    placeholder="VD: 1"
                  />
                </div>
              </div>
              {/* Giá thuê + Chỉ số điện */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">
                    Giá thuê (VNĐ/Tháng) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    disabled={modalAction === 'VIEW'}
                    type="number"
                    value={modalData.price || ''}
                    onChange={e => setModalData({ ...modalData, price: e.target.value })}
                    className="h-[52px] px-5 bg-white border border-[#e1e3e4] rounded-[10px] focus:outline-none focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] transition-all disabled:opacity-70 disabled:bg-[#f8f9fa] font-bold text-emerald-700"
                    placeholder="VD: 3500000"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">Chỉ số điện (kWh)</label>
                  <input
                    disabled={modalAction === 'VIEW'}
                    type="number"
                    value={modalData.electricityIndex || 0}
                    onChange={e => setModalData({ ...modalData, electricityIndex: e.target.value })}
                    className="h-[52px] px-5 bg-white border border-[#e1e3e4] rounded-[10px] text-[#191c1d] focus:outline-none focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] transition-all disabled:opacity-70 disabled:bg-[#f8f9fa]"
                    placeholder="VD: 100"
                  />
                </div>
              </div>
              {/* Trạng thái phòng chỉ show khi EDIT/VIEW */}
              {modalAction !== 'ADD' && (
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">Trạng thái phòng</label>
                  <div className="relative">
                    <select
                      disabled={modalAction === 'VIEW'}
                      value={modalData.status || 'TRONG'}
                      onChange={e => setModalData({ ...modalData, status: e.target.value })}
                      className="w-full h-[52px] bg-white border border-[#e1e3e4] rounded-[10px] px-5 text-[#191c1d] focus:outline-none focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] transition-all appearance-none disabled:opacity-70 disabled:bg-[#f8f9fa] font-bold"
                    >
                      <option value="TRONG">Trống</option>
                      <option value="DANG_O">Đang ở</option>
                      <option value="BAO_TRI">Bảo trì</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6d7a72]">expand_more</span>
                  </div>
                </div>
              )}
              {/* Mô tả */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">Mô tả thêm</label>
                <textarea
                  disabled={modalAction === 'VIEW'}
                  value={modalData.description || ''}
                  onChange={e => setModalData({ ...modalData, description: e.target.value })}
                  className="py-4 px-5 bg-white border border-[#e1e3e4] rounded-[10px] text-[#191c1d] focus:outline-none focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] transition-all resize-none disabled:opacity-70 disabled:bg-[#f8f9fa]"
                  placeholder="Ghi chú về tình trạng phòng, diện tích..."
                  rows="3"
                />
              </div>
              {/* Footer actions */}
              <div className="px-8 py-5 bg-[#f8f9fa] flex justify-end gap-3 -mx-8 -mb-8 border-t border-[#f3f4f5] mt-2">
                <button type="button" onClick={closeModals} className="px-6 py-2.5 text-[#6d7a72] text-[14px] font-bold rounded-xl hover:bg-[#e1e3e4] transition-all">
                  {modalAction === 'VIEW' ? 'Đóng' : 'Hủy'}
                </button>
                {modalAction !== 'VIEW' && (
                  <button type="submit" className="px-10 py-2.5 bg-[#006948] text-white text-[14px] font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-900/10 transition-all active:scale-95">
                    Lưu thông tin
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL: XÁC NHẬN XOÁ ========== */}
      {modalType === 'DELETE' && modalData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <h3 className="font-['Manrope'] text-xl font-[800] text-[#191c1d] mb-2">Xác nhận xoá?</h3>
            <p className="text-[#6d7a72] mb-8 text-sm leading-relaxed">
              Bạn sắp xoá {modalData.target === 'HOSTEL' ? 'Khu trọ' : 'Phòng trọ'}{' '}
              <b className="text-[#191c1d]">"{modalData.name}"</b>.
              Thao tác này không thể phục hồi dữ liệu.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={closeModals} className="flex-1 py-3 text-[#6d7a72] font-bold bg-[#f8f9fa] hover:bg-[#e1e3e4] rounded-xl transition-all text-[14px]">
                Giữ lại
              </button>
              <button onClick={handleDelete} className="flex-1 py-3 text-white font-bold bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-md shadow-red-500/20 text-[14px]">
                Xoá vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== TOAST NOTIFICATION ========== */}
      {toast.show && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm tracking-wide z-[150] flex items-center gap-3 border ${
          toast.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-[#e8f7f2] text-[#006948] border-emerald-200'
        }`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          {toast.msg}
        </div>
      )}
    </>
  );
};

export default KhuPhongTroPage;
