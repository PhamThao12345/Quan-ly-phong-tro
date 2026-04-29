import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import * as serviceApi from '../../../services/service.service';
import * as hostelApi from '../../../services/hostel.service';
import * as roomApi from '../../../services/room.service';

import { useNavigate } from 'react-router-dom';

const DichVuKhacPage = () => {
  const { user, hasPermission } = useContext(AuthContext);
  const navigate = useNavigate();

  const canView = hasPermission('dich_vu_khac', 'view');
  const canEdit = hasPermission('dich_vu_khac', 'edit');
  const canDelete = hasPermission('dich_vu_khac', 'delete');

  useEffect(() => {
    if (user && !canView) {
      navigate('/dashboard');
    }
  }, [user, canView, navigate]);
  
  const [services, setServices] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalType, setModalType] = useState(null); // 'ADD', 'EDIT', 'DELETE', 'APPLY'
  const [modalData, setModalData] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  const fetchServices = async () => {
    try {
      const data = await serviceApi.getServices();
      setServices(data);
    } catch (e) {
      showToast('Lỗi tải danh sách dịch vụ', 'error');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchServices(), fetchHostels(), fetchAllRooms()]);
    setLoading(false);
  };

  const fetchHostels = async () => {
    try {
      const data = await hostelApi.getHostels();
      setHostels(data);
    } catch {}
  };

  const fetchAllRooms = async () => {
    try {
      const data = await roomApi.getRooms(1, 1000, '');
      setRooms(data.rooms);
    } catch {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const closeModals = () => {
    setModalType(null);
    setModalData(null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await serviceApi.createService(modalData);
      showToast('Thêm dịch vụ thành công!');
      closeModals();
      fetchServices();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi thêm dịch vụ', 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const { id, name, price, unit, status } = modalData;
      await serviceApi.updateService(id, { name, price, unit, status });
      showToast('Cập nhật dịch vụ thành công!');
      closeModals();
      fetchServices();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await serviceApi.deleteService(modalData.id);
      showToast('Đã xóa dịch vụ!');
      closeModals();
      fetchServices();
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể xóa dịch vụ này', 'error');
    }
  };

  const handleApplyToggle = async (roomId) => {
    try {
      const isApplied = modalData.appliedRoomIds.includes(roomId);
      if (isApplied) {
        await serviceApi.removeServiceFromRoom(modalData.id, roomId);
        setModalData(prev => ({
          ...prev,
          appliedRoomIds: prev.appliedRoomIds.filter(id => id !== roomId)
        }));
      } else {
        await serviceApi.applyServiceToRooms(modalData.id, [roomId]);
        setModalData(prev => ({
          ...prev,
          appliedRoomIds: [...prev.appliedRoomIds, roomId]
        }));
      }
      fetchServices(); // Refresh to update room lists in cards
    } catch (err) {
      showToast('Lỗi khi thay đổi trạng thái áp dụng', 'error');
    }
  };

  const getServiceIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('điện')) return 'bolt';
    if (n.includes('nước')) return 'water_drop';
    if (n.includes('wifi') || n.includes('mạng') || n.includes('internet')) return 'wifi';
    if (n.includes('rác')) return 'delete';
    if (n.includes('xe')) return 'directions_car';
    return 'home_repair_service';
  };

  const getIconColor = (name) => {
    const n = name.toLowerCase();
    if (n.includes('điện')) return 'bg-emerald-50 text-emerald-600';
    if (n.includes('nước')) return 'bg-blue-50 text-blue-600';
    if (n.includes('wifi')) return 'bg-purple-50 text-purple-600';
    if (n.includes('rác')) return 'bg-amber-50 text-amber-600';
    return 'bg-slate-50 text-slate-600';
  };

  return (
    <div className="p-8 lg:p-12 max-w-7xl w-full mx-auto">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-[#191c1d] mt-2 tracking-tight">Dịch vụ & Tiện ích</h2>
          <p className="text-[#3d4a42] mt-3 max-w-2xl leading-relaxed">
            Quản lý định mức giá và phương thức tính toán cho các dịch vụ tiện ích nội khu. 
            Các thay đổi sẽ được áp dụng trực tiếp vào hóa đơn của kỳ kế tiếp.
          </p>
        </div>
        {canEdit && (
          <button 
            onClick={() => {
              setModalType('ADD');
              setModalData({ name: '', price: 0, unit: 'kWh' });
            }}
            className="bg-[#006948] text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg shadow-[#006948]/20 transition-all hover:scale-[1.02] flex items-center gap-2 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Thêm dịch vụ mới
          </button>
        )}
      </div>

      {/* Bento-style Grid for Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map(svc => (
          <div key={svc.id} className="group relative bg-white p-6 rounded-xl transition-all duration-300 hover:shadow-xl border border-emerald-50 flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div className={`p-3 rounded-lg ${getIconColor(svc.name)}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {getServiceIcon(svc.name)}
                </span>
              </div>
              <div className="flex gap-1">
                {canEdit && (
                  <button 
                    onClick={() => {
                      setModalType('EDIT');
                      setModalData(svc);
                    }}
                    className="text-[#6d7a72] hover:text-[#006948] transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </button>
                )}
                {canDelete && (
                  <button 
                    onClick={() => {
                      setModalType('DELETE');
                      setModalData(svc);
                    }}
                    className="text-[#6d7a72] hover:text-red-600 transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#191c1d] mb-1">{svc.name}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#3d4a42] mb-4 opacity-70">
                Tính theo {svc.unit === 'kWh' ? 'số (kWh)' : svc.unit}
              </p>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black ${svc.name.toLowerCase().includes('điện') ? 'text-[#006948]' : 'text-[#191c1d]'}`}>
                  {svc.price.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-[#3d4a42]">đ /{svc.unit}</span>
              </div>
            </div>
            
            {/* Apply Button */}
            {canEdit && (
              <button 
                onClick={() => {
                  setModalType('APPLY');
                  setModalData({
                    ...svc,
                    appliedRoomIds: svc.rooms.map(r => r.roomId)
                  });
                }}
                className="mt-6 w-full py-2 bg-emerald-50 text-[#006948] text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Áp dụng cho {svc.rooms.length} phòng
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer info section */}
      <div className="mt-12 bg-[#006948]/5 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 border border-[#006948]/10">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-[#006948] mb-2">Quy tắc tính phí tự động</h4>
          <p className="text-sm text-[#3d4a42] leading-relaxed">
            Hệ thống sẽ tự động tổng hợp số liệu từ các phòng. 
            Đảm bảo các chỉ số công tơ điện đã được cập nhật chính xác trong mục <strong>Quản lý số điện</strong> để tránh sai sót hóa đơn.
          </p>
        </div>
      </div>

      {/* MODAL: ADD */}
      {modalType === 'ADD' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50/30">
              <h3 className="text-xl font-extrabold text-slate-800">Thêm dịch vụ mới</h3>
              <button onClick={closeModals} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tên dịch vụ</label>
                  <input 
                    required 
                    value={modalData.name}
                    onChange={e => setModalData({...modalData, name: e.target.value})}
                    className="w-full border-slate-200 rounded-lg focus:ring-[#006948] focus:border-[#006948] text-sm p-3 outline-none border" 
                    placeholder="Ví dụ: Phí gửi xe" 
                    type="text" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Đơn giá (VNĐ)</label>
                    <input 
                      required 
                      value={modalData.price}
                      onChange={e => setModalData({...modalData, price: e.target.value})}
                      className="w-full border-slate-200 rounded-lg focus:ring-[#006948] focus:border-[#006948] text-sm p-3 outline-none border" 
                      placeholder="0" 
                      type="number" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Đơn vị tính</label>
                    <select 
                      value={modalData.unit}
                      onChange={e => setModalData({...modalData, unit: e.target.value})}
                      className="w-full border-slate-200 rounded-lg focus:ring-[#006948] focus:border-[#006948] text-sm p-3 outline-none border"
                    >
                      <option value="kWh">kWh</option>
                      <option value="m³">m³</option>
                      <option value="người/tháng">người/tháng</option>
                      <option value="phòng/tháng">phòng/tháng</option>
                      <option value="lần">lần</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
                <button type="button" onClick={closeModals} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Hủy</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-[#006948] hover:bg-emerald-700 rounded-lg shadow-md transition-all">Thêm dịch vụ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT */}
      {modalType === 'EDIT' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-extrabold text-[#191c1d]">Cập nhật giá dịch vụ</h3>
                <p className="text-xs text-[#3d4a42] mt-1">Thay đổi định mức đơn giá dịch vụ</p>
              </div>
              <button onClick={closeModals} className="text-slate-400 hover:text-[#191c1d]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#3d4a42] uppercase tracking-widest mb-2">Tên dịch vụ</label>
                <div className="bg-slate-50 px-4 py-3 rounded-lg text-[#3d4a42] font-medium border border-slate-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">{getServiceIcon(modalData.name)}</span>
                  {modalData.name}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3d4a42] uppercase tracking-widest mb-2">Đơn giá (VNĐ)</label>
                  <input 
                    required
                    value={modalData.price}
                    onChange={e => setModalData({...modalData, price: e.target.value})}
                    className="w-full bg-white border border-slate-200 focus:border-[#006948] focus:ring-4 focus:ring-[#006948]/10 rounded-lg py-3 px-4 text-[#191c1d] font-bold outline-none" 
                    type="number" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3d4a42] uppercase tracking-widest mb-2">Đơn vị tính</label>
                  <select 
                    value={modalData.unit}
                    onChange={e => setModalData({...modalData, unit: e.target.value})}
                    className="w-full bg-white border border-slate-200 focus:border-[#006948] focus:ring-4 focus:ring-[#006948]/10 rounded-lg py-3 px-4 text-[#191c1d] font-medium appearance-none outline-none"
                  >
                    <option value="kWh">kWh</option>
                    <option value="m³">m³</option>
                    <option value="người/tháng">người/tháng</option>
                    <option value="phòng/tháng">phòng/tháng</option>
                    <option value="lần">lần</option>
                  </select>
                </div>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex gap-3">
                <span className="material-symbols-outlined text-blue-600">info</span>
                <p className="text-xs text-blue-700 leading-relaxed">Đơn giá mới sẽ được áp dụng cho tất cả các hóa đơn phát sinh từ thời điểm này.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModals} className="flex-1 py-3 px-4 text-[#3d4a42] font-bold text-sm bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Hủy bỏ</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-[#006948] text-white font-bold text-sm rounded-lg hover:opacity-90 shadow-md shadow-[#006948]/20 transition-all active:scale-95">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE */}
      {modalType === 'DELETE' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-8 text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#191c1d] mb-2">Xác nhận xóa?</h3>
            <p className="text-[#6d7a72] mb-8 text-sm">
              Bạn có chắc chắn muốn xóa dịch vụ <b>{modalData.name}</b>? Hành động này không thể hoàn tác nếu dịch vụ đã được ghi nhận.
            </p>
            <div className="flex gap-3">
              <button onClick={closeModals} className="flex-1 py-3 text-[#6d7a72] font-bold bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">Huỷ</button>
              <button onClick={handleDelete} className="flex-1 py-3 text-white font-bold bg-red-500 rounded-xl shadow-lg hover:bg-red-600 transition-all">Xóa ngay</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: APPLY TO ROOMS */}
      {modalType === 'APPLY' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50/20 shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Áp dụng dịch vụ: {modalData.name}</h3>
                <p className="text-xs text-slate-500">Chọn các phòng sẽ sử dụng dịch vụ này để tự động tính tiền vào hóa đơn.</p>
              </div>
              <button onClick={closeModals} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {hostels.map(hostel => {
                const hostelRooms = rooms.filter(r => r.hostelId === hostel.id);
                if (hostelRooms.length === 0) return null;
                return (
                  <div key={hostel.id} className="mb-8">
                    <h4 className="font-bold text-[#006948] mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">location_city</span>
                      {hostel.name}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {hostelRooms.map(room => {
                        const isApplied = modalData.appliedRoomIds.includes(room.id);
                        return (
                          <button
                            key={room.id}
                            onClick={() => handleApplyToggle(room.id)}
                            className={`p-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                              isApplied 
                              ? 'bg-[#006948] text-white border-[#006948] shadow-md shadow-[#006948]/10' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-[#006948] hover:text-[#006948]'
                            }`}
                          >
                            <span>{room.roomNumber}</span>
                            <span className="text-[9px] font-normal uppercase">
                              {isApplied ? 'Đang dùng' : 'Chưa dùng'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button onClick={closeModals} className="px-10 py-2.5 bg-[#006948] text-white text-sm font-bold rounded-lg shadow-lg hover:bg-emerald-700 transition-all">Hoàn tất</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.show && (
        <div className={`fixed bottom-8 right-8 px-8 py-5 rounded-[20px] shadow-2xl font-bold text-sm tracking-wide z-[200] flex items-center gap-3 border animate-in slide-in-from-right duration-500 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-red-600 text-white border-red-400'
        }`}>
          <span className="material-symbols-outlined">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default DichVuKhacPage;
