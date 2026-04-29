import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import { AuthContext } from '../../../contexts/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginSuccess } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if(!username || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Số điện thoại và Mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { username, password });
      const { requirePasswordChange, tempToken, accessToken, user, message } = res.data.data;
      
      if (requirePasswordChange) {
        localStorage.setItem('temp_token', tempToken);
        navigate('/change-password', { state: { message } });
      } else {
        loginSuccess(user, accessToken);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Mất kết nối đến máy chủ. Vui lòng thử lại sau.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#ecfdf5] text-[#191c1d] min-h-screen flex flex-col justify-between font-['Inter'] overflow-x-hidden">
      <header className="p-8 w-full shrink-0">
        <div className="text-[22px] font-[800] tracking-tight text-[#059669] font-['Manrope']">
          T's House
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 -mt-12">
        <div className="w-full max-w-[420px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.03)] rounded-[24px] p-10 md:p-12 relative overflow-hidden">
          
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 mb-5 flex items-center justify-center rounded-[18px] bg-[#d1fae5]">
              <span className="material-symbols-outlined text-[#059669] text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                home_work
              </span>
            </div>
            <h1 className="text-[30px] font-[800] tracking-tight text-[#191c1d] text-center font-['Manrope'] leading-[1.2] mb-2">
              T's House Management
            </h1>
            <p className="text-[#6d7a72] text-[10px] font-[700] tracking-[0.2em] uppercase text-center">
              Cổng thông tin quản lý
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-[10px] text-center font-medium border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-7">
            <div className="space-y-2">
              <label className="block text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">
                Tên đăng nhập
              </label>
              <input 
                className="w-full h-[52px] px-5 bg-white border border-[#e1e3e4] rounded-[10px] text-[#191c1d] placeholder:text-[#bccac0] focus:outline-none focus:ring-4 focus:ring-[#059669]/5 focus:border-[#059669] transition-all"
                placeholder="Nhập số điện thoại" 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-[700] tracking-[0.1em] text-[#6d7a72] uppercase ml-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input 
                  className="w-full h-[52px] px-5 bg-white border border-[#e1e3e4] rounded-[10px] text-[#191c1d] placeholder:text-[#bccac0] focus:outline-none focus:ring-4 focus:ring-[#059669]/5 focus:border-[#059669] transition-all pr-12"
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#bccac0] hover:text-[#059669]"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button 
              className="w-full h-[54px] bg-[#059669] hover:bg-[#047857] text-white font-[700] text-[15px] tracking-widest rounded-[10px] transition-all shadow-md shadow-[#059669]/10 mt-4 uppercase disabled:opacity-70 disabled:cursor-not-allowed" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-10 flex flex-col items-center gap-4 shrink-0">
        <div className="flex gap-8">
          {["Privacy Policy", "Terms of Service", "Contact Support"].map((item) => (
            <a key={item} className="text-[10px] font-[600] tracking-[0.15em] text-[#6d7a72] hover:text-[#059669] transition-colors uppercase" href="#">
              {item}
            </a>
          ))}
        </div>
        <p className="text-[10px] font-[600] tracking-[0.15em] text-[#6d7a72]/60 uppercase">
          © 2024 T's House Property Management
        </p>
      </footer>
    </div>
  );
};

export default LoginPage;
