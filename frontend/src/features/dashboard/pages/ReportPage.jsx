import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import reportService from '../../../services/report.service';
import ReportDetailModal from '../components/ReportDetailModal';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'report_export_history';

const ReportPage = () => {
  const { user, hasPermission } = useContext(AuthContext);
  const navigate = useNavigate();

  const canView = hasPermission('bao_cao', 'view');
  const canExport = hasPermission('bao_cao', 'edit');

  useEffect(() => {
    if (user && !canView) {
      navigate('/dashboard');
    }
  }, [user, canView, navigate]);

  const [filterType, setFilterType] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const [reportData, setReportData] = useState({
    totalTenants: 0, totalRooms: 0, rentedRooms: 0,
    maintenanceRooms: 0, vacantRooms: 0, totalRevenue: 0,
    revenue12Months: Array(12).fill(0)
  });
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'tenants' | 'rooms' | 'invoices'
  const [exportHistory, setExportHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (user && canView) {
      fetchReport();
    }
  }, [user, canView, filterType, selectedYear, selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportService.getDashboardReport(filterType, selectedYear, filterType === 'month' ? selectedMonth : null);
      setReportData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fmt = (n) => n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);

  const maxRevenue = Math.max(...reportData.revenue12Months, 1);
  const totalConsidered = reportData.rentedRooms + reportData.maintenanceRooms + reportData.vacantRooms;
  const occupancyRate = totalConsidered === 0 ? 0 : Math.round((reportData.rentedRooms / totalConsidered) * 100);

  const addExportHistory = (label) => {
    const entry = {
      label,
      time: new Date().toLocaleString('vi-VN'),
      user: user?.fullName || user?.username || 'Admin'
    };
    const updated = [entry, ...exportHistory].slice(0, 10);
    setExportHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const overviewData = [
      { 'Chỉ số': 'Tổng khách thuê', 'Giá trị': reportData.totalTenants },
      { 'Chỉ số': 'Phòng đang thuê', 'Giá trị': reportData.rentedRooms },
      { 'Chỉ số': 'Phòng trống', 'Giá trị': reportData.vacantRooms },
      { 'Chỉ số': 'Phòng bảo trì', 'Giá trị': reportData.maintenanceRooms },
      { 'Chỉ số': 'Tổng doanh thu (VNĐ)', 'Giá trị': reportData.totalRevenue },
      { 'Chỉ số': 'Tỉ lệ lấp đầy', 'Giá trị': occupancyRate + '%' }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overviewData), 'TongQuan');
    const revenueData = reportData.revenue12Months.map((amt, i) => ({ 'Tháng': `T${i + 1}/${selectedYear}`, 'Doanh thu (VNĐ)': amt }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(revenueData), 'DoanhThu12Thang');
    const fileName = `Bao_cao_${selectedYear}${filterType === 'month' ? '_T' + selectedMonth : ''}.xlsx`;
    XLSX.writeFile(wb, fileName);

    const label = filterType === 'month'
      ? `Báo cáo Tháng ${selectedMonth}/${selectedYear}`
      : `Báo cáo Năm ${selectedYear}`;
    addExportHistory(label);
  };

  const mStr = selectedMonth.toString().padStart(2, '0');
  const dateRange = filterType === 'month'
    ? `01/${mStr}/${selectedYear} - ${new Date(selectedYear, selectedMonth, 0).getDate()}/${mStr}/${selectedYear}`
    : `01/01/${selectedYear} - 31/12/${selectedYear}`;

  const StatCard = ({ icon, iconBg, iconColor, label, value, subtext, subtextColor, gradient, onClick }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-[#bccac0]/10 relative group hover:border-[#006948]/30 transition-all ${gradient || ''}`}>
      <div className={`p-2 ${iconBg} rounded-xl ${iconColor} w-fit mb-4`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <p className={`text-sm font-medium uppercase tracking-wider ${subtextColor ? 'text-emerald-800' : 'text-[#3d4a42]'}`}>{label}</p>
      <h3 className={`text-3xl font-headline font-extrabold mt-2 ${subtextColor ? 'text-emerald-900' : 'text-[#191c1d]'}`}>{value}</h3>
      <p className={`text-xs mt-2 ${subtextColor || 'text-[#3e6753]'}`}>{subtext}</p>
      <button
        onClick={onClick}
        className="absolute bottom-4 right-4 p-1.5 rounded-lg text-[#006948] bg-emerald-50 hover:bg-[#006948] hover:text-white transition-all opacity-60 group-hover:opacity-100"
        title="Xem chi tiết"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-12 pb-12 pt-8 bg-[#f8f9fa]">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-[#191c1d] tracking-tight">Báo cáo</h2>
          <p className="text-sm text-[#3d4a42] mt-1">Phân tích chuyên sâu về tình hình kinh doanh của bạn.</p>
        </div>
        {canExport && (
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-[#006948] text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-[#006948]/20 hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-[20px]">file_export</span>
            Xuất báo cáo
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-[#bccac0]/10 flex flex-wrap items-center gap-5 mb-8">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[#3d4a42] uppercase tracking-wider">Lọc theo:</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-sm bg-[#f3f4f5] rounded-xl px-4 py-2 outline-none">
            <option value="month">Tháng</option>
            <option value="year">Năm</option>
          </select>
        </div>
        {filterType === 'month' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-[#3d4a42] uppercase tracking-wider">Tháng:</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="text-sm bg-[#f3f4f5] rounded-xl px-4 py-2 outline-none">
              {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[#3d4a42] uppercase tracking-wider">Năm:</label>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="text-sm bg-[#f3f4f5] rounded-xl px-4 py-2 outline-none">
            {[...Array(5)].map((_, i) => { const y = new Date().getFullYear() - i; return <option key={y} value={y}>{y}</option>; })}
          </select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="material-symbols-outlined text-sm text-[#3d4a42]">calendar_today</span>
          <span className="text-sm text-[#191c1d] bg-[#f3f4f5] px-4 py-2 rounded-xl">{dateRange}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon="groups" iconBg="bg-[#85f8c4]" iconColor="text-[#002114]" label="Tổng khách thuê" value={reportData.totalTenants} subtext="Khách đang cư trú" onClick={() => setActiveModal('tenants')} />
        <StatCard icon="person_pin" iconBg="bg-[#c0edd3]" iconColor="text-[#002114]" label="Phòng đang thuê" value={reportData.rentedRooms} subtext={`Trên tổng số ${reportData.totalRooms} phòng`} onClick={() => setActiveModal('rooms')} />
        <StatCard icon="door_open" iconBg="bg-[#ffdad7]" iconColor="text-[#410004]" label="Phòng trống" value={reportData.vacantRooms} subtext={`${reportData.totalRooms > 0 ? Math.round((reportData.vacantRooms / reportData.totalRooms) * 100) : 0}% trên tổng số phòng`} subtextColor="text-[#9b3e3b]" onClick={() => setActiveModal('rooms')} />
        <StatCard icon="monetization_on" iconBg="bg-[#006948]" iconColor="text-white" label="Doanh thu" value={fmt(reportData.totalRevenue)} subtext="Tổng theo bộ lọc" subtextColor="text-emerald-700" gradient="bg-gradient-to-br from-emerald-50 to-white" onClick={() => setActiveModal('invoices')} />
      </div>

      {/* Charts + Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-[#bccac0]/10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-[#191c1d]">Phân tích Doanh thu</h3>
              <p className="text-xs text-[#3d4a42]">12 tháng trong năm {selectedYear}</p>
            </div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-600"></div><span className="text-xs text-[#3d4a42]">Doanh thu (VNĐ)</span></div>
          </div>
          <div className="flex items-end justify-between h-56 gap-4 px-2 mt-4">
            {reportData.revenue12Months.map((amt, idx) => {
              const h = maxRevenue > 0 ? (amt / maxRevenue) * 100 : 0;
              return (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 group relative h-full">
                  <div className="absolute -top-7 hidden group-hover:block bg-[#191c1d] text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 shadow-lg">
                    {amt.toLocaleString('vi-VN')}đ
                  </div>
                  {/* Track background */}
                  <div className="w-full bg-slate-50 rounded-lg absolute bottom-6 top-0 -z-0"></div>
                  {/* Actual bar */}
                  <div 
                    className="w-full bg-emerald-600 rounded-t-lg hover:bg-emerald-500 transition-all duration-300 relative z-1" 
                    style={{ 
                      height: `${Math.max(0, (h * 0.85))}%`, 
                      minHeight: amt > 0 ? '4px' : '0',
                      marginTop: 'auto',
                      marginBottom: '24px'
                    }}
                  ></div>
                  <span className="text-[10px] font-bold text-[#3d4a42] absolute bottom-0">T{idx + 1}</span>

                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Gauge */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#bccac0]/10 text-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#3d4a42] mb-5 text-left">Tỷ lệ lấp đầy</h3>
            <div className="relative w-36 h-36 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-[#e7e8e9]" cx="72" cy="72" fill="transparent" r="62" stroke="currentColor" strokeWidth="8" />
                <circle className="text-[#006948]" cx="72" cy="72" fill="transparent" r="62" stroke="currentColor"
                  strokeDasharray="390" strokeDashoffset={390 - (390 * occupancyRate) / 100}
                  strokeWidth="8" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-headline font-extrabold">{occupancyRate}%</span>
                <span className="text-[10px] text-[#3d4a42]">Đã thuê</span>
              </div>
            </div>
            <p className="text-xs text-[#3d4a42] mt-4 italic">Hiệu suất vận hành</p>
          </div>

          {/* Export History */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#bccac0]/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#3d4a42] mb-4">Lịch sử xuất báo cáo</h3>
            {exportHistory.length === 0 ? (
              <p className="text-xs text-[#6d7a72] italic">Chưa có lần xuất nào</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {exportHistory.map((entry, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-[#006948] shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-[#191c1d]">{entry.label}</p>
                      <p className="text-[10px] text-[#6d7a72]">{entry.time} • {entry.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modals */}
      {activeModal && (
        <ReportDetailModal
          type={activeModal}
          onClose={() => setActiveModal(null)}
          filterYear={selectedYear}
          filterMonth={selectedMonth}
          filterType={filterType}
        />
      )}
    </div>
  );
};

export default ReportPage;
