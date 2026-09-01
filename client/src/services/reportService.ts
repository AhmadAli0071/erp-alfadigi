import {
  ReportCategory,
  ReportFilterParams,
  ReportQueryResult,
  ReportRow,
} from '../types/report';
import { getDateRangeFromPreset } from './hrAttendanceGenerator';

class ReportService {
  // In-memory reports repository (baseline: empty)
  private attendanceRecords: any[] = [];
  private leaveRecords: any[] = [];
  private overtimeRecords: any[] = [];
  private employeeRecords: any[] = [];
  private departmentRecords: any[] = [];
  private activityRecords: any[] = [];

  /**
   * Fetches report data based on selected category and filters.
   * Strictly returns empty records when no backend data exists.
   */
  public async getReportData(
    params: ReportFilterParams,
    simulateError = false
  ): Promise<ReportQueryResult> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (simulateError) {
      throw new Error('Unable to load report data.');
    }

    const {
      category,
      datePreset = 'this_month',
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = params;

    const { label: dateRangeLabel } = getDateRangeFromPreset(
      datePreset,
      startDate,
      endDate
    );

    let rawRecords: ReportRow[] = [];

    switch (category) {
      case 'attendance':
        rawRecords = [...this.attendanceRecords];
        break;
      case 'leave':
        rawRecords = [...this.leaveRecords];
        break;
      case 'overtime':
        rawRecords = [...this.overtimeRecords];
        break;
      case 'employee':
        rawRecords = [...this.employeeRecords];
        break;
      case 'department':
        rawRecords = [...this.departmentRecords];
        break;
      case 'activity':
        rawRecords = [...this.activityRecords];
        break;
      default:
        rawRecords = [];
    }

    const totalCount = rawRecords.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const paginated = rawRecords.slice(startIndex, startIndex + pageSize);

    return {
      category,
      records: paginated,
      totalCount,
      page: safePage,
      pageSize,
      totalPages,
      dateRangeLabel,
    };
  }

  /**
   * Export report into desired format (CSV, Excel, PDF).
   */
  public async exportReport(
    category: ReportCategory,
    format: 'csv' | 'excel' | 'pdf',
    data: ReportRow[]
  ): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'No data available to export.',
      };
    }

    // When real data exists in future, triggers file download blob
    return {
      success: true,
      message: `${category.toUpperCase()} report exported successfully as ${format.toUpperCase()}.`,
    };
  }
}

export const reportService = new ReportService();
