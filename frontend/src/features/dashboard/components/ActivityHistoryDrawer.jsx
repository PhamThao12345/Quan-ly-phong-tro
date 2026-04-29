import React, { useState, useEffect } from 'react';
import activityService from '../../../services/activity.service';

const ActivityHistoryDrawer = ({ isOpen, onClose, isAdmin }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
      setShowClearConfirm(false);
    }
  }, [isOpen]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await activityService.getActivities();
      setActivities(response.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử hoạt động', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearActivities = async () => {
    setIsClearing(true);
    try {
      await activityService.clearActivities();
      setActivities([]);
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Lỗi khi xóa lịch sử', error);
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsClearing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#191c1d]/40 backdrop-blur-[2px] z-[60] flex justify-end">
      {/* DRAWER PANEL */}
      <div className="w-full max-w-[400px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-[#bccac0]/20 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-headline font-bold text-[#191c1d]">Lịch sử hoạt động</h2>
            <p className="text-xs text-[#3d4a42] font-medium mt-0.5">Thời gian thực</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#edeeef] rounded-full transition-colors text-[#3d4a42]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content / Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center mt-10">
              <span className="text-sm text-slate-500">Đang tải...</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex justify-center mt-10">
              <span className="text-sm text-slate-500">Chưa có hoạt động nào</span>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-[#bccac0]/30"></div>
              
              {/* Timeline Items */}
              <div className="space-y-8">
                {activities.map((log) => {
                  const date = new Date(log.createdAt);
                  const timeString = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  const dateString = date.toLocaleDateString('vi-VN');
                  
                  return (
                    <div key={log.id} className="relative pl-10">
                      <div className="absolute left-0 top-1.5 w-5 h-5 bg-white border-2 border-[#006948] rounded-full flex items-center justify-center z-10">
                        <div className="w-2 h-2 bg-[#006948] rounded-full"></div>
                      </div>
                      <div className="bg-[#f3f4f5]/50 p-4 rounded-xl">
                        <p className="text-sm font-medium leading-relaxed">
                          <span className="text-[#006948] font-bold">{log.user.fullName || log.user.role}</span> {log.action.toLowerCase()}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-[#3d4a42]">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          <span className="text-[11px] font-label uppercase tracking-wider">{timeString} • {dateString}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isAdmin && (
          <div className="p-6 border-t border-[#bccac0]/20 bg-[#f3f4f5]/30">
            {!showClearConfirm ? (
              <button 
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                Xóa toàn bộ lịch sử
              </button>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm text-center animate-in fade-in zoom-in duration-200">
                <p className="text-sm text-[#191c1d] font-medium mb-4">Xác nhận xóa toàn bộ lịch sử? Hành động này không thể hoàn tác.</p>
                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 text-xs font-bold text-[#3d4a42] bg-[#f3f4f5] rounded-lg hover:bg-[#edeeef]"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleClearActivities}
                    disabled={isClearing}
                    className="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {isClearing ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityHistoryDrawer;
