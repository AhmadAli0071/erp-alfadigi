import React, { useState, useEffect } from 'react';
import { User } from '../../types/auth';
import { PendingActionItem } from '../../types/hr';
import { hrDashboardService, HRDashboardData } from '../../services/hrDashboardService';
import { HRWelcomeSection } from '../hr/HRWelcomeSection';
import { HRKpiGrid } from '../hr/HRKpiGrid';
import { HRAttendanceOverview } from '../hr/HRAttendanceOverview';
import { HRWorkingHoursCard } from '../hr/HRWorkingHoursCard';
import { HRPendingActions } from '../hr/HRPendingActions';
import { HRRecentActivity } from '../hr/HRRecentActivity';
import { HRDepartmentOverview } from '../hr/HRDepartmentOverview';
import { HRQuickActions } from '../hr/HRQuickActions';
import { HRActionModal } from '../hr/HRActionModal';
import { SkeletonLoader } from '../hr/SkeletonLoader';
import { ErrorState } from '../hr/ErrorState';
import { CheckCircle2 } from 'lucide-react';

interface HRDashboardViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

export const HRDashboardView: React.FC<HRDashboardViewProps> = ({ user, onNavigate }) => {
  const [data, setData] = useState<HRDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review modal state
  const [selectedActionToReview, setSelectedActionToReview] = useState<PendingActionItem | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const loadDashboardData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    setError(null);
    try {
      const response = await hrDashboardService.getDashboardData();
      setData(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch HR dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData(true);
  }, []);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handle Approve Action
  const handleApproveAction = async (actionId: string, note?: string) => {
    const res = await hrDashboardService.approveAction(actionId, note);
    if (res.success) {
      showToast(res.message || 'Action item approved and recorded in audit log.', 'success');
      loadDashboardData(false);
    }
  };

  // Handle Reject Action
  const handleRejectAction = async (actionId: string, reason?: string) => {
    const res = await hrDashboardService.rejectAction(actionId, reason);
    if (res.success) {
      showToast(res.message || 'Action item rejected and notified to employee.', 'info');
      loadDashboardData(false);
    }
  };

  // Handle KPI Click navigation
  const handleKpiFilter = (routeOrAction: string) => {
    if (routeOrAction === 'PENDING_ACTIONS') {
      const el = document.getElementById('hr-pending-actions-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate(routeOrAction);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <SkeletonLoader />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState message={error || undefined} onRetry={() => loadDashboardData(true)} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn" id="hr-dashboard-main-view">
      {/* Toast notification feedback */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#121318] border border-emerald-500/40 text-white text-xs shadow-2xl flex items-center gap-3 animate-scaleUp"
          id="hr-dashboard-toast"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white">Action Completed</div>
            <div className="text-slate-300 font-medium">{toastMessage.text}</div>
          </div>
        </div>
      )}

      {/* 1. Welcome Section (Section 4) */}
      <HRWelcomeSection adminName={user.name} />

      {/* 2. Primary KPI Cards (Section 5) - Exactly 6 cards */}
      <HRKpiGrid kpis={data.kpis} onSelectKpiFilter={handleKpiFilter} />

      {/* 3. Level 2: HR Action Center - Requires Your Attention (Section 8) */}
      <HRPendingActions
        pendingActions={data.pendingActions}
        onReviewAction={(action) => setSelectedActionToReview(action)}
        onNavigate={onNavigate}
      />

      {/* 4. Level 3: Attendance Overview (Section 6) */}
      <HRAttendanceOverview attendanceRecords={data.todayAttendance} onNavigate={onNavigate} />

      {/* 5. Working Hours Summary (Section 7) */}
      <HRWorkingHoursCard kpis={data.kpis} onNavigate={onNavigate} />

      {/* 6. Level 4: Bottom Grid - Recent Activity & Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <HRRecentActivity activities={data.recentActivities} onViewAll={() => onNavigate('/hr/tickets')} />
        </div>
        <div className="lg:col-span-6">
          <HRDepartmentOverview departments={data.departmentSummary} onNavigate={onNavigate} />
        </div>
      </div>

      {/* 7. Quick Actions Shortcuts (Section 11) */}
      <HRQuickActions onNavigate={onNavigate} />

      {/* Interactive Review Action Modal */}
      {selectedActionToReview && (
        <HRActionModal
          action={selectedActionToReview}
          onClose={() => setSelectedActionToReview(null)}
          onApprove={handleApproveAction}
          onReject={handleRejectAction}
        />
      )}
    </div>
  );
};
