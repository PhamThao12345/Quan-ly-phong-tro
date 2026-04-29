import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import userService from '../../../services/user.service';
import UserModal from '../components/UserModal';
import ActivityHistoryDrawer from '../components/ActivityHistoryDrawer';
import { useNavigate } from 'react-router-dom';

const UserPage = () => {
  const { user, hasPermission } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const canView = hasPermission('nguoi_dung', 'view');
  const canEdit = hasPermission('nguoi_dung', 'edit');
  const canDelete = hasPermission('nguoi_dung', 'delete');

  useEffect(() => {
    if (user && !canView) {
      navigate('/dashboard'); // Chặn truy cập nếu không có quyền
      return;
    }
    if (user) fetchUsers();
  }, [user, canView]);

  const fetchUsers = async () => {
    try {
      const res = await userService.getAllUsers();
      setUsers(res.data.data);
    } catch (e) {
      showToast('Lỗi khi tải danh sách người dùng', 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    const searchLower = (filters.search || '').toLowerCase();
    const matchSearch = 
      (u.fullName || '').toLowerCase().includes(searchLower) ||
      (u.email || '').toLowerCase().includes(searchLower) ||
      (u.phoneNumber || '').toLowerCase().includes(searchLower) ||
      (u.employeeCode || '').toLowerCase().includes(searchLower);
    
    const matchRole = filters.role ? u.role === filters.role : true;
    const matchStatus = filters.status ? u.status === filters.status : true;

    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;

  const exportToExcel = () => {
    if (filteredUsers.length === 0) return showToast('Không có dữ liệu để xuất', 'error');
    import('xlsx').then(XLSX => {
      const data = filteredUsers.map(u => ({
        'Mã NV': u.employeeCode,
        'Họ và tên': u.fullName,
        'Số điện thoại': u.phoneNumber,
        'Email': u.email,
        'CCCD': u.cccd,
        'Quyền hạn': u.role === 'ADMIN' || u.role === 'CHU_TRO' ? 'Quản trị viên' : 'Nhân viên',
        'Trạng thái': u.status === 'ACTIVE' ? 'Đang hoạt động' : u.status === 'INACTIVE' ? 'Chưa kích hoạt' : 'Bị khóa'
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "NguoiDung");
      XLSX.writeFile(wb, `Danh_sach_nguoi_dung_${Date.now()}.xlsx`);
    });
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await userService.deleteUser(deletingUser.id);
      showToast('Đã xóa người dùng');
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (e) {
      showToast(e.response?.data?.message || 'Lỗi khi xóa người dùng', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-12 pb-12 pt-8">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-extrabold font-headline tracking-tight text-[#191c1d] mb-1">Người dùng</h2>
          <p className="text-[#3d4a42] font-body text-sm">Quản lý đội ngũ và phân quyền hệ thống</p>
        </div>
        <div className="flex gap-3">
          {canView && (
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#e7e8e9] text-[#006948] font-medium rounded-lg hover:bg-emerald-50 transition-all font-body text-sm"
            >
              <span className="material-symbols-outlined text-lg">history</span>
              Lịch sử hoạt động
            </button>
          )}
          {canEdit && (
            <button 
              onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#006948] text-white font-bold rounded-lg hover:bg-[#00855d] transition-all font-body text-sm shadow-md shadow-[#006948]/10 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Thêm người dùng
            </button>
          )}
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-emerald-600">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2 rounded-lg">groups</span>
            <span className="text-xs font-semibold text-emerald-600">+1 tháng này</span>
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1 font-body">Tổng nhân sự</p>
          <p className="text-3xl font-bold font-headline">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#bccac0]/10">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2 rounded-lg">task_alt</span>
            <span className="text-xs font-semibold text-slate-400">{users.length ? Math.round((activeUsers / users.length) * 100) : 0}% sẵn sàng</span>
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1 font-body">Đang hoạt động</p>
          <p className="text-3xl font-bold font-headline">{activeUsers}</p>
        </div>
        <div className="relative overflow-hidden bg-[#006948] p-6 rounded-xl shadow-lg shadow-[#006948]/10 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-white/80">trending_up</span>
            </div>
            <p className="text-white/70 text-sm font-medium mb-1 font-body">Hiệu suất vận hành</p>
            <p className="text-3xl font-extrabold font-headline">94%</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-9xl" style={{ fontSize: '8rem' }}>analytics</span>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#bccac0]/20">
        <div className="px-6 py-4 border-b border-[#bccac0]/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#191c1d]">Danh sách người dùng</h3>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                value={filters.search}
                onChange={e => { setFilters({...filters, search: e.target.value}); setPage(1); }}
                placeholder="Tìm kiếm người dùng..." 
                className="w-full pl-10 pr-4 py-1.5 bg-[#f8f9fa] border border-[#bccac0]/30 rounded-lg text-sm focus:ring-2 focus:ring-[#006948]/20 outline-none"
              />
            </div>
            <button onClick={() => setShowFilter(!showFilter)} className="p-2 text-[#6d7a72] hover:bg-[#f8f9fa] rounded-lg transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button onClick={exportToExcel} className="p-2 text-[#6d7a72] hover:bg-[#f8f9fa] rounded-lg transition-colors">
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>

        {/* Filter Row */}
        {showFilter && (
          <div className="px-6 py-3 bg-[#f8f9fa] border-b border-[#bccac0]/10 flex gap-3 flex-wrap items-center">
            <select 
              value={filters.role || ''} 
              onChange={e => { setFilters({...filters, role: e.target.value}); setPage(1); }} 
              className="text-xs border border-[#bccac0]/30 rounded-lg px-3 py-1.5 bg-white outline-none"
            >
              <option value="">Tất cả vị trí</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="STAFF">Nhân viên</option>
            </select>
            <select 
              value={filters.status || ''} 
              onChange={e => { setFilters({...filters, status: e.target.value}); setPage(1); }} 
              className="text-xs border border-[#bccac0]/30 rounded-lg px-3 py-1.5 bg-white outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Chưa kích hoạt</option>
            </select>
            <button 
              onClick={() => { setFilters({ search: '', role: '', status: '' }); setPage(1); }} 
              className="text-xs text-[#006948] font-bold hover:underline ml-auto"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body">
            <thead className="bg-[#f8f9fa] border-b border-[#bccac0]/20">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24">Mã NV</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Họ và tên</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Số điện thoại</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">VỊ TRÍ</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8f9fa]">
              {paginatedUsers.map(u => (
                <tr key={u.id} className="hover:bg-[#f8f9fa] transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">{u.employeeCode}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800 whitespace-nowrap">{u.fullName || 'Chưa cập nhật'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{u.phoneNumber || '---'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {u.role === 'CHU_TRO' ? (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-md tracking-wider">Chủ trọ</span>
                    ) : u.role === 'MANAGER' ? (
                      <span className="px-2.5 py-1 bg-[#85f8c4]/30 text-[#006948] text-[10px] font-bold uppercase rounded-md tracking-wider">Quản trị viên</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-[#c0edd3] text-[#446d58] text-[10px] font-bold uppercase rounded-md tracking-wider">Nhân viên</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex gap-2 justify-end text-slate-500">
                      <button 
                        onClick={() => { setEditingUser({...u, isView: true}); setIsModalOpen(true); }}
                        className="hover:text-[#006948] transition-colors" title="Xem chi tiết"
                      ><span className="material-symbols-outlined text-lg">visibility</span></button>
                      
                      {/* Chỉ cho phép sửa/xóa nếu có quyền và không phải là sửa chính CHU_TRO bởi người khác */}
                      {(user?.role === 'CHU_TRO' || u.role !== 'CHU_TRO') && (
                        <>
                          {canEdit && (
                            <button 
                              onClick={() => { setEditingUser({...u, isView: false}); setIsModalOpen(true); }}
                              className="hover:text-[#006948] transition-colors" title="Chỉnh sửa"
                            ><span className="material-symbols-outlined text-lg">edit</span></button>
                          )}
                          {canDelete && (
                            <button 
                              onClick={() => { setDeletingUser(u); setIsDeleteModalOpen(true); }}
                              className="hover:text-red-500 transition-colors" title="Xóa"
                            ><span className="material-symbols-outlined text-lg">delete</span></button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-[#6d7a72]">
                    <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">group_off</span>
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-[#f8f9fa] flex items-center justify-between border-t border-[#bccac0]/10">
          <p className="text-xs text-slate-500">Hiển thị <b className="text-[#191c1d]">{paginatedUsers.length}</b> trên <b className="text-[#191c1d]">{filteredUsers.length}</b> người dùng</p>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 text-slate-400 hover:text-[#006948] disabled:opacity-30">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#006948] text-white text-xs font-bold">{page}</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 text-slate-400 hover:text-[#006948] disabled:opacity-30">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <UserModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchUsers}
          initialData={editingUser}
          isView={editingUser?.isView}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-red-600 text-2xl">warning</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Xóa người dùng?</h3>
                <p className="text-sm text-slate-500 mt-1">Hành động này không thể hoàn tác.</p>
              </div>
            </div>
            <p className="text-slate-600 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{deletingUser?.fullName} ({deletingUser?.username})</strong> không? 
              Tài khoản này sẽ bị thu hồi toàn bộ quyền truy cập.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-8 right-8 px-8 py-5 rounded-[20px] shadow-2xl font-bold text-sm z-[200] flex items-center gap-3 border animate-in slide-in-from-right duration-500 ${toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-red-600 text-white border-red-400'}`}>
          <span className="material-symbols-outlined">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
          {toast.message}
        </div>
      )}

      <ActivityHistoryDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        isAdmin={user?.role === 'CHU_TRO'}
      />
    </div>
  );
};
export default UserPage;
