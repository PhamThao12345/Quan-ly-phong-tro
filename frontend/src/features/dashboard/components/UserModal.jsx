import React, { useState, useEffect } from 'react';
import userService from '../../../services/user.service';

const MODULES = [
  { id: 'khu_phong', name: 'Quản lý Khu & Phòng trọ' },
  { id: 'khach_thue', name: 'Quản lý Khách thuê' },
  { id: 'hop_dong', name: 'Quản lý Hợp đồng' },
  { id: 'chi_so_dien', name: 'Quản lý Chỉ số điện' },
  { id: 'dich_vu_khac', name: 'Quản lý Dịch vụ khác' },
  { id: 'hoa_don', name: 'Quản lý Hóa đơn' },
  { id: 'nguoi_dung', name: 'Quản lý Người dùng' },
  { id: 'bao_cao', name: 'Quản lý Báo cáo' }
];

const UserModal = ({ isOpen, onClose, onSuccess, initialData, isView }) => {
  const [formData, setFormData] = useState({
    role: 'STAFF',
    fullName: '',
    phoneNumber: '',
    email: '',
    username: '',
    employeeCode: ''
  });
  
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        role: initialData.role || 'STAFF',
        fullName: initialData.fullName || '',
        phoneNumber: initialData.phoneNumber || '',
        email: initialData.email || '',
        username: initialData.username || '',
        employeeCode: initialData.employeeCode || ''
      });
      if (initialData.permissions) {
        try {
          const perms = typeof initialData.permissions === 'string' 
            ? JSON.parse(initialData.permissions) 
            : initialData.permissions;
          setPermissions(perms || {});
        } catch (e) {
          console.error('Error parsing permissions:', e);
          setPermissions({});
        }
      }
    } else {
      // Default empty state
      setFormData({
        role: 'STAFF',
        fullName: '',
        phoneNumber: '',
        email: '',
        username: '',
        employeeCode: ''
      });
      setPermissions({});
    }
  }, [initialData]);

  const handleRoleChange = (role) => {
    setFormData({ ...formData, role });
    if (role === 'CHU_TRO') {
      // Auto tick all
      const allPerms = {};
      MODULES.forEach(m => {
        allPerms[m.id] = { view: true, edit: true, delete: true };
      });
      setPermissions(allPerms);
    } else {
      // Clear all
      setPermissions({});
    }
  };

  const handlePermissionChange = (moduleId, action, checked) => {
    setPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || {}),
        [action]: checked
      }
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Tên đăng nhập là bắt buộc';
    if (!formData.email) newErrors.email = 'Email là bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        permissions
      };

      if (initialData) {
        await userService.updateUser(initialData.id, payload);
        showToast('Cập nhật người dùng thành công');
      } else {
        await userService.createUser(payload);
        showToast('Thêm người dùng thành công');
      }
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi lưu người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!initialData) return;
    setResetLoading(true);
    try {
      await userService.resetPassword(initialData.id);
      showToast('Đã cấp lại mật khẩu và gửi qua email');
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi reset mật khẩu', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#191c1d]/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-2xl shadow-2xl overflow-hidden transform transition-all border border-white/20 rounded-[1.25rem] flex flex-col max-h-[90vh]">
        <div className="bg-[#006948]/5 p-6 border-b border-[#006948]/10 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-headline font-extrabold tracking-tight text-[#191c1d]">
                {isView ? 'Chi tiết người dùng' : initialData ? 'Cập nhật thông tin người dùng' : 'Thêm người dùng mới'}
              </h3>
              <p className="text-[#6d7a72] text-sm mt-1">
                {isView ? 'Xem chi tiết thông tin và quyền hạn của tài khoản.' : initialData ? 'Chỉnh sửa thông tin và phân quyền cho tài khoản.' : 'Cấp tài khoản và thiết lập quyền hạn cho thành viên mới.'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto no-scrollbar flex-1">
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="col-span-2 mb-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6d7a72] mb-3 ml-1">Vị trí</label>
              <div className="flex gap-4">
                <label className="flex-1 relative cursor-pointer group">
                  <input 
                    type="radio" 
                    name="role" 
                    value="MANAGER" 
                    disabled={isView || (initialData && initialData.role === 'CHU_TRO')}
                    checked={formData.role === 'MANAGER' || formData.role === 'CHU_TRO'} // Nếu là CHU_TRO thì tick tạm vào Quản trị viên nhưng bị disable
                    onChange={() => handleRoleChange('MANAGER')}
                    className="peer sr-only" 
                  />
                  <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#f8f9fa] border-2 border-transparent ${!(isView || (initialData && initialData.role === 'CHU_TRO')) && 'peer-checked:border-[#006948] peer-checked:bg-[#006948]/5'} ${(isView || (initialData && initialData.role === 'CHU_TRO')) && (formData.role === 'MANAGER' || formData.role === 'CHU_TRO') ? 'border-[#006948] bg-[#006948]/5' : ''} transition-all`}>
                    <span className={`material-symbols-outlined text-slate-300 ${(formData.role === 'MANAGER' || formData.role === 'CHU_TRO') ? 'text-[#006948]' : ''} transition-colors`} style={{ fontVariationSettings: (formData.role === 'MANAGER' || formData.role === 'CHU_TRO') ? "'FILL' 1" : "'FILL' 0" }}>
                      {(formData.role === 'MANAGER' || formData.role === 'CHU_TRO') ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    <span className="text-sm font-bold text-[#191c1d]">{formData.role === 'CHU_TRO' ? 'Chủ trọ (Mặc định)' : 'Quản trị viên'}</span>
                  </div>
                </label>
                <label className="flex-1 relative cursor-pointer group">
                  <input 
                    type="radio" 
                    name="role" 
                    value="STAFF" 
                    disabled={isView || (initialData && initialData.role === 'CHU_TRO')}
                    checked={formData.role === 'STAFF'}
                    onChange={() => handleRoleChange('STAFF')}
                    className="peer sr-only" 
                  />
                  <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#f8f9fa] border-2 border-transparent ${!(isView || (initialData && initialData.role === 'CHU_TRO')) && 'peer-checked:border-[#006948] peer-checked:bg-[#006948]/5'} ${(isView || (initialData && initialData.role === 'CHU_TRO')) && formData.role === 'STAFF' ? 'border-[#006948] bg-[#006948]/5' : ''} transition-all`}>
                    <span className={`material-symbols-outlined text-slate-300 ${formData.role === 'STAFF' ? 'text-[#006948]' : ''} transition-colors`} style={{ fontVariationSettings: formData.role === 'STAFF' ? "'FILL' 1" : "'FILL' 0" }}>
                      {formData.role === 'STAFF' ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    <span className="text-sm font-bold text-[#191c1d]">Nhân viên</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6d7a72] mb-2 ml-1">TÊN ĐĂNG NHẬP <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                disabled={!!initialData || isView} // Không cho đổi username khi edit
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className={`w-full bg-[#f8f9fa] border ${errors.username ? 'border-red-500' : 'border-transparent'} rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#006948]/20 focus:border-[#006948] outline-none transition-all ${initialData || isView ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Viết liền không dấu" 
              />
              {errors.username && <p className="text-red-500 text-xs mt-1 ml-1">{errors.username}</p>}
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6d7a72] mb-2 ml-1">MÃ NHÂN VIÊN</label>
              <input 
                type="text" 
                disabled={isView}
                value={formData.employeeCode}
                onChange={e => setFormData({...formData, employeeCode: e.target.value})}
                className={`w-full bg-[#f8f9fa] border-transparent rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#006948]/20 focus:border-[#006948] outline-none transition-all ${isView ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Ví dụ: NV001 (để trống tự sinh)" 
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6d7a72] mb-2 ml-1">HỌ VÀ TÊN</label>
              <input 
                type="text" 
                disabled={isView}
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className={`w-full bg-[#f8f9fa] border-transparent rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#006948]/20 focus:border-[#006948] outline-none transition-all ${isView ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Nhập tên nhân viên" 
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6d7a72] mb-2 ml-1">SỐ ĐIỆN THOẠI <span className="text-red-500">*</span></label>
              <input 
                type="tel" 
                disabled={isView}
                value={formData.phoneNumber}
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                className={`w-full bg-[#f8f9fa] border ${errors.phoneNumber ? 'border-red-500' : 'border-transparent'} rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#006948]/20 focus:border-[#006948] outline-none transition-all ${isView ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="090..." 
              />
              {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phoneNumber}</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6d7a72] mb-2 ml-1">EMAIL <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                disabled={isView}
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className={`w-full bg-[#f8f9fa] border ${errors.email ? 'border-red-500' : 'border-transparent'} rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#006948]/20 focus:border-[#006948] outline-none transition-all ${isView ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="example@tshouse.vn" 
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[1px] flex-1 bg-slate-100"></div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#006948]">Phân quyền hệ thống</h4>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] text-[10px] uppercase tracking-widest text-[#6d7a72] font-bold border-b border-slate-100">
                    <th className="py-4 px-6">Phân hệ</th>
                    <th className="py-4 px-4 text-center">Xem</th>
                    <th className="py-4 px-4 text-center">Thêm/Sửa</th>
                    <th className="py-4 px-4 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {MODULES.map(module => (
                    <tr key={module.id} className="group hover:bg-[#006948]/5 transition-colors">
                      <td className="py-4 px-6 text-sm font-semibold text-[#191c1d]">{module.name}</td>
                      {['view', 'edit', 'delete'].map(action => (
                        <td key={action} className="py-4 px-4 text-center">
                          <input 
                            type="checkbox" 
                            disabled={isView}
                            checked={permissions[module.id]?.[action] || false}
                            onChange={(e) => handlePermissionChange(module.id, action, e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-[#006948] focus:ring-[#006948] focus:ring-offset-0 cursor-pointer disabled:opacity-50" 
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 bg-[#f8f9fa] flex justify-between items-center border-t border-[#e1e3e4] flex-shrink-0">
          <div>
            {initialData && !isView && (
              <button 
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="flex items-center gap-2 px-4 py-2 text-[#006948] font-bold text-sm bg-[#006948]/10 hover:bg-[#006948]/20 rounded-xl transition-all disabled:opacity-50"
              >
                {resetLoading ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                )}
                Cấp lại tài khoản
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 text-[#3d4a42] text-sm font-bold rounded-xl hover:bg-[#e1e3e4] transition-all">
              {isView ? 'Đóng' : 'Hủy bỏ'}
            </button>
            {!isView && (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-2.5 bg-[#006948] text-white text-sm font-bold rounded-xl hover:bg-[#00855d] shadow-md shadow-emerald-900/10 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading && <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>}
                Hoàn tất
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white font-medium text-sm z-[100] animate-in slide-in-from-bottom-5 ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-[#006948]'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default UserModal;
