import {
  ReportCategory,
  ReportFilterParams,
  ReportQueryResult,
  ReportRow,
} from '../types/report';

const API_BASE = '/api';

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

class ReportService {
  /**
   * Fetches report data from the backend based on category and filters.
   */
  public async getReportData(params: ReportFilterParams): Promise<ReportQueryResult> {
    const {
      category,
      datePreset = 'this_month',
      startDate,
      endDate,
      department,
      status,
      leaveType,
      searchQuery,
      page = 1,
      pageSize = 20,
    } = params;

    const query = new URLSearchParams({
      category,
      datePreset,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (startDate) query.set('startDate', startDate);
    if (endDate) query.set('endDate', endDate);
    if (department && department !== 'ALL') query.set('department', department);
    if (status && status !== 'ALL') query.set('status', status);
    if (leaveType && leaveType !== 'ALL') query.set('leaveType', leaveType);
    if (searchQuery && searchQuery.trim()) query.set('searchQuery', searchQuery.trim());

    const res = await fetch(`${API_BASE}/reports?${query.toString()}`, { headers: getHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Unable to load report data.');
    }

    return {
      category: (data.category || category) as ReportCategory,
      records: (data.records || []) as ReportRow[],
      totalCount: data.totalCount || 0,
      page: data.page || page,
      pageSize: data.pageSize || pageSize,
      totalPages: data.totalPages || 1,
      dateRangeLabel: data.dateRangeLabel || datePreset,
    };
  }

  private toCsvValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }

  private buildCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const lines = rows.map((row) => headers.map((h) => this.toCsvValue(row[h])).join(','));
    return [headers.join(','), ...lines].join('\r\n');
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private buildHtmlTable(rows: Record<string, unknown>[], title: string, forPrint: boolean): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const cellStyle = 'border:1px solid #cbd5e1;padding:6px 10px;font-size:12px;text-align:left;';
    const head = headers
      .map((h) => `<th style="${cellStyle}background:#f37221;color:#ffffff;">${this.escapeHtml(h)}</th>`)
      .join('');
    const body = rows
      .map(
        (row) =>
          `<tr>${headers
            .map((h, i) => `<td style="${cellStyle}${i % 2 === 1 ? 'background:#f8fafc;' : ''}">${this.escapeHtml(row[h])}</td>`)
            .join('')}</tr>`
      )
      .join('');
    const headerBlock = `<div style="font-family:Arial,sans-serif;margin-bottom:12px;">
      <h1 style="font-size:18px;margin:0;color:#1e293b;">Alfa Digi ERP — ${this.escapeHtml(title)} Report</h1>
      <p style="font-size:11px;color:#64748b;margin:4px 0 0;">Generated on ${new Date().toLocaleString()} · ${rows.length} rows</p>
    </div>`;
    const table = `<table style="border-collapse:collapse;font-family:Arial,sans-serif;"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;

    if (!forPrint) {
      return `<html><head><meta charset="utf-8" /></head><body>${headerBlock}${table}</body></html>`;
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${this.escapeHtml(title)} Report</title>
      <style>@page { size: A4 landscape; margin: 12mm; }</style>
      </head><body onload="window.print()">${headerBlock}${table}</body></html>`;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export report into desired format (CSV, Excel, PDF).
   * CSV/Excel download directly; PDF opens a print-ready window (browser "Save as PDF").
   */
  public async exportReport(
    category: ReportCategory,
    format: 'csv' | 'excel' | 'pdf',
    data: ReportRow[]
  ): Promise<{ success: boolean; message: string }> {
    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'No data available to export.',
      };
    }

    const rows = data as unknown as Record<string, unknown>[];
    const stamp = new Date().toISOString().split('T')[0];
    const filename = `alfadigi_${category}_report_${stamp}`;

    try {
      if (format === 'csv') {
        const csv = '\uFEFF' + this.buildCsv(rows);
        this.downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`);
      } else if (format === 'excel') {
        const html = this.buildHtmlTable(rows, category, false);
        this.downloadBlob(
          new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel' }),
          `${filename}.xls`
        );
      } else {
        const html = this.buildHtmlTable(rows, category, true);
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          return {
            success: false,
            message: 'Popup blocked. Allow popups to export as PDF.',
          };
        }
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
      }

      return {
        success: true,
        message: `${category.toUpperCase()} report exported successfully as ${format.toUpperCase()}.`,
      };
    } catch (err) {
      console.error('Export report error:', err);
      return {
        success: false,
        message: `Unable to export the ${format.toUpperCase()} file.`,
      };
    }
  }
}

export const reportService = new ReportService();
