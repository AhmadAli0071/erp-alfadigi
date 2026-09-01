import { LeadDashboardData } from '../types/lead';

class LeadDashboardService {
  public async getLeadDashboardData(_department: string): Promise<LeadDashboardData> {
    await new Promise((resolve) => setTimeout(resolve, 150));

    return {
      teamMembers: [],
      todayAttendance: [],
      kpis: [],
      attentionItems: [],
      recentActivities: [],
    };
  }
}

export const leadDashboardService = new LeadDashboardService();
