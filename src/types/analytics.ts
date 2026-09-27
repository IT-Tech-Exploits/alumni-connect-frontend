/**
 * Analytics domain types. The numbers come from the admin analytics endpoint
 * (`GET /admin/analytics`), never from local seed data.
 */

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  userType?: "all" | "student" | "alumni";
  department?: string;
  programme?: string;
  entryYear?: number | "all";
  graduationYear?: number | "all";
  campus?: string;
  entryType?: string;
}

export interface AnalyticsFilterOptions {
  campuses: string[];
  entryTypes: string[];
  entryYears: number[];
  graduationYears: number[];
}

export interface AnalyticsDataset {
  studentsVsAlumni: Array<{ name: string; value: number }>;
  newRegistrations: Array<{ month: string; students: number; alumni: number }>;
  activeUsers: Array<{ month: string; count: number }>;
  alumniByDepartment: Array<{ name: string; count: number }>;
  usersByProgramme: Array<{ name: string; count: number }>;
  graduationDistribution: Array<{ name: string; count: number }>;
  campusDistribution: Array<{ name: string; value: number }>;
  engagement: {
    posts: number;
    likes: number;
    comments: number;
    connections: number;
    eventParticipants: number;
    mentorship: number;
  };
  engagementTrend: Array<{
    month: string;
    posts: number;
    connections: number;
    mentorships: number;
  }>;
  career: {
    jobsPosted: number;
    applications: number;
    savedJobs: number;
    pendingJobs: number;
    hires: number;
  };
  applicationsByJob: Array<{ name: string; value: number }>;
}
