import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/auth';
import {
  Bell,
  ArrowLeft,
  CheckCheck,
  BellOff,
  CalendarDays,
  Ticket as TicketIcon,
  Clock,
  Info,
} from 'lucide-react';
import { notificationService, AppNotification } from '../../services/notificationService';

interface EmployeeNotificationsViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; bg: string }> = {
  leave: { icon: <CalendarDays className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50 border-blue-200' },
  ticket: { icon: <TicketIcon className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-50 border-purple-200' },
  attendance: { icon: <Clock className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-200' },
  general: { icon: <Info className="w-4 h-4 text-slate-600" />, bg: 'bg-slate-50 border-slate-200' },
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const EmployeeNotificationsView: React.FC<EmployeeNotificationsViewProps> = ({
  user,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'leave' | 'ticket'>('ALL');

  const load = useCallback(async () => {
    setIsLoading(true);
    const list = await notificationService.fetchNotifications();
    setNotifications(list);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Real-time: new notifications appear without refresh
    const unsub = notificationService.onNotification((n) => {
      setNotifications((prev) => [n, ...prev].slice(0, 50));
    });
    notificationService.refreshUnreadCount();
    return () => unsub();
  }, [load]);

  const filtered = notifications.filter((n) => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !n.isRead;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleRead = async (n: AppNotification) => {
    if (!n.isRead) {
      await notificationService.markRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
  };

  const handleMarkAll = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/employee/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Bell className="w-6 h-6 text-indigo-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[11px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 font-medium">Stay updated on your requests — live</p>
          </div>
        </div>

        <button
          onClick={handleMarkAll}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['ALL', 'UNREAD', 'leave', 'ticket'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white/80 border border-slate-200/70 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f === 'ALL' ? 'All' : f === 'UNREAD' ? 'Unread' : f === 'leave' ? 'Leaves' : 'Tickets'}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-10 text-center">
          <Bell className="w-6 h-6 text-indigo-400 animate-pulse mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading notifications…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <BellOff className="w-6 h-6 opacity-60" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">No notifications</p>
          <p className="text-xs text-slate-400">You're all caught up! Notifications will appear here in real time.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100/80">
          {filtered.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
            return (
              <button
                key={n.id}
                onClick={() => handleRead(n)}
                className={`w-full text-left flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer ${
                  n.isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                }`}
              >
                <div className={`p-2 rounded-xl border shrink-0 ${cfg.bg}`}>
                  {cfg.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${n.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                      {n.title}
                    </span>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1.5 block">{timeAgo(n.createdAt)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
