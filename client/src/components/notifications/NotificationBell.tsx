import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, CalendarDays, Ticket as TicketIcon, Clock, Info } from 'lucide-react';
import { notificationService, AppNotification } from '../../services/notificationService';

interface NotificationBellProps {
  onNavigate?: (route: string) => void;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; bg: string }> = {
  leave: { icon: <CalendarDays className="w-3.5 h-3.5 text-blue-600" />, bg: 'bg-blue-50 border-blue-200' },
  ticket: { icon: <TicketIcon className="w-3.5 h-3.5 text-purple-600" />, bg: 'bg-purple-50 border-purple-200' },
  attendance: { icon: <Clock className="w-3.5 h-3.5 text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-200' },
  general: { icon: <Info className="w-3.5 h-3.5 text-slate-600" />, bg: 'bg-slate-50 border-slate-200' },
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Connect to real-time SSE stream on mount
  useEffect(() => {
    notificationService.connect();
    const unsubCount = notificationService.onUnreadCount(setUnreadCount);
    const unsubNotif = notificationService.onNotification((n) => {
      setNotifications((prev) => [n, ...prev].slice(0, 50));
    });
    notificationService.refreshUnreadCount();

    return () => {
      unsubCount();
      unsubNotif();
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openDropdown = useCallback(async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      const list = await notificationService.fetchNotifications();
      setNotifications(list);
    }
  }, [isOpen]);

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.isRead) {
      await notificationService.markRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
  };

  const handleMarkAll = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
  };

  const handleViewAll = () => {
    setIsOpen(false);
    if (onNavigate) onNavigate('/employee/notifications');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={openDropdown}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-rose-500/40 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl z-50 overflow-hidden animate-scaleUp origin-top-right">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
              className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-40 cursor-pointer"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">No notifications</p>
                <p className="text-[10px] text-slate-400 mt-0.5">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-slate-100/80 last:border-0 transition-colors cursor-pointer ${
                      n.isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg border shrink-0 ${cfg.bg}`}>
                      {cfg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold truncate ${n.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                          {n.title}
                        </span>
                        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{timeAgo(n.createdAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
