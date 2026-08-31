import React from 'react';
import { PendingActionItem } from '../../types/hr';
import {
  AlertCircle,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface HRPendingActionsProps {
  pendingActions: PendingActionItem[];
  onReviewAction: (action: PendingActionItem) => void;
  onNavigate: (route: string) => void;
}

export const HRPendingActions: React.FC<HRPendingActionsProps> = ({
  pendingActions = [],
  onReviewAction,
  onNavigate,
}) => {
  const correctionItem = pendingActions.find((a) => a.type === 'ATTENDANCE_CORRECTION');
  const leaveItem = pendingActions.find((a) => a.type === 'LEAVE_REQUEST');
  const overtimeItem = pendingActions.find((a) => a.type === 'EXTRA_HOURS');

  const correctionCount = pendingActions.filter((a) => a.type === 'ATTENDANCE_CORRECTION' && a.status === 'Pending').length;
  const leaveCount = pendingActions.filter((a) => a.type === 'LEAVE_REQUEST' && a.status === 'Pending').length;
  const overtimeCount = pendingActions.filter((a) => a.type === 'EXTRA_HOURS' && a.status === 'Pending').length;

  const actionCards = [
    {
      id: 'action-card-corrections',
      title: 'Attendance Corrections',
      count: correctionCount > 0 ? `${correctionCount} pending` : 'No pending data',
      countNum: correctionCount,
      explanation: correctionCount > 0 ? 'Employees are waiting for HR review.' : 'No attendance corrections requiring attention.',
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      tagColor: correctionCount > 0 ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-white/5 text-slate-400 border-white/10',
      buttonBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
      actionToReview: correctionItem || null,
      route: '/hr/attendance/corrections',
    },
    {
      id: 'action-card-leaves',
      title: 'Leave Requests',
      count: leaveCount > 0 ? `${leaveCount} pending` : 'No pending data',
      countNum: leaveCount,
      explanation: leaveCount > 0 ? 'Leave requests require HR approval.' : 'No leave requests requiring approval.',
      icon: <Calendar className="w-5 h-5 text-blue-400" />,
      tagColor: leaveCount > 0 ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-white/5 text-slate-400 border-white/10',
      buttonBg: 'bg-blue-600 hover:bg-blue-500 text-white',
      actionToReview: leaveItem || null,
      route: '/hr/leaves/requests',
    },
    {
      id: 'action-card-extra-hours',
      title: 'Extra Hours',
      count: overtimeCount > 0 ? `${overtimeCount} pending` : 'No pending data',
      countNum: overtimeCount,
      explanation: overtimeCount > 0 ? 'Extra hours require verification.' : 'No unverified overtime recorded.',
      icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
      tagColor: overtimeCount > 0 ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-white/5 text-slate-400 border-white/10',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-500 text-white',
      actionToReview: overtimeItem || null,
      route: '/hr/attendance/overtime',
    },
  ];

  const handleReviewClick = (card: typeof actionCards[0]) => {
    if (card.actionToReview) {
      onReviewAction(card.actionToReview);
    } else {
      onNavigate(card.route);
    }
  };

  return (
    <section aria-label="HR Action Center" id="hr-pending-actions-section" className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Requires Your Attention</h3>
            <p className="text-xs text-slate-400">Priority pending items needing review</p>
          </div>
        </div>
      </div>

      {/* 3 Compact Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actionCards.map((card) => (
          <div
            key={card.id}
            className="p-5 rounded-2xl bg-[#121318] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between shadow-sm group"
            id={card.id}
          >
            <div>
              {/* Header: Icon & Count */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 group-hover:scale-105 transition-transform">
                  {card.icon}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${card.tagColor}`}>
                  {card.count}
                </span>
              </div>

              {/* Title & Explanation */}
              <h4 className="text-sm font-bold text-white mb-1.5">{card.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                {card.explanation}
              </p>
            </div>

            {/* Review Button */}
            <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onNavigate(card.route)}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                View all &rarr;
              </button>

              <button
                type="button"
                onClick={() => handleReviewClick(card)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer ${card.buttonBg}`}
                id={`btn-review-${card.id}`}
              >
                <span>Review</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

