import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import {
  Megaphone,
  Pin,
  CalendarDays,
  RefreshCw,
  UserCircle,
  Sparkles,
  Bell,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  postedByName: string;
  postedByEmail: string;
  postedByRole: string;
  createdAt: string;
  updatedAt: string;
}

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const dayLabel = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yest)) return 'Yesterday';
  return fmtDate(iso);
};

const postedByLabel = (role: string): string =>
  role === 'HR_ADMIN' ? 'HR' : role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin';

/**
 * Shared Announcement Board (notice-board style) - rendered inside Employee,
 * Lead, HOD and Super Admin portals. HR uses the dedicated composer page.
 */
export const AnnouncementsView: React.FC<{ title?: string; subtitle?: string }> = ({
  title = 'Announcement Board',
  subtitle = 'Company-wide updates from HR',
}) => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/announcements', { headers: getHeaders() });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setItems(data.announcements || []);
    } catch {
      setError('Unable to load announcements.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useRealtimeRefresh(fetchAnnouncements);

  const pinned = items.filter((a) => a.pinned);
  const regular = items.filter((a) => !a.pinned);
  const latest = items[0];
  const isNew = (a: Announcement): boolean => {
    if (!latest) return false;
    const age = Date.now() - new Date(a.createdAt).getTime();
    return age < 24 * 60 * 60 * 1000;
  };

  const BoardCard: React.FC<{ a: Announcement; big?: boolean }> = ({ a, big }) => (
    <article
      className={`relative overflow-hidden rounded-2xl border transition-all hover:shadow-lg ${
        a.pinned
          ? 'bg-gradient-to-br from-amber-50 to-white border-amber-300 shadow-md shadow-amber-500/10'
          : 'bg-white/90 backdrop-blur-xl border-slate-200/80 shadow-sm'
      }`}
    >
      {a.pinned && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500" />}
      <div className={`p-4 sm:p-5 ${a.pinned ? 'pl-5 sm:pl-6' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {a.pinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-800 text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
            <h3 className={`${big ? 'text-base' : 'text-sm'} font-extrabold text-slate-900 leading-snug`}>{a.title}</h3>
            {isNew(a) && !a.pinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 text-[9px] font-extrabold uppercase tracking-widest">
                <Sparkles className="w-2.5 h-2.5" /> New
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-[10px] font-bold text-slate-500 shrink-0">
            <CalendarDays className="w-3 h-3" /> {dayLabel(a.createdAt)}
          </span>
        </div>
        <p className={`mt-3 text-slate-600 leading-relaxed whitespace-pre-wrap ${big ? 'text-[13px]' : 'text-xs'}`}>{a.body}</p>
        <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[8px] font-extrabold">
              {postedByLabel(a.postedByRole)[0]}
            </span>
            {postedByLabel(a.postedByRole)} · {a.postedByName}
          </span>
          <span className="text-[9px] font-semibold text-slate-400">{fmtDate(a.createdAt)}</span>
        </div>
      </div>
    </article>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 animate-fadeIn">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-5 sm:p-6 shadow-lg shadow-indigo-600/25">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-xl" aria-hidden="true" />
        <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-white/[0.07] blur-lg" aria-hidden="true" />
        <Megaphone className="absolute right-4 bottom-2 w-20 h-20 text-white/[0.08] -rotate-12" aria-hidden="true" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{title}</h1>
              <p className="text-[11px] text-indigo-100/90 font-medium mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-sm">
              {items.length} {items.length === 1 ? 'Notice' : 'Notices'}
            </span>
            <button
              type="button"
              onClick={fetchAnnouncements}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-colors disabled:opacity-40 cursor-pointer backdrop-blur-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">{error}</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100/70 border border-slate-200 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700">The board is empty right now</p>
          <p className="text-xs text-slate-400 mt-1">Announcements posted by HR will appear here for the whole company.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Pinned section */}
          {pinned.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Pin className="w-3.5 h-3.5 text-amber-500" />
                <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Pinned</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-300/60 to-transparent" />
              </div>
              {pinned.map((a) => (
                <BoardCard key={a.id} a={a} big />
              ))}
            </section>
          )}

          {/* Regular section */}
          {regular.length > 0 && (
            <section className="space-y-3">
              {pinned.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <Megaphone className="w-3.5 h-3.5 text-indigo-500" />
                  <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Latest Updates</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                </div>
              )}
              {regular.map((a) => (
                <BoardCard key={a.id} a={a} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
