import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import * as notificationService from '../services/notification.service';

const Header = () => {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    let roleLabel = 'Nhân viên';
    if (user?.role === 'CHU_TRO') roleLabel = 'Quản trị viên';
    else if (user?.role === 'MANAGER') roleLabel = 'Quản lý';

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => {
        const nextState = !showDropdown;
        setShowDropdown(nextState);
        if (nextState) {
            fetchNotifications();
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;


    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        const absSeconds = Math.max(0, seconds);
        
        let interval = absSeconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = absSeconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = absSeconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = absSeconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = absSeconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return "Vừa xong";
    };


    return (
        <header className="fixed top-0 left-64 right-0 h-16 px-8 flex justify-end items-center bg-white/80 backdrop-blur-md border-b border-[#f3f4f5] z-40">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 text-slate-500 relative" ref={dropdownRef}>
                    <div className="relative cursor-pointer p-2 hover:bg-emerald-50 rounded-full transition-colors" onClick={toggleDropdown}>
                        <span className="material-symbols-outlined hover:text-[#006948] block">
                            notifications
                        </span>
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>

                    {showDropdown && (
                        <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-[#f3f4f5] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-5 py-4 border-b border-[#f3f4f5] flex justify-between items-center">
                                <h3 className="font-bold text-slate-900 text-sm">Thông báo</h3>
                                {unreadCount > 0 && (
                                    <button onClick={handleMarkAllAsRead} className="text-[11px] text-[#006948] font-bold hover:underline">
                                        Đánh dấu tất cả đã đọc
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <span className="material-symbols-outlined text-slate-300 text-4xl">notifications_off</span>
                                        <p className="text-xs text-slate-400 mt-2">Không có thông báo nào</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div 
                                            key={n.id} 
                                            onClick={() => handleMarkAsRead(n.id)}
                                            className={`px-5 py-4 border-b border-[#f3f4f5] last:border-0 hover:bg-slate-50 transition-colors cursor-pointer relative ${!n.isRead ? 'bg-emerald-50/30' : ''}`}
                                        >
                                            {!n.isRead && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#006948] rounded-full"></div>}
                                            <div className="flex justify-between items-start gap-2">
                                                <p className={`text-xs font-bold ${!n.isRead ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{getTimeAgo(n.createdAt)}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

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

