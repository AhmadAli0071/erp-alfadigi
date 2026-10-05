import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import {
  ArrowLeft,
  Megaphone,
  Pin,
  CalendarDays,
  RefreshCw,
  UserCircle,
  Pencil,
  Trash2,
  AlertCircle,
  Send,
  X,
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
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
};

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const HRAnnouncementsView: React.FC<{ onNavigateToDashboard: () => void }> = ({ onNavigateToDashboard }) => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  // composer state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null);

  const showToast = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 5000);
  };

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

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setPinned(false);
  };

  const submit = async () => {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(editingId ? `/api/announcements/${editingId}` : '/api/announcements', {
        method: editingId ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title: title.trim(), body: body.trim(), pinned }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(true, editingId ? 'Announcement updated.' : `Announcement posted to the whole company${data.notified ? ` (${data.notified} notified)` : ''}.`);
        resetForm();
        fetchAnnouncements();
      } else {
        showToast(false, data.error || 'Failed to save announcement.');
      }
    } catch {
      showToast(false, 'Unable to connect to server.');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setTitle(a.title);
    setBody(a.body);
    setPinned(a.pinned);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePin = async (a: Announcement) => {
    const res = await fetch(`/api/announcements/${a.id}/pin`, { method: 'PUT', headers: getHeaders() });
    if (res.ok) fetchAnnouncements();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const res = await fetch(`/api/announcements/${confirmDelete.id}`, { method: 'DELETE', headers: getHeaders() });
    if (res.ok) {
      showToast(true, 'Announcement deleted.');
      fetchAnnouncements();
    } else {
      showToast(false, 'Delete failed.');
    }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onNavigateToDashboard}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Announcements</h1>
          <p className="text-xs text-slate-500 font-medium">Post company-wide updates — everyone gets notified instantly</p>
        </div>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold ${toast.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {toast.text}
        </div>
      )}

      {/* Composer */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3.5">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200">
            <Megaphone className="w-4 h-4 text-indigo-600" />
          </div>
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-600">
            {editingId ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          {editingId && (
            <button onClick={resetForm} className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-3 h-3" /> Cancel edit
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Office will remain closed on Monday"
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={4000}
              rows={4}
              placeholder="Write the full announcement here…"
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-y"
            />
            <div className="text-right text-[9px] font-semibold text-slate-400 mt-0.5">{body.length}/4000</div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
              />
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600">
                <Pin className="w-3.5 h-3.5 text-amber-500" /> Pin to top
              </span>
            </label>
            <button
              onClick={submit}
              disabled={busy || !title.trim() || !body.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-extrabold transition-colors cursor-pointer"
            >
              {busy ? 'Saving…' : editingId ? 'Save Changes' : (
                <>
                  <Send className="w-3.5 h-3.5" /> Post to Company
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : error ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
          <Megaphone className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">No announcements posted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className={`rounded-2xl border shadow-sm p-4 ${a.pinned ? 'bg-amber-50/70 border-amber-300' : 'bg-white/80 backdrop-blur-xl border-slate-200/80'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  {a.pinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200/70 border border-amber-400 text-amber-800 text-[9px] font-extrabold uppercase tracking-widest">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <h3 className="text-sm font-extrabold text-slate-900">{a.title}</h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => togglePin(a)} className={`p-2 rounded-lg cursor-pointer transition-colors ${a.pinned ? 'text-amber-500 hover:bg-amber-100' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'}`} title={a.pinned ? 'Unpin' : 'Pin to top'}>
                    <Pin className="w-4 h-4" />
                  </button>
                  <button onClick={() => startEdit(a)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirmDelete(a)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{a.body}</p>
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                  <UserCircle className="w-3.5 h-3.5 text-slate-400" /> {a.postedByName}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                  <CalendarDays className="w-3 h-3" /> {fmtDate(a.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 text-center">Delete this announcement?</h3>
            <p className="text-xs text-slate-500 text-center mt-1">"{confirmDelete.title}" will be removed from everyone's board.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer">Cancel</button>
              <button onClick={doDelete} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
