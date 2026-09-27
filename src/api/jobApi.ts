import type { Job } from "../types";
import { api, getErrorMessage } from "./client";

export async function getJobsApi(): Promise<Job[]> {
  try {
    const { data } = await api.get("/jobs");
    return Array.isArray(data) ? data : (data.jobs ?? []);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch jobs"));
  }
}

export async function createJobApi(data: Partial<Job>): Promise<Job> {
  try {
    const { data: job } = await api.post<Job>("/jobs", data);
    return job;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to create job"));
  }
}

export async function updateJobApi(
  id: string,
  data: Partial<Job>,
): Promise<Job> {
  try {
    const { data: updatedJob } = await api.put<Job>(`/jobs/${id}`, data);
    return updatedJob;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to update job"));
  }
}

export async function deleteJobApi(id: string): Promise<void> {
  try {
    await api.delete(`/jobs/${id}`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to delete job"));
  }
}

export async function approveJobApi(id: string): Promise<void> {
  try {
    await api.put(`/admin/approve-job/${id}`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to approve job"));
  }
}

export async function applyJobApi(id: string): Promise<void> {
  try {
    await api.post(`/jobs/${id}/apply`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to apply"));
  }
}

export interface JobStats {
  totalAvailable: number;
  applied: number;
  remaining: number;
}

export const getJobStatsApi = async (): Promise<JobStats> => {
  try {
    const { data } = await api.get<{ success: boolean; stats: JobStats }>(
      "/jobs/stats",
    );
    return data.stats;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load job stats"));
  }
};

// ── Job referrals (alumni → students) ─────────────────────────────────────────

export interface JobReferral {
  jobId: string;
  studentId: string;
  note: string;
  referrerId: string;
  createdAt: string;
}

export async function referStudentApi(
  jobId: string,
  studentId: string,
  note: string,
): Promise<JobReferral> {
  try {
    const { data } = await api.post<JobReferral>(`/jobs/${jobId}/refer`, {
      studentId,
      note,
    });
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Could not submit referral"));
  }
}

/** True when the current user has already referred the given job. */
export async function hasReferredApi(jobId: string): Promise<boolean> {
  try {
    const { data } = await api.get<{ referred: boolean }>(
      `/jobs/${jobId}/refer-status`,
    );
    return data.referred;
  } catch {
    return false;
  }
}
