import React, { useState } from 'react';
import { ReportCategory, ReportRow } from '../../types/report';
import { reportService } from '../../services/reportService';
import {
  X,
  FileSpreadsheet,
  FileText,
  File,
  Download,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface HRExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ReportCategory;
  data: ReportRow[];
  dateRangeLabel: string;
}

export const HRExportModal: React.FC<HRExportModalProps> = ({
  isOpen,
  onClose,
  category,
  data,
  dateRangeLabel,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  );

  if (!isOpen) return null;

  const hasData = data && data.length > 0;

  const handleExport = async () => {
    if (!hasData) {
      setNotice({
        type: 'error',
        message: 'No data available to export.',
      });
      return;
    }

    try {
      setIsExporting(true);
      setNotice(null);
      const res拼 = await reportService.exportReport(category, selectedFormat, data);
      if (res拼.success) {
        setNotice({ type: 'success', message: res拼.message });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setNotice({ type: 'error', message: res拼.message });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const formats = [
    {
      id: 'excel' as const,
      name: 'Microsoft Excel (.xlsx)',
      description: 'Structured spreadsheet format with formulas and table headers',
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 'csv' as const,
      name: 'CSV Document (.csv)',
      description: 'Universal comma-separated tabular data file for data processing',
      icon: <FileText className="w-5 h-5 text-indigo-400" />,
    },
    {
      id: 'pdf' as const,
      name: 'PDF Document (.pdf)',
      description: 'Print-ready formatted document with Alfa Digi ERP header styling',
      icon: <File className="w-5 h-5 text-rose-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-[#0f1017] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        id="hr-report-export-modal"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Export Report</h3>
              <p className="text-[11px] text-slate-400">{category.toUpperCase()} • {dateRangeLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {!hasData && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No data available to export for the currently selected filters.</span>
            </div>
          )}

          {notice && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                notice.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{notice.message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Choose Export Format</label>
            <div className="space-y-2">
              {formats.map((fmt) => (
                <div
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                    selectedFormat === fmt.id
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-white/5 shrink-0">{fmt.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">{fmt.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{fmt.description}</div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedFormat === fmt.id
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-white/20'
                    }`}
                  >
                    {selectedFormat === fmt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2.5 bg-white/[0.01]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!hasData || isExporting}
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
            id="confirm-export-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export File'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
