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

class NotificationService {
  private eventSource: EventSource | null = null;
  private listeners = new Set<NotificationListener>();
  private countListeners = new Set<CountListener>();
  private unreadCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

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
