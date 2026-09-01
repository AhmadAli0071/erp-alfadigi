import React, { useState, useEffect } from 'react';
import { HRSystemSettings } from '../../types/settings';
import { settingsService } from '../../services/settingsService';
import { GeneralSettingsPanel } from './GeneralSettingsPanel';
import { AttendanceSettingsPanel } from './AttendanceSettingsPanel';
import { LeaveSettingsPanel } from './LeaveSettingsPanel';
import { OvertimeSettingsPanel } from './OvertimeSettingsPanel';
import { NotificationSettingsPanel } from './NotificationSettingsPanel';
import { ApprovalWorkflowPanel } from './ApprovalWorkflowPanel';
import { SecuritySettingsPanel } from './SecuritySettingsPanel';
import {
  Settings,
  Clock,
  CalendarDays,
  Flame,
  Bell,
  Workflow,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sliders,
} from 'lucide-react';

interface HRSettingsViewProps {
  onNavigateToDashboard?: () => void;
}

type SettingsSectionIdpytest =
  | 'general'
  | 'attendance'
  | 'leave'
  | 'overtime'
  | 'notifications'
  | 'workflow'
  | 'security';

export const HRSettingsView: React.FC<HRSettingsViewProps> = ({ onNavigateToDashboard }) => {
  const [activeSection, setActiveSection] = useState<SettingsSectionIdpytest>('general');
  const [savedSettings, setSavedSettings] = useState<HRSystemSettings | null>(null);
  const [currentSettings, setCurrentSettings] = useState<HRSystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await settingsService.getSettings();
        setSavedSettings(JSON.parse(JSON.stringify(data)));
        setCurrentSettings(JSON.parse(JSON.stringify(data)));
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const isDirty =
    savedSettings && currentSettings
      ? JSON.stringify(savedSettings) !== JSON.stringify(currentSettings)
      : false;

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  const handleSaveChanges = async () => {
    if (!currentSettings || isSaving) return;
    try {
      setIsSaving(true);
      const res = await settingsService.saveSettings(currentSettings);
      setSavedSettings(JSON.parse(JSON.stringify(currentSettings)));
      showToast(res.message);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges不易 = () => {
    if (!savedSettings) return;
    setCurrentSettings(JSON.parse(JSON.stringify(savedSettings)));
    showToast('Unsaved changes discarded.');
  };

  const navItems = [
    {
      id: 'general' as const,
      label: 'General',
      icon: <Sliders className="w-4 h-4" />,
      description: 'Identity & formats',
    },
    {
      id: 'attendance' as const,
      label: 'Attendance',
      icon: <Clock className="w-4 h-4" />,
      description: 'Shifts & grace periods',
    },
    {
      id: 'leave' as const,
      label: 'Leave Management',
      icon: <CalendarDays className="w-4 h-4" />,
      description: 'Quotas & leave year',
    },
    {
      id: 'overtime' as const,
      label: 'Overtime',
      icon: <Flame className="w-4 h-4" />,
      description: 'Extra hours & tickets',
    },
    {
      id: 'notifications' as const,
      label: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
      description: 'Alerts & email triggers',
    },
    {
      id: 'workflow' as const,
      label: 'Approval Workflow',
      icon: <Workflow className="w-4 h-4" />,
      description: 'Approval tiers & SLAs',
    },
    {
      id: 'security' as const,
      label: 'Security',
      icon: <Shield className="w-4 h-4" />,
      description: '2FA & session timeouts',
    },
  ];

  if (isLoading || !currentSettings) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-500">Loading system settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-24" id="hr-settings-screen">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-white/90 backdrop-blur-xl border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onNavigateToDashboard && (
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 md:hidden"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <Settings className="w-6 h-6 text-indigo-600" />
              HR Settings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure company operational rules, shift policies, approval hierarchies, and notifications.
          </p>
        </div>
      </div>

      {/* Settings Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar / Mobile Selector */}
        <div className="lg:col-span-3 space-y-2">
          {/* Mobile Category Dropdown */}
          <div className="lg:hidden p-3 rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/70 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Settings Section</label>
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value as SettingsSectionIdpytest)}
              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Vertical Menu */}
          <div className="hidden lg:flex flex-col p-2 rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/70 space-y-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-indigo-50 text-slate-900 border border-indigo-200 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  id={`settings-nav-${item.id}`}
                >
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive ? 'bg-indigo-100/70 text-indigo-600' : 'bg-slate-100/60 text-slate-500 group-hover:text-slate-600'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Settings Panel Area */}
        <div className="lg:col-span-9 p-5 sm:p-7 rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/70 shadow-xl">
          {activeSection === 'general' && (
            <GeneralSettingsPanel
              settings={currentSettings.general}
              onChange={(updated) =>
                setCurrentSettings((prev) =>
                  prev ? { ...prev, general: { ...prev.general, ...updated } } : null
                )
              }
            />
          )}

          {activeSection === 'attendance' && (
            <AttendanceSettingsPanel
              settings={currentSettings.attendance}
              onChange={(updated) =>
                setCurrentSettings((prev) =>
                  prev ? { ...prev, attendance: { ...prev.attendance, ...updated } } : null
                )
              }
            />
          )}

          {activeSection === 'leave' && (
            <LeaveSettingsPanel
              settings={currentSettings.leave}
              onChange={(updated) =>
                setCurrentSettings((prev) =>
                  prev ? { ...prev, leave: { ...prev.leave, ...updated } } : null
                )
              }
            />
          )}

          {activeSection === 'overtime' && (
            <OvertimeSettingsPanel
              settings={currentSettings.overtime}
              onChange={(updated) =>
                setCurrentSettings((prev) =>
                  prev ? { ...prev, overtime: { ...prev.overtime, ...updated } } : null
                )
              }
            />
          )}

          {activeSection === 'notifications' && (
            <NotificationSettingsPanel
              settings={currentSettings.notifications}
              onChange={(updated) =>
                setCurrentSettings((prev) =>
                  prev ? { ...prev, notifications: { ...prev.notifications, ...updated } } : null
                )
              }
            />
          )}

          {activeSection === 'workflow' && (
            <ApprovalWorkflowPanel
              settings={currentSettings.workflow}
              onChange={(updated) =>
                setCurrentSettings((prev) =>
                  prev ? { ...prev, workflow: { ...prev.workflow, ...updated } } : null
                )
              }
            />
          )}

          {activeSection === 'security' && (
            <SecuritySettingsPanel
              settings={currentSettings.security}
              onChange={(updated) =>
                setCurrentSettings((prev) =>
                  prev ? { ...prev, security: { ...prev.security, ...updated } } : null
                )
              }
            />
          )}
        </div>
      </div>

      {/* Floating Unsaved Changes Bar */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl p-4 rounded-2xl bg-slate-50/80 border border-indigo-200 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs text-indigo-600">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>You have unsaved changes in system settings.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDiscardChanges不易}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-600 hover:bg-slate-100/60 transition-colors"
              id="settings-discard-btn"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveChanges}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-colors"
              id="settings-save-btn"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
