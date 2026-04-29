import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import * as electricityApi from '../../../services/electricity.service';
import * as serviceApi from '../../../services/service.service';
import * as hostelApi from '../../../services/hostel.service';

import { useNavigate } from 'react-router-dom';

const QuanLyDienPage = () => {
  const { user, hasPermission } = useContext(AuthContext);
  const navigate = useNavigate();

  const canView = hasPermission('chi_so_dien', 'view');
  const canEdit = hasPermission('chi_so_dien', 'edit');

  useEffect(() => {
    if (user && !canView) {
      navigate('/dashboard');
    }
  }, [user, canView, navigate]);

  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [isSaving, setIsSaving] = useState(false);
  const [unitPrice, setUnitPrice] = useState(3500);
  const [hostels, setHostels] = useState([]);
  const [prevTotalConsumption, setPrevTotalConsumption] = useState(0);

  // Filters state
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ hostelId: '', status: '' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const services = await serviceApi.getServices();
      const elecService = services.find(s => s.name.toLowerCase().includes('điện'));
      if (elecService) setUnitPrice(elecService.price);

      const data = await electricityApi.getMeterIndices(month, year);
      setMeters(data);

      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevData = await electricityApi.getMeterIndices(prevMonth, prevYear);
      const prevTotal = prevData.reduce((sum, m) => sum + (m.consumption || 0), 0);
      setPrevTotalConsumption(prevTotal);

      const hostelData = await hostelApi.getHostels();
      setHostels(hostelData);
    } catch (e) {
      showToast('Lỗi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const handleIndexChange = (roomId, value) => {
    const val = value === '' ? '' : parseFloat(value);
    setMeters(prev => prev.map(m => {
      if (m.roomId === roomId) {
        const currentIndex = val === '' ? 0 : val;
        const consumption = Math.max(0, currentIndex - m.previousIndex);
        const amount = consumption * m.unitPrice;
        return { 
            ...m, 
            currentIndex: val, 
            consumption, 
            amount, 
            status: val === '' || val === 0 ? 'CHUA_NHAP' : 'DANG_NHAP' 
        };
      }
      return m;
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const dataToSave = meters
        .filter(m => m.status === 'DANG_NHAP' && m.currentIndex !== '' && m.currentIndex !== 0)
        .map(m => ({
          roomId: m.roomId,
          month,
          year,
          currentIndex: m.currentIndex
        }));
      
      if (dataToSave.length === 0) {
        showToast('Không có dữ liệu thay đổi để lưu', 'warning');
        return;
      }

      await electricityApi.saveBatchMeters(dataToSave);
      showToast('Đã lưu chỉ số điện thành công!');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi lưu dữ liệu', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMeters = meters.filter(m => {
    const matchesSearch = m.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) || m.hostelName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHostel = filters.hostelId === '' || m.hostelId === Number(filters.hostelId) || m.hostel?.id === Number(filters.hostelId);
    const matchesStatus = filters.status === '' || m.status === filters.status;
    return matchesSearch && matchesHostel && matchesStatus;
  });

  const totalConsumption = meters.reduce((sum, m) => sum + (m.consumption || 0), 0);
  const totalAmount = meters.reduce((sum, m) => sum + (m.amount || 0), 0);
  const growthRate = totalConsumption > 0 ? (prevTotalConsumption / totalConsumption) * 100 : 0;
  
  const completionRate = meters.length > 0 ? Math.round((meters.filter(m => m.status === 'DA_NHAP').length / meters.length) * 100) : 0;
  const completedCount = meters.filter(m => m.status === 'DA_NHAP').length;

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMeters.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMeters.length / itemsPerPage);

  return (
    <div className="flex-1 overflow-y-auto px-12 pb-12 pt-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold font-headline text-black leading-tight">Quản lý số điện</h2>
          <p className="text-[#3d4a42] mt-1 text-sm">Ghi nhận chỉ số tiêu thụ điện năng hàng tháng cho từng phòng.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-[#bccac0]/10">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-[#6d7a72] tracking-wider">THÁNG HIỆN TẠI</p>
              <div className="flex gap-1">
                <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="text-sm font-bold text-[#191c1d] border-none p-0 bg-transparent focus:ring-0">
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
                </select>
                <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="text-sm font-bold text-[#191c1d] border-none p-0 bg-transparent focus:ring-0">
                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#006948] text-xl">calendar_today</span>
          </div>
          {canEdit && (
            <button onClick={handleSaveAll} disabled={isSaving} className="bg-[#006948] text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md shadow-[#006948]/10 hover:bg-[#004d35] transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">save</span>
              {isSaving ? 'Đang lưu...' : 'Lưu dữ liệu'}
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-12 gap-6 mb-10">
        <div className="col-span-12 md:col-span-8 bg-[#006948] p-8 rounded-[2rem] text-white relative overflow-hidden flex flex-col justify-between h-[220px]">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-2 uppercase tracking-widest">TỔNG TIÊU THỤ</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-5xl font-extrabold font-headline">{totalConsumption.toLocaleString()}</h3>
              <span className="text-xl font-medium opacity-80 uppercase tracking-wide">kWh</span>
            </div>
          </div>
          <div className="relative z-10 flex gap-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">TĂNG TRƯỞNG THÁNG</p>
              <p className="text-xl font-bold">{growthRate.toFixed(1)}% <span className="material-symbols-outlined text-sm align-middle ml-1">{growthRate > 100 ? 'trending_up' : 'trending_down'}</span></p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">DỰ KIẾN HÓA ĐƠN TIỀN ĐIỆN</p>
              <p className="text-xl font-bold">{totalAmount.toLocaleString()}đ</p>
            </div>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[180px] text-white/10 rotate-12" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
        </div>

        <div className="col-span-12 md:col-span-4 bg-white p-8 rounded-[2rem] border border-[#bccac0]/10 shadow-sm flex flex-col items-center justify-between h-[220px]">
          <p className="text-sm font-bold text-[#191c1d] uppercase tracking-wider">Tiến độ nhập liệu</p>
          <div className="relative flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle className="text-[#f3f4f5]" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeWidth="6"></circle>
              <circle className="text-[#006948]" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeWidth="8" strokeDasharray="339.29" strokeDashoffset={339.29 - (339.29 * completionRate) / 100} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }}></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-extrabold font-headline text-[#191c1d]">{completionRate}%</span></div>
          </div>
          <div className="bg-emerald-50 px-4 py-1.5 rounded-full"><p className="text-[11px] font-bold text-[#006948]">{completedCount} / {meters.length} phòng đã xong</p></div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#bccac0]/10 mb-10">
        <div className="px-8 py-6 flex justify-between items-center border-b border-[#edeeef]">
          <div>
            <h3 className="font-manrope text-xl font-bold text-[#191c1d]">Danh sách chi tiết theo phòng</h3>
            <p className="text-sm text-[#3d4a42]">Chi tiết chỉ số theo từng phòng và đơn giá áp dụng</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a72] text-lg">search</span>
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#f3f4f5] border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#006948]/20" placeholder="Tìm kiếm phòng, khu trọ..." type="text" />
            </div>
            <button onClick={() => setShowFilter(!showFilter)} className={`p-2 rounded-lg transition-all ${showFilter ? 'bg-[#006948] text-white' : 'text-[#6d7a72] hover:bg-[#f8f9fa]'}`}>
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="material-symbols-outlined text-slate-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{unitPrice.toLocaleString()}đ/kWh</span>
            </div>
          </div>
        </div>

        {/* Filter Row */}
        {showFilter && (
          <div className="px-8 py-3 bg-[#f8f9fa] border-b border-[#edeeef] flex gap-4 items-center animate-in slide-in-from-top duration-300">
            <select value={filters.hostelId} onChange={e => setFilters({...filters, hostelId: e.target.value})} className="text-xs border border-[#bccac0]/30 rounded-lg px-3 py-1.5 bg-white outline-none">
              <option value="">Tất cả khu trọ</option>
              {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="text-xs border border-[#bccac0]/30 rounded-lg px-3 py-1.5 bg-white outline-none">
              <option value="">Tất cả trạng thái</option>
              <option value="DA_NHAP">Đã nhập</option>
              <option value="DANG_NHAP">Đang nhập</option>
              <option value="CHUA_NHAP">Chưa nhập</option>
            </select>
            <button onClick={() => setFilters({ hostelId: '', status: '' })} className="text-xs text-[#006948] font-bold hover:underline ml-auto">Xoá bộ lọc</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#f3f4f5]/30 border-b border-[#edeeef]">
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72] w-[15%]">Khu trọ</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72] text-center w-[10%]">Số phòng</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72] text-center w-[15%]">Chỉ số cũ (kWh)</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72] text-center w-[15%]">Chỉ số mới (kWh)</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72] text-center w-[15%]">Tiêu thụ</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72] text-right w-[15%]">Thành tiền</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#6d7a72] text-center w-[15%]">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {loading ? (<tr><td colSpan="7" className="px-8 py-10 text-center text-[#6d7a72]">Đang tải...</td></tr>) : currentItems.map(m => (
                <tr key={m.roomId} className="hover:bg-[#f3f4f5]/50 transition-colors">
                  <td className="px-8 py-4 text-sm font-medium text-[#3d4a42]">{m.hostelName}</td>
                  <td className="px-8 py-4 font-manrope font-bold text-[#191c1d] text-center">{m.roomNumber}</td>
                  <td className="px-8 py-4 text-sm text-[#3d4a42] text-center">{m.previousIndex.toLocaleString()}</td>
                  <td className="px-8 py-4 text-center">
                    <input disabled={!canEdit} value={m.currentIndex === 0 ? '' : m.currentIndex} onChange={(e) => handleIndexChange(m.roomId, e.target.value)} className="w-24 bg-[#f3f4f5] border-none rounded-lg px-2 py-1 text-sm font-bold text-center focus:ring-2 focus:ring-[#006948]/20 disabled:opacity-50 disabled:cursor-not-allowed" type="number" />
                  </td>
                  <td className="px-8 py-4 font-bold text-[#006948] text-sm text-center">{m.consumption.toLocaleString()}</td>
                  <td className="px-8 py-4 font-bold text-[#191c1d] text-sm text-right">{m.amount.toLocaleString()}đ</td>
                  <td className="px-8 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap w-24 mx-auto justify-center ${
                      m.status === 'DA_NHAP' ? 'bg-emerald-50 text-emerald-700' : 
                      m.status === 'DANG_NHAP' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${m.status === 'DA_NHAP' ? 'bg-emerald-600' : m.status === 'DANG_NHAP' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                      {m.status === 'DA_NHAP' ? 'Đã nhập' : m.status === 'DANG_NHAP' ? 'Đang nhập' : 'Chưa nhập'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-8 py-4 bg-[#f3f4f5]/10 flex justify-between items-center border-t border-[#edeeef]">
          <p className="text-xs text-[#3d4a42] font-medium">Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredMeters.length)} trong tổng số {filteredMeters.length} bản ghi</p>
          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 hover:bg-[#f3f4f5] rounded-lg transition-colors disabled:opacity-30"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${currentPage === i+1 ? 'bg-[#006948] text-white shadow-md' : 'hover:bg-[#f3f4f5] text-[#191c1d]'}`}>{i+1}</button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 hover:bg-[#f3f4f5] rounded-lg transition-colors disabled:opacity-30"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
          </div>
        </div>
      </div>

      {toast.show && (<div className={`fixed bottom-8 right-8 px-8 py-5 rounded-[20px] shadow-2xl font-bold text-sm z-[200] flex items-center gap-3 border animate-in slide-in-from-right duration-500 ${toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-red-600 text-white border-red-400'}`}><span className="material-symbols-outlined">{toast.type === 'success' ? 'check_circle' : 'error'}</span>{toast.msg}</div>)}
    </div>
  );
};

export default QuanLyDienPage;
