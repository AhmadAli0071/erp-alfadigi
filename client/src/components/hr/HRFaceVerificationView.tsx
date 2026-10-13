import React, { useEffect, useState } from 'react';
import {
  Camera,
  Check,
  X,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { FaceVerifyItem } from '../../types/hr';

const API_BASE = '/api';

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

interface FaceVerifyResponse {
  faceVerifications?: { count: number; items?: FaceVerifyItem[] };
}

interface HRFaceVerificationViewProps {
  onNavigate: (route: string) => void;
}

export const HRFaceVerificationView: React.FC<HRFaceVerificationViewProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<FaceVerifyItem[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [decided, setDecided] = useState<Record<string, 'VERIFIED' | 'REJECTED'>>({});
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE}/attendance/hr/pending-review`, { headers: getHeaders() });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as FaceVerifyResponse;
      const list = data.faceVerifications?.items ?? [];
      setItems(list);

      // Fetch each pending photo as an authenticated blob → object URL
      const urls: Record<string, string> = {};
      await Promise.all(
        list.map(async (item) => {
          try {
            const pres = await fetch(`${API_BASE}/attendance/hr/${item.attendanceId}/face-photo`, {
              headers: getHeaders(),
            });
            if (pres.ok) {
              const blob = await pres.blob();
              urls[item.attendanceId] = URL.createObjectURL(blob);
            }
          } catch {
            /* ignore individual photo failures */
          }
        })
      );
      setPhotoUrls(urls);
    } catch {
      setFetchError('Could not load face verification queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      // Revoke object URLs on unmount
      Object.values(photoUrls).forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = async (attendanceId: string, decision: 'VERIFIED' | 'REJECTED') => {
    setBusyKey(attendanceId);
    try {
      const res = await fetch(`${API_BASE}/attendance/hr/${attendanceId}/face-verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ decision, note: rejectNote[attendanceId] || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Action failed.');
      }
      setDecided((d) => ({ ...d, [attendanceId]: decision }));
      // Remove from pending list
      setItems((prev) => prev.filter((i) => i.attendanceId !== attendanceId));
    } catch {
      /* keep item, allow retry */
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/hr/dashboard')}
            className="p-2 rounded-xl bg-slate-100/60 hover:bg-slate-200/60 text-slate-600 transition-colors cursor-pointer"
            id="face-verify-back-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Face Verification</h2>
              <p className="text-xs text-slate-500">
                Visually confirm each clock-in photo matches the employee.
              </p>
            </div>
          </div>
        </div>
        {!loading && items.length > 0 && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
            {items.length} pending
          </span>
        )}
      </div>

      {fetchError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{fetchError}</span>
          <button
            type="button"
            onClick={load}
            className="ml-auto underline cursor-pointer hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xs font-medium">Loading queue…</span>
        </div>
      ) : items.length === 0 && !fetchError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <span className="text-xs font-medium">All clear — no photos awaiting verification.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => {
            const isBusy = busyKey === item.attendanceId;
            return (
              <div
                key={item.attendanceId}
                className="rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col"
                id={`face-card-${item.attendanceId}`}
              >
                {/* Photo */}
                <div className="relative w-full aspect-[4/3] bg-slate-900 flex items-center justify-center">
                  {photoUrls[item.attendanceId] ? (
                    <img
                      src={photoUrls[item.attendanceId]}
                      alt={`Clock-in photo of ${item.employeeName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Camera className="w-6 h-6" />
                      <span className="text-[10px] font-medium">Photo unavailable</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{item.employeeName}</h4>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0">{item.employeeCode}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    <span className="text-indigo-600 font-medium">{item.department}</span> •{' '}
                    <span className="font-mono">{item.clockInTime}</span> • {item.dateLabel}
                  </p>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 space-y-2">
                  <input
                    type="text"
                    placeholder="Note (optional for reject)"
                    value={rejectNote[item.attendanceId] || ''}
                    onChange={(e) => setRejectNote((n) => ({ ...n, [item.attendanceId]: e.target.value }))}
                    disabled={isBusy}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[11px] text-slate-900 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    id={`face-note-${item.attendanceId}`}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => decide(item.attendanceId, 'VERIFIED')}
                      disabled={isBusy}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      id={`face-approve-${item.attendanceId}`}
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Verify</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(item.attendanceId, 'REJECTED')}
                      disabled={isBusy}
                      className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      id={`face-reject-${item.attendanceId}`}
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
