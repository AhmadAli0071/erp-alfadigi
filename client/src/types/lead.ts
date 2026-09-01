import React from 'react';

export type LeadDepartment = 'Sales' | 'Tech' | string;

export interface LeadTeamMember {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  avatar?: string;
}

export interface LeadAttendanceRecord {
  employeeId: string;
  employeeName: string;
  status: 'Present' | 'Absent' | 'Late' | 'On Leave' | 'Work From Home' | 'Half Day' | 'Pending OT' | 'Short Hours';
  clockIn: string | null;
  workingHours: string | null;
  currentPosition: string;
}

export interface LeadKPIMetric {
  id: string;
  title: string;
  value: number | string;
  context: string;
  icon: React.ReactNode;
  tag: { label: string; color: string };
}

export interface LeadAttentionItem {
  id: string;
  title: string;
  description: string;
  count: number;
  route: string;
  iconColor: string;
}

export interface LeadActivityItem {
  id: string;
  title: string;
  timestamp: string;
}

export interface LeadDashboardData {
  teamMembers: LeadTeamMember[];
  todayAttendance: LeadAttendanceRecord[];
  kpis: LeadKPIMetric[];
  attentionItems: LeadAttentionItem[];
  recentActivities: LeadActivityItem[];
}
