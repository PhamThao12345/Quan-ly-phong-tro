import React from 'react';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const Header = () => {
    const { user } = useContext(AuthContext);
    let roleLabel = 'Nhân viên';
    if (user?.role === 'CHU_TRO') roleLabel = 'Chủ trọ';
    else if (user?.role === 'MANAGER') roleLabel = 'Quản trị viên';

    return (
        <header className="fixed top-0 left-64 right-0 h-16 px-8 flex justify-end items-center bg-white/80 backdrop-blur-md border-b border-[#f3f4f5] z-40">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 text-slate-500">
                    <span className="material-symbols-outlined cursor-pointer hover:text-[#006948] transition-colors p-2 hover:bg-emerald-50 rounded-full">
                        notifications
                    </span>
                    <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[12px] font-bold text-slate-900 leading-none">{user?.fullName || 'Người dùng'}</p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{roleLabel}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                            <span className="material-symbols-outlined text-emerald-700">person</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
