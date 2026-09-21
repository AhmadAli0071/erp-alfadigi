export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'leave' | 'ticket' | 'attendance' | 'general';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

type NotificationListener = (notification: AppNotification) => void;
type CountListener = (count: number) => void;

const API_BASE = '/api';

const getToken = (): string | null => {
  try {
    return localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
  } catch {
    return null;
  }
};

const getHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const SOUND_PREF_KEY = 'alfa_digi_notif_sound';
const DESKTOP_PREF_KEY = 'alfa_digi_notif_desktop';

class NotificationService {
  private eventSource: EventSource | null = null;
  private listeners = new Set<NotificationListener>();
  private countListeners = new Set<CountListener>();
  private unreadCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /* ---------- Sound (Web Audio API — no external file) ---------- */
  playChime(): void {
    try {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') void ctx.resume();
      const now = ctx.currentTime;

      // Pleasant two-tone chime (E6 -> G6)
      const notes = [
        { freq: 1318.5, start: 0, dur: 0.18 },
        { freq: 1568.0, start: 0.12, dur: 0.35 },
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.22, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });

      setTimeout(() => void ctx.close(), 1200);
    } catch {
      // audio not available
    }
  }

  isSoundEnabled(): boolean {
    try {
      return localStorage.getItem(SOUND_PREF_KEY) !== 'off';
    } catch {
      return true;
    }
  }

  setSoundEnabled(on: boolean): void {
    try {
      localStorage.setItem(SOUND_PREF_KEY, on ? 'on' : 'off');
    } catch { /* ignore */ }
  }

  /* ---------- Desktop (Chrome) notifications ---------- */
  getBrowserPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  isDesktopEnabled(): boolean {
    try {
      return localStorage.getItem(DESKTOP_PREF_KEY) !== 'off';
    } catch {
      return true;
    }
  }

  setDesktopEnabled(on: boolean): void {
    try {
      localStorage.setItem(DESKTOP_PREF_KEY, on ? 'on' : 'off');
    } catch { /* ignore */ }
  }

  /** Must be called from a user gesture (e.g. button click). */
  async requestDesktopPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        this.setDesktopEnabled(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private showDesktopNotification(n: AppNotification): void {
    if (!this.isDesktopEnabled()) return;
    if (this.getBrowserPermission() !== 'granted') return;
    try {
      const notif = new Notification(n.title, {
        body: n.message,
        icon: '/alfa-logo.png',
        tag: n.id,
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch {
      // notification API failure — ignore
    }
  }

  /** Ask once when the site opens, if the user hasn't decided yet. */
  promptForPermissionIfNeeded(): void {
    if (this.getBrowserPermission() !== 'default') return;
    void Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        this.setDesktopEnabled(true);
        this.showTestNotification();
      }
    });
  }

  /** Demo desktop notification — used right after permission is granted. */
  showTestNotification(): void {
    this.showDesktopNotification({
      id: `test_${Date.now()}`,
      title: 'Desktop notifications enabled',
      message: 'Ab naye notifications yahan + sound ke sath aayenge.',
      type: 'general',
      isRead: true,
      createdAt: new Date().toISOString(),
    });
  }

  connect(): void {
    const token = getToken();
    if (!token || this.eventSource) return;

    const es = new EventSource(`${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`);

    es.addEventListener('connected', () => {
      this.refreshUnreadCount();
    });

    es.addEventListener('notification', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as AppNotification;
        this.unreadCount += 1;
        this.countListeners.forEach((cb) => cb(this.unreadCount));
        this.listeners.forEach((cb) => cb(data));
        // Alert the user: chime + Chrome desktop notification
        if (this.isSoundEnabled()) this.playChime();
        this.showDesktopNotification(data);
      } catch {
        // ignore malformed events
      }
    });

    es.onerror = () => {
      es.close();
      this.eventSource = null;
      // Reconnect after 5 seconds
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    };

    this.eventSource = es;
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
  }

  onNotification(cb: NotificationListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  onUnreadCount(cb: CountListener): () => void {
    this.countListeners.add(cb);
    cb(this.unreadCount);
    return () => this.countListeners.delete(cb);
  }

  async refreshUnreadCount(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/notifications/unread-count`, { headers: getHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      this.unreadCount = data.count || 0;
      this.countListeners.forEach((cb) => cb(this.unreadCount));
    } catch {
      // ignore
    }
  }

  async fetchNotifications(): Promise<AppNotification[]> {
    try {
      const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.notifications || [];
    } catch {
      return [];
    }
  }

  async markRead(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.countListeners.forEach((cb) => cb(this.unreadCount));
    } catch {
      // ignore
    }
  }

  async markAllRead(): Promise<void> {
    try {
      await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      this.unreadCount = 0;
      this.countListeners.forEach((cb) => cb(this.unreadCount));
    } catch {
      // ignore
    }
  }
}

export const notificationService = new NotificationService();
