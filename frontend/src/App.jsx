import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import LoginPage from './features/auth/pages/LoginPage';
import ChangePasswordPage from './features/auth/pages/ChangePasswordPage';
import MainLayout from './layouts/MainLayout';
import KhuPhongTroPage from './features/dashboard/pages/KhuPhongTroPage';
import KhachThuePage from './features/dashboard/pages/KhachThuePage';
import HopDongPage from './features/dashboard/pages/HopDongPage';
import DichVuKhacPage from './features/services/pages/DichVuKhacPage';
import QuanLyDienPage from './features/services/pages/QuanLyDienPage';
import InvoicePage from './features/services/pages/InvoicePage';
import UserPage from './features/dashboard/pages/UserPage';
import ReportPage from './features/dashboard/pages/ReportPage';

// Trang placeholder cho các module chưa làm
const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <span className="material-symbols-outlined text-6xl text-[#006948]/20" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
    <h2 className="font-['Manrope'] text-2xl font-[800] text-[#191c1d]">{title}</h2>
    <p className="text-[#6d7a72] text-sm">Module này đang được phát triển...</p>
  </div>
);

// Bọc bảo vệ route: Nếu chưa đăng nhập → về trang login
const ProtectedRoute = () => {
  const { user } = useContext(AuthContext);
  if (!user && !localStorage.getItem('access_token')) {
    return <Navigate to="/login" replace />;
  }
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* Protected routes — tất cả bọc trong MainLayout */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/rooms" replace />} />
        <Route path="/dashboard" element={<Navigate to="/rooms" replace />} />
        <Route path="/rooms" element={<KhuPhongTroPage />} />
        <Route path="/tenants" element={<KhachThuePage />} />
        <Route path="/contracts" element={<HopDongPage />} />
        <Route path="/services">
          <Route index element={<Navigate to="dien" replace />} />
          <Route path="dien" element={<QuanLyDienPage />} />
          <Route path="khac" element={<DichVuKhacPage />} />
        </Route>
        <Route path="/invoices" element={<InvoicePage />} />
        <Route path="/users" element={<UserPage />} />
        <Route path="/reports" element={<ReportPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/rooms" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
