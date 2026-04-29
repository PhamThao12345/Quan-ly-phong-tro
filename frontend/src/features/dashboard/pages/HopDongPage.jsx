import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import * as contractService from '../../../services/contract.service';
import * as hostelService from '../../../services/hostel.service';
import * as roomService from '../../../services/room.service';

const HopDongPage = () => {
  const { user } = useContext(AuthContext);
  const isOwner = user?.role === 'CHU_TRO';
  const hasEditPermission = isOwner || user?.permissions?.hop_dong?.edit;
  
  const [contracts, setContracts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ activeContracts: 0, expiringSoon: 0, expectedRevenue: 0 });
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({ status: '', hostelId: '', fromDate: '', toDate: '' });
  
  const [showFilter, setShowFilter] = useState(false);
  const [modalType, setModalType] = useState(null); // 'ADD', 'EDIT', 'VIEW', 'DELETE', 'RENEW', 'TERMINATE'
  const [modalData, setModalData] = useState(null);
  const [modalRooms, setModalRooms] = useState([]);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  const fetchContracts = async () => {
    try {
      const data = await contractService.getContracts(page, 10, search, filters);
      setContracts(data.contracts);
      setTotalPages(data.totalPages);
      setTotalCount(data.total);
    } catch (e) {
      showToast(e.response?.data?.message || 'Lỗi tải danh sách hợp đồng', 'error');
    }
  };

  const fetchStats = async () => {
    try {
      const s = await contractService.getContractStats();
      setStats(s);
    } catch {}
  };

  const fetchHostels = async () => {
    try {
      setHostels(await hostelService.getHostels());
    } catch {}
  };

  const fetchAllRooms = async () => {
    try {
      const d = await roomService.getRooms(1, 1000, '');
      setRooms(d.rooms);
    } catch {}
  };

  useEffect(() => {
    fetchContracts();
  }, [page, search, filters]);

  useEffect(() => {
    fetchStats();
    fetchHostels();
    fetchAllRooms();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const closeModals = () => {
    setModalType(null);
    setModalData(null);
    setIsEditingContent(false);
  };

  const handleHostelChange = (hId, filterByEmpty = true) => {
    const filtered = rooms.filter(r => (r.hostelId === Number(hId) || r.hostel?.id === Number(hId)) && (!filterByEmpty || r.status === 'TRONG'));
    setModalRooms(filtered);
    setModalData(prev => ({ ...prev, hostelId: hId, roomId: '' }));
  };

  const handleAddTenant = () => {
    setModalData(prev => ({
      ...prev,
      additionalTenants: [
        ...prev.additionalTenants,
        { fullName: '', cccd: '', phoneNumber: '', email: '', hometown: '', dateOfBirth: '', isMain: false }
      ]
    }));
  };

  const handleRemoveTenant = (index) => {
    setModalData(prev => ({
      ...prev,
      additionalTenants: prev.additionalTenants.filter((_, i) => i !== index)
    }));
  };

  const handleContractSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'ADD') {
        const payload = {
          roomId: modalData.roomId,
          startDate: modalData.startDate,
          endDate: modalData.endDate,
          deposit: modalData.deposit,
          content: modalData.content,
          tenants: [
            { ...modalData.mainTenant, isMain: true },
            ...modalData.additionalTenants
          ]
        };
        await contractService.createContract(payload);
        showToast('Khởi tạo hợp đồng thành công!');
      } else if (modalType === 'EDIT') {
        const payload = {
          roomId: modalData.roomId,
          startDate: modalData.startDate,
          endDate: modalData.endDate,
          deposit: modalData.deposit,
          content: modalData.content,
          status: modalData.status,
          tenants: [
            { ...modalData.mainTenant, isMain: true },
            ...modalData.additionalTenants
          ]
        };
        await contractService.updateContract(modalData.id, payload);
        showToast('Cập nhật hợp đồng thành công!');
      }
      closeModals();
      fetchContracts();
      fetchStats();
      fetchAllRooms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi thao tác', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await contractService.deleteContract(modalData.id);
      showToast('Đã xoá hợp đồng!');
      closeModals();
      fetchContracts();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi xoá', 'error');
    }
  };

  const handleRenew = async () => {
    try {
      // Đầu tiên lưu lại các thay đổi hiện tại trong form (nếu có) để đảm bảo đồng bộ thông tin khách/phòng
      const payload = {
        roomId: modalData.roomId,
        startDate: modalData.startDate,
        deposit: modalData.deposit,
        content: modalData.content,
        tenants: [
          { ...modalData.mainTenant, isMain: true },
          ...modalData.additionalTenants
        ]
      };
      await contractService.updateContract(modalData.id, payload);
      
      // Sau đó mới gọi API gia hạn
      await contractService.renewContract(modalData.id);
      showToast('Gia hạn hợp đồng thành công (thêm 1 năm)!');
      closeModals();
      fetchContracts();
      fetchStats();
      fetchAllRooms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi gia hạn', 'error');
    }
  };

  const handleTerminate = async () => {
    try {
      await contractService.terminateContract(modalData.id);
      showToast('Đã kết thúc hợp đồng và trả phòng!');
      closeModals();
      fetchContracts();
      fetchStats();
      fetchAllRooms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi kết thúc', 'error');
    }
  };

  const handleExport = async (contract) => {
    try {
      const fileName = `hop_dong_${contract.id}_${contract.tenants[0]?.tenant?.fullName || 'khach'}.docx`;
      await contractService.exportContractWord(contract.id, fileName);
      showToast('Đang tải file hợp đồng...');
    } catch (err) {
      showToast('Lỗi khi xuất file Word', 'error');
    }
  };

  const handleBulkExport = async () => {
    try {
      await contractService.exportContractsBulk(filters);
      showToast('Đang tải danh sách hợp đồng (CSV)...');
    } catch (err) {
      showToast('Lỗi khi xuất danh sách', 'error');
    }
  };

  const openEditModal = (contract) => {
    const mainTenantData = contract.tenants.find(t => t.isMain)?.tenant || contract.tenants[0]?.tenant;
    const additionalTenantsData = contract.tenants.filter(t => !t.isMain).map(ct => ({
      id: ct.tenantId,
      fullName: ct.tenant.fullName,
      cccd: ct.tenant.cccd,
      phoneNumber: ct.tenant.phoneNumber,
      email: ct.tenant.email,
      hometown: ct.tenant.hometown,
      dateOfBirth: ct.tenant.dateOfBirth ? ct.tenant.dateOfBirth.split('T')[0] : '',
      isMain: false
    }));

    const hId = contract.room?.hostelId;
    const filtered = rooms.filter(r => (r.hostelId === Number(hId) || r.hostel?.id === Number(hId)));
    setModalRooms(filtered);

    setModalType('EDIT');
    setModalData({
      id: contract.id,
      hostelId: hId,
      roomId: contract.roomId,
      startDate: contract.startDate.split('T')[0],
      endDate: contract.endDate.split('T')[0],
      deposit: contract.deposit,
      content: contract.content,
      status: contract.status,
      roomNumber: contract.room?.roomNumber,
      hostelName: contract.room?.hostel?.name,
      mainTenant: {
        id: mainTenantData.id,
        fullName: mainTenantData.fullName,
        cccd: mainTenantData.cccd,
        phoneNumber: mainTenantData.phoneNumber,
        email: mainTenantData.email,
        hometown: mainTenantData.hometown,
        dateOfBirth: mainTenantData.dateOfBirth ? mainTenantData.dateOfBirth.split('T')[0] : '',
      },
      additionalTenants: additionalTenantsData
    });
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      'DANG_HIEU_LUC': { label: 'Đang hiệu lực', bg: 'bg-[#c0edd3] text-[#264e3c]' },
      'SAP_HET_HAN': { label: 'Sắp hết hạn', bg: 'bg-[#ffdad7] text-[#7f2928]' },
      'DA_KET_THUC': { label: 'Đã kết thúc', bg: 'bg-[#e1e3e4] text-[#3d4a42]' },
      'DA_HUY': { label: 'Đã hủy', bg: 'bg-[#ffdad6] text-[#ba1a1a]' }
    };
    const config = configs[status] || { label: status, bg: 'bg-gray-100' };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bg}`}>
        {config.label}
      </span>
    );
  };

  const getVNStatus = (status) => {
    const map = { 'TRONG': 'Trống', 'DANG_O': 'Đang ở', 'BAO_TRI': 'Bảo trì' };
    return map[status] || status;
  };

  const defaultContent = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc

HỢP ĐỒNG THUÊ PHÒNG TRỌ

ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG
Bên A đồng ý cho bên B thuê phòng tại địa chỉ Emerald Ledger - T's House. Phòng thuê được trang bị đầy đủ các tiện nghi cơ bản theo danh mục bàn giao đính kèm.

ĐIỀU 2: THỜI HẠN THUÊ
Thời hạn thuê được tính từ ngày ký kết hoặc ngày bàn giao thực tế. Hai bên cam kết tuân thủ đúng thời hạn quy định trên hợp đồng.

ĐIỀU 3: GIÁ THUÊ VÀ ĐẶT CỌC
Bên B phải thanh toán tiền thuê đúng hạn vào ngày 05 hàng tháng. Tiền đặt cọc dùng để đảm bảo thực hiện hợp đồng và sẽ được hoàn trả khi chấm dứt hợp đồng đúng hạn.

ĐIỀU 4: TRÁCH NHIỆM CÁC BÊN
- Bên B không được tự ý sửa đổi cấu trúc phòng.
- Giữ gìn vệ sinh chung và tuân thủ nội quy khu nhà.
- Bên A có trách nhiệm bảo trì hệ thống điện nước định kỳ.

ĐIỀU 5: CHẤM DỨT HỢP ĐỒNG
Mọi hành vi vi phạm pháp luật hoặc nội quy nghiêm trọng sẽ dẫn đến việc chấm dứt hợp đồng đơn phương từ phía Bên A mà không hoàn trả tiền cọc.`;

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 pb-24">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-['Manrope'] font-[800] text-[#191c1d] tracking-tight">Hợp đồng</h1>
          <p className="text-[#6d7a72] mt-1 text-sm">Quản lý các cam kết và thỏa thuận thuê phòng</p>
        </div>
        {hasEditPermission && (
          <button 
            onClick={() => {
              setModalType('ADD');
              setModalData({
                hostelId: hostels[0]?.id || '',
                roomId: '',
                startDate: '',
                endDate: '',
                deposit: '',
                content: defaultContent,
                mainTenant: { fullName: '', cccd: '', phoneNumber: '', email: '', hometown: '', dateOfBirth: '' },
                additionalTenants: []
              });
              if (hostels[0]) {
                const filtered = rooms.filter(r => (r.hostelId === Number(hostels[0].id)) && r.status === 'TRONG');
                setModalRooms(filtered);
              }
            }}
            className="bg-[#006948] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-900/10 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add</span> Lập hợp đồng mới
          </button>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-12 gap-4 mb-8">
        <div className="col-span-12 md:col-span-4 bg-gradient-to-br from-[#006948] to-[#00855d] p-5 rounded-2xl text-white shadow-lg relative overflow-hidden group">
          <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">Hợp đồng hiệu lực</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-['Manrope'] font-[800]">{stats.activeContracts}</h3>
            <div className="mb-1 px-2 py-0.5 bg-white/20 rounded-full text-[8px] font-bold">HOẠT ĐỘNG</div>
          </div>
        </div>
        <div className="col-span-12 md:col-span-8 bg-white p-1 rounded-2xl shadow-sm border border-[#e1e3e4]/50 flex items-center">
          <div className="grid grid-cols-2 w-full divide-x divide-[#f3f4f5]">
            <div className="px-6 py-4">
              <p className="text-[#6d7a72] text-[10px] font-bold uppercase tracking-widest mb-1">Sắp hết hạn</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-['Manrope'] font-[800] text-[#9b3e3b]">{stats.expiringSoon}</span>
                <span className="text-[9px] bg-red-50 text-[#9b3e3b] px-1.5 py-0.5 rounded font-bold">HĐ</span>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-[#6d7a72] text-[10px] font-bold uppercase tracking-widest mb-1">Doanh thu dự kiến</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-['Manrope'] font-[800] text-[#006948]">{stats.expectedRevenue.toLocaleString('vi-VN')}</span>
                <span className="text-xs font-bold text-[#006948]">VNĐ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[24px] shadow-sm border border-[#e1e3e4]/50 overflow-hidden">
        <div className="px-8 py-5 flex justify-between items-center border-b border-[#f3f4f5] bg-white/50">
          <h2 className="font-['Manrope'] font-[800] text-lg text-[#191c1d]">Danh sách hợp đồng</h2>
          <div className="flex gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a72] text-sm">search</span>
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm mã HĐ, tên khách..."
                className="pl-10 pr-4 py-1.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl text-sm w-64 focus:outline-none focus:border-[#006948] transition-all"
              />
            </div>
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`p-1.5 rounded-lg transition-all ${showFilter ? 'bg-[#006948] text-white' : 'text-[#6d7a72] hover:bg-[#f8f9fa]'}`}
            >
              <span className="material-symbols-outlined text-[22px]">filter_list</span>
            </button>
            <button 
              onClick={handleBulkExport}
              className="p-1.5 text-[#6d7a72] hover:bg-[#f8f9fa] rounded-lg"
            >
              <span className="material-symbols-outlined text-[22px]">download</span>
            </button>
          </div>
        </div>

        {showFilter && (
          <div className="px-8 py-3 bg-[#f8f9fa] border-b border-[#e1e3e4]/50 flex gap-4 items-center animate-in slide-in-from-top duration-300">
            <select 
              value={filters.hostelId} 
              onChange={e => setFilters({...filters, hostelId: e.target.value})}
              className="bg-white border border-[#e1e3e4] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#006948]"
            >
              <option value="">Tất cả khu trọ</option>
              {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <select 
              value={filters.status} 
              onChange={e => setFilters({...filters, status: e.target.value})}
              className="bg-white border border-[#e1e3e4] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#006948]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DANG_HIEU_LUC">Đang hiệu lực</option>
              <option value="SAP_HET_HAN">Sắp hết hạn</option>
              <option value="DA_KET_THUC">Đã kết thúc</option>
            </select>
            
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Từ</span>
              <input type="date" value={filters.fromDate} onChange={e=>setFilters({...filters, fromDate:e.target.value})} className="text-xs border border-[#bccac0]/30 rounded-lg px-2 py-1 bg-white outline-none"/>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đến</span>
              <input type="date" value={filters.toDate} onChange={e=>setFilters({...filters, toDate:e.target.value})} className="text-xs border border-[#bccac0]/30 rounded-lg px-2 py-1 bg-white outline-none"/>
            </div>

            <button 
              onClick={() => setFilters({ status: '', hostelId: '', fromDate: '', toDate: '' })}
              className="text-[#006948] text-xs font-bold hover:underline"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}

        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#f8f9fa]/50 text-[#6d7a72] text-[10px] font-bold uppercase tracking-widest">
              <th className="px-8 py-4">Mã HĐ</th>
              <th className="px-8 py-4">Người đại diện</th>
              <th className="px-8 py-4">Khu trọ</th>
              <th className="px-8 py-4">Số phòng</th>
              <th className="px-8 py-4 text-center">Ngày bắt đầu</th>
              <th className="px-8 py-4">Trạng thái</th>
              <th className="px-8 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f5]">
            {contracts.map(contract => {
              const mainTenant = contract.tenants.find(t => t.isMain)?.tenant || contract.tenants[0]?.tenant;
              return (
                <tr key={contract.id} className="hover:bg-[#f8f9fa] transition-colors group">
                  <td className="px-8 py-4">
                    <span className="font-bold text-[#006948] text-sm">HĐ-{contract.id.toString().padStart(4, '0')}</span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#191c1d]">{mainTenant?.fullName || 'Chưa xác định'}</span>
                      <span className="text-[11px] text-[#6d7a72] tracking-wider">{mainTenant?.phoneNumber}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-sm text-[#6d7a72]">{contract.room?.hostel?.name}</td>
                  <td className="px-8 py-4 font-bold text-[#191c1d]">{contract.room?.roomNumber}</td>
                  <td className="px-8 py-4 text-sm text-[#6d7a72] text-center">
                    {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-8 py-4">
                    <StatusBadge status={contract.status} />
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-3 text-slate-400 group-hover:text-slate-600">
                      <button onClick={() => { setModalType('VIEW'); setModalData(contract); }} className="hover:text-[#006948] transition-colors"><span className="material-symbols-outlined text-lg">visibility</span></button>
                      <button onClick={() => openEditModal(contract)} className="hover:text-blue-500 transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
                      {hasEditPermission && <button onClick={() => { setModalType('DELETE'); setModalData(contract); }} className="hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* PHÂN TRANG */}
        <div className="px-8 py-5 flex justify-between items-center border-t border-[#f3f4f5] bg-[#f8f9fa]/30">
          <p className="text-xs text-[#6d7a72]">Hiển thị <b>{contracts.length}</b> trên <b>{totalCount}</b> hợp đồng</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-2 rounded-xl border border-[#e1e3e4] hover:bg-white transition-all disabled:opacity-30">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${page === i + 1 ? 'bg-[#006948] text-white shadow-md shadow-emerald-900/10' : 'border border-[#e1e3e4] hover:bg-white text-[#6d7a72]'}`}>
                {i + 1}
              </button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-2 rounded-xl border border-[#e1e3e4] hover:bg-white transition-all disabled:opacity-30">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: LẬP MỚI / CẬP NHẬT HỢP ĐỒNG */}
      {(modalType === 'ADD' || modalType === 'EDIT') && modalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#191c1d]/30 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="px-8 py-5 border-b border-[#f3f4f5] flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-[800] text-[#191c1d]">{modalType === 'ADD' ? 'Lập hợp đồng mới' : 'Cập nhật hợp đồng'}</h2>
                <p className="text-xs text-[#6d7a72] mt-0.5">Vui lòng điền đầy đủ các thông tin bắt buộc.</p>
              </div>
              <button onClick={closeModals} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-[#f8f9fa] text-[#6d7a72]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* TRÁI: ĐIỀU KHOẢN */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="flex items-center justify-between text-[#006948] font-bold text-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">gavel</span>
                      Nội dung điều lệ hợp đồng
                    </div>
                    <button type="button" onClick={() => setIsEditingContent(!isEditingContent)} className="hover:text-emerald-700">
                      <span className="material-symbols-outlined text-sm">{isEditingContent ? 'check' : 'edit'}</span>
                    </button>
                  </div>
                  {isEditingContent ? (
                    <textarea 
                      value={modalData.content}
                      onChange={e => setModalData({...modalData, content: e.target.value})}
                      className="w-full h-[500px] bg-[#f3f4f5] border border-[#bccac0]/30 rounded-xl p-6 text-[11px] leading-relaxed text-[#3d4a42] focus:outline-none focus:border-[#006948] transition-all resize-none shadow-inner custom-scrollbar"
                    />
                  ) : (
                    <div className="w-full h-[500px] bg-[#f3f4f5] border border-[#bccac0]/30 rounded-xl p-8 text-[11px] leading-relaxed text-[#3d4a42] overflow-y-auto custom-scrollbar">
                      <div className="whitespace-pre-wrap">{modalData.content}</div>
                    </div>
                  )}
                </div>

                {/* PHẢI: FORM */}
                <div className="lg:col-span-8 space-y-10">
                  {/* TRẠNG THÁI (Chỉ khi Sửa) */}
                  {modalType === 'EDIT' && (
                    <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-4">
                        <span className="material-symbols-outlined text-[18px]">rule</span>
                        Trạng thái hợp đồng
                      </div>
                      <select 
                        value={modalData.status} 
                        onChange={e => setModalData({...modalData, status: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-[#006948]"
                      >
                        <option value="DANG_HIEU_LUC">Đang hiệu lực</option>
                        <option value="SAP_HET_HAN">Sắp hết hạn</option>
                        <option value="DA_KET_THUC">Đã kết thúc</option>
                        <option value="DA_HUY">Đã hủy</option>
                      </select>
                    </section>
                  )}

                  {/* NGƯỜI THUÊ CHÍNH */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-2">
                      <div className="flex items-center gap-2 font-bold text-[#191c1d] text-sm">
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        Thông tin người thuê chính
                      </div>
                      <span className="text-[9px] text-red-500 font-bold uppercase">* Bắt buộc</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#6d7a72] ml-1 uppercase">Họ và tên <span className="text-red-500">*</span></label>
                        <input required value={modalData.mainTenant.fullName} onChange={e => setModalData({...modalData, mainTenant: {...modalData.mainTenant, fullName: e.target.value}})} className="w-full px-4 py-2.5 bg-white border border-[#bccac0]/40 rounded-lg text-sm focus:outline-none focus:border-[#006948]" placeholder="Nguyễn Văn A" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#6d7a72] ml-1 uppercase">CCCD <span className="text-red-500">*</span></label>
                        <input required value={modalData.mainTenant.cccd} onChange={e => setModalData({...modalData, mainTenant: {...modalData.mainTenant, cccd: e.target.value}})} className="w-full px-4 py-2.5 bg-white border border-[#bccac0]/40 rounded-lg text-sm focus:outline-none focus:border-[#006948]" placeholder="012345678xxx" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#6d7a72] ml-1 uppercase">Quê quán <span className="text-red-500">*</span></label>
                        <input required value={modalData.mainTenant.hometown} onChange={e => setModalData({...modalData, mainTenant: {...modalData.mainTenant, hometown: e.target.value}})} className="w-full px-4 py-2.5 bg-white border border-[#bccac0]/40 rounded-lg text-sm focus:outline-none focus:border-[#006948]" placeholder="TP. Hồ Chí Minh" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#6d7a72] ml-1 uppercase">Số điện thoại <span className="text-red-500">*</span></label>
                        <input required value={modalData.mainTenant.phoneNumber} onChange={e => setModalData({...modalData, mainTenant: {...modalData.mainTenant, phoneNumber: e.target.value}})} className="w-full px-4 py-2.5 bg-white border border-[#bccac0]/40 rounded-lg text-sm focus:outline-none focus:border-[#006948]" placeholder="090 123 4567" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#6d7a72] ml-1 uppercase">Ngày sinh <span className="text-red-500">*</span></label>
                        <input type="date" required value={modalData.mainTenant.dateOfBirth} onChange={e => setModalData({...modalData, mainTenant: {...modalData.mainTenant, dateOfBirth: e.target.value}})} className="w-full px-4 py-2.5 bg-white border border-[#bccac0]/40 rounded-lg text-sm focus:outline-none focus:border-[#006948]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#6d7a72] ml-1 uppercase">Email <span className="text-red-500">*</span></label>
                        <input type="email" required value={modalData.mainTenant.email} onChange={e => setModalData({...modalData, mainTenant: {...modalData.mainTenant, email: e.target.value}})} className="w-full px-4 py-2.5 bg-white border border-[#bccac0]/40 rounded-lg text-sm focus:outline-none focus:border-[#006948]" placeholder="example@gmail.com" />
                      </div>
                    </div>
                  </section>

                  {/* NGƯỜI THUÊ PHỤ */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-2">
                      <div className="flex items-center gap-2 font-bold text-[#191c1d] text-sm">
                        <span className="material-symbols-outlined text-[18px]">group_add</span>
                        Thông tin người thuê phụ
                      </div>
                      <button 
                        type="button" 
                        onClick={handleAddTenant} 
                        className="px-4 py-1.5 bg-emerald-50 text-[#006948] border border-emerald-200 rounded-full text-[10px] font-extrabold uppercase hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">add</span> Thêm người thuê cùng
                      </button>
                    </div>
                    <div className="space-y-6">
                      {modalData.additionalTenants.map((t, idx) => (
                        <div key={idx} className="p-5 bg-[#f8f9fa] rounded-xl border border-[#bccac0]/20 relative">
                          <button type="button" onClick={() => handleRemoveTenant(idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500">
                            <span className="material-symbols-outlined text-lg">close</span>
                          </button>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#6d7a72] uppercase ml-1">Họ tên</label>
                              <input value={t.fullName} onChange={e => {
                                const newT = [...modalData.additionalTenants];
                                newT[idx].fullName = e.target.value;
                                setModalData({...modalData, additionalTenants: newT});
                              }} className="w-full px-3 py-2 bg-white border border-[#bccac0]/30 rounded-lg text-sm focus:outline-none focus:border-[#006948]" placeholder="Họ và tên" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#6d7a72] uppercase ml-1">CCCD</label>
                              <input value={t.cccd} onChange={e => {
                                const newT = [...modalData.additionalTenants];
                                newT[idx].cccd = e.target.value;
                                setModalData({...modalData, additionalTenants: newT});
                              }} className="w-full px-3 py-2 bg-white border border-[#bccac0]/30 rounded-lg text-sm focus:outline-none focus:border-[#006948]" placeholder="Số CCCD" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#6d7a72] uppercase ml-1">Quê quán</label>
                              <input value={t.hometown} onChange={e => {
                                const newT = [...modalData.additionalTenants];
                                newT[idx].hometown = e.target.value;
                                setModalData({...modalData, additionalTenants: newT});
                              }} className="w-full px-3 py-2 bg-white border border-[#bccac0]/30 rounded-lg text-sm focus:outline-none focus:border-[#006948]" placeholder="Quê quán" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#6d7a72] uppercase ml-1">Số điện thoại</label>
                              <input value={t.phoneNumber} onChange={e => {
                                const newT = [...modalData.additionalTenants];
                                newT[idx].phoneNumber = e.target.value;
                                setModalData({...modalData, additionalTenants: newT});
                              }} className="w-full px-3 py-2 bg-white border border-[#bccac0]/30 rounded-lg text-sm focus:outline-none focus:border-[#006948]" placeholder="Số điện thoại" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#6d7a72] uppercase ml-1">Ngày sinh</label>
                              <input type="date" value={t.dateOfBirth} onChange={e => {
                                const newT = [...modalData.additionalTenants];
                                newT[idx].dateOfBirth = e.target.value;
                                setModalData({...modalData, additionalTenants: newT});
                              }} className="w-full px-3 py-2 bg-white border border-[#bccac0]/30 rounded-lg text-sm focus:outline-none focus:border-[#006948]" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#6d7a72] uppercase ml-1">Email</label>
                              <input type="email" value={t.email} onChange={e => {
                                const newT = [...modalData.additionalTenants];
                                newT[idx].email = e.target.value;
                                setModalData({...modalData, additionalTenants: newT});
                              }} className="w-full px-3 py-2 bg-white border border-[#bccac0]/30 rounded-lg text-sm focus:outline-none focus:border-[#006948]" placeholder="Email" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* PHÒNG & GIÁ */}
                  <section className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-between text-[#006948] font-bold text-sm border-b border-emerald-200 pb-2 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">sell</span>
                        Thông tin phòng & giá
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-800 ml-1 uppercase">Khu trọ</label>
                        <select 
                           required 
                           value={modalData.hostelId} 
                           onChange={e => handleHostelChange(e.target.value, modalType === 'ADD')} 
                           className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-lg text-sm focus:outline-none focus:border-[#006948]"
                        >
                          <option value="">-- Chọn khu trọ --</option>
                          {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-800 ml-1 uppercase">Số phòng</label>
                        <select 
                           required 
                           value={modalData.roomId} 
                           onChange={e => setModalData({...modalData, roomId: e.target.value})} 
                           className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-lg text-sm focus:outline-none focus:border-[#006948]"
                        >
                          <option value="">-- Chọn phòng --</option>
                          {modalRooms.map(r => (
                            <option key={r.id} value={r.id}>
                               Phòng {r.roomNumber} {modalType === 'EDIT' ? `(${getVNStatus(r.status)})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-800 ml-1 uppercase">Tiền đặt cọc</label>
                        <div className="relative">
                           <input type="number" required value={modalData.deposit} onChange={e => setModalData({...modalData, deposit: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-lg text-sm focus:outline-none focus:border-[#006948] font-bold" placeholder="5,000,000" />
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-600">VNĐ</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-800 ml-1 uppercase">Ngày bắt đầu</label>
                        <input type="date" required value={modalData.startDate} onChange={e => setModalData({...modalData, startDate: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-lg text-sm focus:outline-none focus:border-[#006948]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-800 ml-1 uppercase">Ngày kết thúc</label>
                        <input type="date" required value={modalData.endDate} onChange={e => setModalData({...modalData, endDate: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-lg text-sm focus:outline-none focus:border-[#006948]" />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-[#f3f4f5] border-t border-[#bccac0]/20 flex justify-between items-center shrink-0">
              <div className="flex gap-3">
                 {modalType === 'EDIT' && (
                    <>
                      <button 
                        type="button" 
                        onClick={() => setModalType('TERMINATE')} 
                        className="px-6 py-2.5 bg-white text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-50 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">no_meeting_room</span> 
                        Kết thúc hợp đồng
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setModalType('RENEW')} 
                        className="px-6 py-2.5 bg-white text-[#006948] border border-emerald-200 text-sm font-bold rounded-lg hover:bg-emerald-50 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">event_repeat</span> 
                        Gia hạn hợp đồng (+1 năm)
                      </button>
                    </>
                 )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={closeModals} className="px-6 py-2 text-sm font-bold text-[#6d7a72] hover:bg-[#e1e3e4] rounded-lg transition-all">Hủy bỏ</button>
                <button type="submit" onClick={handleContractSubmit} className="px-8 py-2.5 bg-[#006948] text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>save</span> 
                  {modalType === 'ADD' ? 'Lưu & Khởi tạo hợp đồng' : 'Cập nhật thay đổi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: XEM CHI TIẾT */}
      {modalType === 'VIEW' && modalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#191c1d]/30 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-10 py-7 border-b border-[#f3f4f5] flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-[800] text-[#191c1d]">Chi tiết Hợp đồng HĐ-{modalData.id.toString().padStart(4, '0')}</h2>
                <div className="mt-1 flex items-center gap-2">
                   <StatusBadge status={modalData.status} />
                   <span className="text-xs text-[#6d7a72]">Phòng {modalData.room?.roomNumber} - {modalData.room?.hostel?.name}</span>
                </div>
              </div>
              <button onClick={closeModals} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-[#f8f9fa] text-[#6d7a72]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-10 grid grid-cols-2 gap-10 overflow-y-auto max-h-[70vh]">
               <div className="space-y-6">
                  <div>
                    <h4 className="text-[11px] font-bold text-[#6d7a72] uppercase tracking-widest mb-4 border-b pb-2">Người đại diện (Bên B)</h4>
                    <div className="space-y-2">
                       <p className="text-sm"><b>Họ tên:</b> {modalData.tenants.find(t=>t.isMain)?.tenant?.fullName}</p>
                       <p className="text-sm"><b>CCCD:</b> {modalData.tenants.find(t=>t.isMain)?.tenant?.cccd}</p>
                       <p className="text-sm"><b>Số điện thoại:</b> {modalData.tenants.find(t=>t.isMain)?.tenant?.phoneNumber}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-[#6d7a72] uppercase tracking-widest mb-4 border-b pb-2">Thời hạn & Tài chính</h4>
                    <div className="space-y-2">
                       <p className="text-sm"><b>Bắt đầu:</b> {new Date(modalData.startDate).toLocaleDateString('vi-VN')}</p>
                       <p className="text-sm"><b>Kết thúc:</b> {new Date(modalData.endDate).toLocaleDateString('vi-VN')}</p>
                       <p className="text-sm text-emerald-700"><b>Giá thuê:</b> {modalData.room?.price?.toLocaleString()}đ / tháng</p>
                       <p className="text-sm text-orange-700"><b>Tiền cọc:</b> {modalData.deposit?.toLocaleString()}đ</p>
                    </div>
                  </div>
               </div>
               <div className="bg-[#f8f9fa] p-6 rounded-2xl border border-[#bccac0]/20">
                  <h4 className="text-[11px] font-bold text-[#6d7a72] uppercase tracking-widest mb-4">Nội dung điều khoản</h4>
                  <div className="text-[11px] text-[#3d4a42] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {modalData.content}
                  </div>
               </div>
            </div>

            <div className="px-10 py-8 bg-[#f3f4f5] border-t border-[#f3f4f5] flex justify-between items-center">
               <button 
                  onClick={() => handleExport(modalData)}
                  className="flex items-center gap-2 text-[#006948] font-bold text-sm hover:underline"
               >
                  <span className="material-symbols-outlined text-[18px]">download</span> TẢI FILE WORD (.DOCX)
               </button>
               <div className="flex gap-3">
                  <button onClick={closeModals} className="px-6 py-2.5 text-sm font-bold text-[#6d7a72] hover:bg-[#e1e3e4] rounded-xl transition-all">Đóng</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {modalType === 'RENEW' && modalData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#191c1d]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-[400px] p-10 text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[32px]">event_repeat</span>
            </div>
            <h3 className="text-xl font-[800] text-[#191c1d] mb-2">Gia hạn hợp đồng?</h3>
            <p className="text-[#6d7a72] mb-8 text-sm">Hệ thống sẽ cộng thêm <b>01 năm</b> và tự động cập nhật thông tin phòng/khách thuê theo nội dung hiện tại. Bạn có chắc chắn?</p>
            <div className="flex gap-3">
              <button onClick={() => setModalType('EDIT')} className="flex-1 py-3 text-[#6d7a72] font-bold bg-[#f8f9fa] rounded-xl">Huỷ</button>
              <button onClick={handleRenew} className="flex-1 py-3 text-white font-bold bg-[#006948] rounded-xl shadow-lg">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'TERMINATE' && modalData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#191c1d]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-[400px] p-10 text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[32px]">no_meeting_room</span>
            </div>
            <h3 className="text-xl font-[800] text-[#191c1d] mb-2">Kết thúc hợp đồng?</h3>
            <p className="text-[#6d7a72] mb-8 text-sm">Phòng <b>{modalData.roomNumber || modalData.room?.roomNumber}</b> sẽ chuyển về trạng thái <b>Trống</b>. Khách thuê sẽ chuyển sang <b>Ngừng thuê</b>.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalType('EDIT')} className="flex-1 py-3 text-[#6d7a72] font-bold bg-[#f8f9fa] rounded-xl">Huỷ</button>
              <button onClick={handleTerminate} className="flex-1 py-3 text-white font-bold bg-orange-600 rounded-xl shadow-lg">Kết thúc ngay</button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'DELETE' && modalData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#191c1d]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-[450px] p-10 text-center relative overflow-hidden animate-in zoom-in duration-200">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <h3 className="text-2xl font-['Manrope'] font-[800] text-[#191c1d] mb-3">Xác nhận xoá?</h3>
            <p className="text-[#6d7a72] mb-10 text-sm leading-relaxed px-4">
              Hành động này sẽ xoá vĩnh viễn hợp đồng của <b className="text-[#191c1d]">{modalData.mainTenant.fullName}</b> tại phòng <b className="text-[#191c1d]">{modalData.roomNumber || modalData.room?.roomNumber}</b>.
            </p>
            <div className="flex gap-4">
              <button onClick={closeModals} className="flex-1 py-4 bg-[#f8f9fa] text-[#6d7a72] font-bold rounded-2xl hover:bg-[#e1e3e4] transition-all">Huỷ</button>
              <button onClick={handleDelete} className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">Xoá ngay</button>
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

export default HopDongPage;
