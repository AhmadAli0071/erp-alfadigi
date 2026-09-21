import { useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';

/**
 * Keeps data live without manual refreshes: re-runs `refresh` (debounced)
 * whenever a real-time notification arrives via SSE or when the window
 * regains focus (e.g. user switched back to the tab).
 */
export const useRealtimeRefresh = (refresh: () => void) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => refreshRef.current(), 1200);
    };
    const unsubscribe = notificationService.onNotification(schedule);
    const onFocus = () => schedule();
    window.addEventListener('focus', onFocus);
    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocus);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
};
