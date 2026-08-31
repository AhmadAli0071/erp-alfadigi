import React, { useState, useEffect, useCallback } from 'react';
import {
  ReportCategory,
  ReportFilterParams,
  ReportQueryResult,
} from '../../types/report';
import { reportService } from '../../services/reportService';
import { HRReportCategoryGrid } from './HRReportCategoryGrid';
import { HRReportFilterBar } from './HRReportFilterBar';
import { HRReportPreviewTable } from './HRReportPreviewTable';
import { HRExportModal } from './HRExportModal';
import { BarChart3, RefreshCw, ArrowLeft } from 'lucide-react';

interface HRReportsViewProps {
  onNavigateToDashboard?: () => void;
}

export const HRReportsView: React.FC<HRReportsViewProps> = ({ onNavigateToDashboard }) => {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('attendance');

  const [filters, setFilters] = useState<ReportFilterParams>({
    category: 'attendance',
    datePreset: 'this_month',
    department: 'ALL',
    status: 'ALL',
    leaveType: 'ALL',
    page: 1,
    pageSize: 20,
  });

  const [reportResult, setReportResult] = useState<ReportQueryResult>({
    category: 'attendance',
    records: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    dateRangeLabel: 'This Month',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await reportService.getReportData({
        ...filters,
        category: selectedCategory,
      });
      setReportResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load report.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedCategory]);

  useEffect(() => {
    fetchReport();
  }, [filters, selectedCategory]);

  const handleCategorySelect = (cat: ReportCategory) => {
    setSelectedCategory(cat);
    setFilters((prev) => ({
      ...prev,
      category: cat,
      page: 1,
    }));
  };

  const handleFilterChange = (newFilters: Partial<ReportFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: selectedCategory,
      datePreset: 'this_month',
      department: 'ALL',
      status: 'ALL',
      leaveType: 'ALL',
      page: 1,
      pageSize: 20,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="hr-reports-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onNavigateToDashboard && (
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 md:hidden"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Generate and analyze comprehensive workforce, attendance, and leave audit reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchReport}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 transition-colors disabled:opacity-40 text-xs font-semibold"
            title="Refresh Report Data"
            id="report-refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Report Categories Selection Grid */}
      <HRReportCategoryGrid
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />

      {/* Contextual Filters Bar */}
      <HRReportFilterBar
        category={selectedCategory}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Preview Table */}
      <HRReportPreviewTable
        category={selectedCategory}
        records={reportResult.records}
        isLoading={isLoading}
        error={error}
        dateRangeLabel={reportResult.dateRangeLabel}
        page={reportResult.page}
        pageSize={reportResult.pageSize}
        totalCount={reportResult.totalCount}
        totalPages={reportResult.totalPages}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onRetry={fetchReport}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Export Modal */}
      <HRExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        category={selectedCategory}
        data={reportResult.records}
        dateRangeLabel={reportResult.dateRangeLabel}
      />
    </div>
  );
};
