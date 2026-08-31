import React from 'react';
import { NotificationSettings } from '../../types/settings';
import {
  Bell,
  Mail,
  CalendarDays,
  Clock,
  Flame,
  Ticket,
  CheckCircle2,
} from 'lucide-react';

interface NotificationSettingsPanelProps {
  settings: NotificationSettings;
  onChange: (updated: Partial<NotificationSettings>) => void;
}

export const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({
  settings,
  onChange,
}) => {
  const toggles = [
    {
      key: 'leaveRequestNotifications' as keyof NotificationSettings,
      title: 'Leave Request Notifications',
      description: 'Receive real-time alerts when employees submit, edit, or cancel leave applications.',
      icon: <CalendarDays className="w-4 h-4 text-emerald-400" />,
    },
    {
      key: 'attendanceCorrectionNotifications' as keyof NotificationSettings,
      title: 'Attendance Correction Alerts',
      description: 'Notify HR administrators when missing punches or time adjustment claims are lodged.',
      icon: <Clock className="w-4 h-4 text-indigo-400" />,
    },
    {
      key: 'overtimeVerificationNotifications' as keyof NotificationSettings,
      title: 'Overtime Verification Alerts',
      description: 'Trigger notifications for shift extension logs requiring managerial verification.',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
    },
    {
      key: 'ticketNotifications' as keyof NotificationSettings,
      title: 'Support Ticket Activity',
      description: 'Send alerts on new tickets created, priority upgrades, and conversation replies.',
      icon: <Ticket className="w-4 h-4 text-blue-400" />,
    },
    {
      key: 'approvalNotifications' as keyof NotificationSettings,
      title: 'Approval & Decision Notifications',
      description: 'Broadcast notifications to stakeholders upon formal approval or rejection of requests.',
      icon: <CheckCircle2 className="w-4 h-4 text-purple-400" />,
    },
    {
      key: 'emailNotifications' as keyof NotificationSettings,
      title: 'Outbound Email Dispatches',
      description: 'Dispatch instant email notifications to corporate mailboxes alongside dashboard alerts.',
      icon: <Mail className="w-4 h-4 text-rose-400" />,
    },
    {
      key: 'inAppNotifications' as keyof NotificationSettings,
      title: 'In-App Toast & Badge Notifications',
      description: 'Display interactive in-app toast banners and notification center counter updates.',
      icon: <Bell className="w-4 h-4 text-sky-400" />,
    },
  ];

  return (
    <div className="space-y-6" id="settings-panel-notifications">
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-base font-semibold text-white">Event Notification Preferences</h3>
        <p className="text-xs text-slate-400 mt-1">
          Configure real-time system alerts, email digests, and communication triggers across ERP modules.
        </p>
      </div>

      <div className="space-y-3">
        {toggles.map((item) => {
          const isEnabled = settings[item.key];

          return (
            <div
              key={item.key}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onChange({ [item.key]: !isEnabled })}
                className={`w-11 h-6 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
                  isEnabled ? 'bg-indigo-600' : 'bg-white/10'
                }`}
                id={`toggle-notif-${item.key}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
