import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, hasPermission } = useContext(AuthContext);
    const [isServicesExpanded, setIsServicesExpanded] = useState(location.pathname.startsWith('/services'));

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const checkViewPerm = (moduleId) => hasPermission(moduleId, 'view');

    const menuItems = [];
    if (checkViewPerm('khu_phong')) menuItems.push({ path: '/rooms', icon: 'door_front', label: 'Khu & Phòng trọ' });
    if (checkViewPerm('khach_thue')) menuItems.push({ path: '/tenants', icon: 'group', label: 'Khách thuê' });
    if (checkViewPerm('hop_dong')) menuItems.push({ path: '/contracts', icon: 'description', label: 'Hợp đồng' });

    const bottomItems = [];
    if (checkViewPerm('hoa_don')) bottomItems.push({ path: '/invoices', icon: 'receipt_long', label: 'Hóa đơn' });
    if (checkViewPerm('nguoi_dung')) bottomItems.push({ path: '/users', icon: 'badge', label: 'Người dùng' });
    if (checkViewPerm('bao_cao')) bottomItems.push({ path: '/reports', icon: 'analytics', label: 'Báo cáo' });

    const showServices = checkViewPerm('chi_so_dien') || checkViewPerm('dich_vu_khac');

    const NavLink = ({ item }) => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        return (
            <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                        ? 'bg-emerald-100/50 text-emerald-700 font-bold shadow-sm'
                        : 'text-slate-700 hover:bg-emerald-100/50 hover:text-emerald-700'
                }`}
            >
                <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                    {item.icon}
                </span>
                <span className="text-[14px] font-medium">{item.label}</span>
            </Link>
        );
    };

    return (
        <aside className="flex flex-col fixed left-0 top-0 h-full py-8 bg-emerald-50 w-64 border-r border-emerald-100/30 z-50 overflow-y-auto">
            {/* Logo Section */}
            <div className="mb-10 px-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#006948] rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/20 shrink-0">
                    <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>home_work</span>
                </div>
                <div>
                    <h1 className="text-[#006948] font-bold text-[18px] leading-tight tracking-tight font-['Manrope']">T's House</h1>
                    <p className="text-[#006948] text-[8px] font-bold tracking-[0.2em] uppercase opacity-70 leading-none">Modern Concierge</p>
                </div>
            </div>

            {/* Navigation Modules */}
            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map(item => (
                    <NavLink key={item.path} item={item} />
                ))}

                {/* Expanded Dịch vụ module */}
                {showServices && (
                    <div className="space-y-1">
                        <button 
                            onClick={() => setIsServicesExpanded(!isServicesExpanded)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors group ${
                                location.pathname.startsWith('/services') 
                                ? 'text-emerald-700 font-bold bg-emerald-100/50' 
                                : 'text-slate-700 hover:bg-emerald-100/50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span 
                                    className="material-symbols-outlined text-[20px]" 
                                    style={{ fontVariationSettings: location.pathname.startsWith('/services') ? "'FILL' 1" : "'FILL' 0" }}
                                >
                                    home_repair_service
                                </span>
                                <span className="text-[14px]">Dịch vụ</span>
                            </div>
                            <span className={`material-symbols-outlined text-sm transition-transform ${isServicesExpanded ? 'rotate-180' : ''}`}>
                                expand_more
                            </span>
                        </button>
                        
                        {isServicesExpanded && (
                            <div className="ml-9 space-y-1">
                                {checkViewPerm('chi_so_dien') && (
                                    <Link 
                                        to="/services/dien" 
                                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-[13px] ${
                                            location.pathname === '/services/dien' 
                                            ? 'text-emerald-700 font-bold bg-emerald-100/30' 
                                            : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-100/20'
                                        }`}
                                    >
                                        <span>Quản lý số điện</span>
                                    </Link>
                                )}
                                {checkViewPerm('dich_vu_khac') && (
                                    <Link 
                                        to="/services/khac" 
                                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-[13px] ${
                                            location.pathname === '/services/khac' 
                                            ? 'text-emerald-700 font-bold bg-emerald-100/30' 
                                            : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-100/20'
                                        }`}
                                    >
                                        <span>Dịch vụ khác</span>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {bottomItems.map(item => (
                    <NavLink key={item.path} item={item} />
                ))}
            </nav>

            {/* Logout button */}
            <div className="mt-auto px-4 pt-6">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all shadow-sm"
                >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span className="text-[13px]">Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
