import React from 'react';
import { Calendar } from 'lucide-react';

interface HRWelcomeSectionProps {
  adminName?: string;
}

export const HRWelcomeSection: React.FC<HRWelcomeSectionProps> = ({
  adminName = 'HR Admin',
}) => {
  // Format current system date dynamically
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5"
      id="hr-dashboard-welcome-section"
    >
      {/* Heading & Subtext */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight" id="welcome-heading">
          Good evening, {adminName || 'HR Admin'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-medium">
          Here's your HR overview for today.
        </p>
      </div>

      {/* Right side: Dynamic system date */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-slate-300 text-xs font-semibold self-start sm:self-auto">
        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-white">{formattedToday}</span>
      </div>
    </div>
  );
};

