import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import { AuthContext } from '../../../contexts/AuthContext';

const ChangePasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginSuccess } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/change-password', { newPassword });
      const { accessToken, user } = res.data.data;
      
      // Thành công -> Login
      loginSuccess(user, accessToken);
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật mật khẩu.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8f7f2] flex flex-col justify-center items-center font-sans tracking-wide p-4 relative">
      {/* Cùng style với LoginPage */}
      <div className="absolute top-6 left-8 text-emerald-800 font-bold text-xl drop-shadow-sm">
        T's House
      </div>

      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-[420px] z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-[#c1ebd4] rounded-xl flex items-center justify-center mb-6 shadow-inner">
           <svg className="w-8 h-8 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
           </svg>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Đổi Mật Khẩu</h1>
        <p className="text-[11px] text-slate-500 font-bold tracking-[0.1em] uppercase mb-8 text-center px-4 leading-relaxed">
          {location.state?.message || 'Tài khoản của bạn yêu cầu cập nhật mật khẩu để đảm bảo an toàn.'}
        </p>

        {errorMsg && (
          <div className="w-full bg-red-100/80 text-red-700 text-sm p-3 rounded border border-red-200 mb-6 text-center shadow-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="w-full">
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-slate-500 mb-2 tracking-wider uppercase">Mật khẩu mới</label>
            <input 
              type="password" 
              placeholder="Nhập mật khẩu (Tối thiểu 6 ký tự)" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] placeholder-slate-300 transition-colors"
            />
          </div>

          <div className="mb-8">
             <label className="block text-[11px] font-bold text-slate-500 mb-2 tracking-wider uppercase">Xác nhận mật khẩu</label>
             <input 
               type="password" 
               placeholder="Nhập lại mật khẩu" 
               value={confirmPassword}
               onChange={(e) => setConfirmPassword(e.target.value)}
               className="w-full px-4 py-3 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] placeholder-slate-300 transition-colors"
             />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold py-3.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-700 transition-colors disabled:opacity-75 tracking-wide text-sm uppercase"
          >
            {loading ? 'Đang Xử Lý...' : 'Cập Nhật Mật Khẩu'}
          </button>
        </form>
      </div>
      
    </div>
  );
};

export default ChangePasswordPage;
