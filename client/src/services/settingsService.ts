import { HRSystemSettings } from '../types/settings';

const API_BASE = '/api';

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

class SettingsService {
  /**
   * Retrieves active ERP settings from the backend.
   */
  public async getSettings(): Promise<HRSystemSettings> {
    const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Unable to load settings.');
    return data.settings as HRSystemSettings;
  }

  /**
   * Saves updated settings to the backend (persisted for the whole company).
   */
  public async saveSettings(newSettings: HRSystemSettings): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ settings: newSettings }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Unable to save settings.');
    return { success: true, message: data.message || 'Settings saved successfully.' };
  }

  /**
   * Resets settings back to system defaults (persisted).
   */
  public async resetToDefaults(): Promise<HRSystemSettings> {
    const res = await fetch(`${API_BASE}/settings/reset`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Unable to reset settings.');
    return data.settings as HRSystemSettings;
  }
}

export const settingsService = new SettingsService();
