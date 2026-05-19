import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Khôi phục phiên làm việc (nếu refresh trang)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const loginSuccess = (userData, accessToken) => {
    let finalUserData = { ...userData };
    if (finalUserData.permissions && typeof finalUserData.permissions === 'string') {
      try {
        finalUserData.permissions = JSON.parse(finalUserData.permissions);
      } catch (e) {
        finalUserData.permissions = {};
      }
    }
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(finalUserData));
    localStorage.removeItem('temp_token'); // Xóa token tạm (nếu có dùng ở bước trước)
    setUser(finalUserData);
    navigate('/dashboard'); // Chuyển hướng thành công
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('temp_token');
    setUser(null);
    navigate('/login');
  };

  const hasPermission = (moduleId, action) => {
    if (!user) return false;
    // Quản trị viên luôn có toàn quyền
    if (user.role === 'CHU_TRO') return true;
    // Quản lý có toàn quyền trong module Báo cáo
    if (user.role === 'MANAGER' && moduleId === 'bao_cao') return true;
    
    return user.permissions?.[moduleId]?.[action] === true;
  };

  return (
    <AuthContext.Provider value={{ user, loginSuccess, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};
