import type { User } from "../types";
import type { ProfileAchievement, ProfileExperience } from "../types/profile";
import { api, getErrorMessage } from "./client";

export type PeerUserSnippet = {
  _id: string;
  name: string;
  profilePhoto?: string;
  role: string;
};

// ========== DEPARTMENT TYPES ==========
export interface Department {
  _id: string;
  name: string;
  code: string;
  description: string;
  programs?: string[];
  programCategories?: Record<string, string[]>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentStats {
  department: string;
  students: number;
  alumni: number;
  total: number;
}

export interface DashboardStats {
  users: {
    total: number;
    students: number;
    alumni: number;
    pendingAlumni: number;
    admins: number;
  };
  mentorship: {
    total: number;
    pending: number;
    completed: number;
    active: number;
  };
  jobs: {
    total: number;
    active: number;
    pending: number;
  };
  events: {
    total: number;
    upcoming: number;
  };
  charts: {
    departmentDistribution: Array<{ _id: string; count: number }>;
    monthlyRegistrations: Array<{ month: string; registrations: number }>;
    mentorshipByDepartment: Array<{ _id: string; count: number }>;
    userGrowth: Array<{ _id: { date: string; role: string }; count: number }>;
  };
}

// ========== EXISTING FUNCTIONS ==========
export async function getPeerUserApi(id: string): Promise<PeerUserSnippet> {
  try {
    const { data } = await api.get<PeerUserSnippet>(`/users/peer/${id}`);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load user"));
  }
}

export async function getAllUsersApi(): Promise<User[]> {
  try {
    const { data } = await api.get<
      { success: boolean; users: User[] } | User[]
    >("/users");
    return Array.isArray(data) ? data : data.users;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch users"));
  }
}

/** Omit `userId` for your own profile. */
export async function getProfileApi(userId?: string): Promise<User> {
  try {
    const { data } = await api.get<User>(userId ? `/users/${userId}` : "/profile");
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch profile"));
  }
}

export async function updateProfileApi(data: {
  name?: string;
  phone?: string;
  graduationYear?: string;
  university?: string;
  company?: string;
  position?: string;
  skills?: string[];
  interests?: string[];
  department?: string;
  registrationNumber?: string;
  program?: string;
  bio?: string;
  profilePhoto?: string;
  coverPhoto?: string;
  cvUrl?: string;
  headline?: string;
  location?: string;
  website?: string;
  industry?: string;
  yearsOfExperience?: string;
  careerGoals?: string;
  experiences?: ProfileExperience[];
  achievements?: ProfileAchievement[];
}): Promise<User> {
  try {
    const { data: user } = await api.put<User>("/profile/update", { ...data });
    return user;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to update profile"));
  }
}

export async function deleteUserApi(id: string): Promise<void> {
  try {
    await api.delete(`/admin/users/${id}`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to delete user"));
  }
}

export async function approveAlumniApi(id: string): Promise<void> {
  try {
    await api.put(`/admin/approve-alumni/${id}`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to approve alumni"));
  }
}

export async function changePasswordApi(payload: {
  currentPassword?: string;
  newPassword: string;
}): Promise<User> {
  try {
    const { data } = await api.put<{ user: User }>(
      "/profile/password",
      payload,
    );
    if (!data.user) throw new Error("Invalid response");
    return data.user;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to update password"));
  }
}

export async function inviteAdminApi(payload: {
  name: string;
  email: string;
  tempPassword: string;
}): Promise<void> {
  try {
    await api.post("/admin/invite-admin", payload);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to send invitation"));
  }
}

export async function uploadCvApi(
  file: File,
): Promise<{ cvUrl: string; user: User }> {
  try {
    const formData = new FormData();
    formData.append("cv", file);
    const { data } = await api.post<{ cvUrl: string; user: User }>("/cv", formData);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to upload CV"));
  }
}

export async function uploadPhotoApi(
  file: File,
): Promise<{ profilePhoto: string; user: User }> {
  try {
    const formData = new FormData();
    formData.append("photo", file);
    const { data } = await api.post<{ profilePhoto: string; user: User }>(
      "/profile/photo",
      formData,
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to upload photo"));
  }
}

export async function openCvInNewTab(): Promise<void> {
  try {
    const response = await api.get("/cv", {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const objectUrl = URL.createObjectURL(blob);
    const win = window.open(objectUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    if (!win)
      throw new Error("Popup blocked. Please allow popups for this site.");
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to open CV"));
  }
}

export interface ProfileStats {
  jobsApplied: number;
  appliedJobs: {
    _id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    status: string;
    createdAt: string;
  }[];
  connectionsCount: number;
  connectionsList: {
    _id: string;
    name: string;
    email: string;
    photo: string;
    company?: string;
    position?: string;
    graduationYear?: string;
    university?: string;
  }[];
  eventsJoined: number;
  eventsList: {
    _id: string;
    title: string;
    description: string;
    eventDate: string;
    location: string;
    organizer: string;
  }[];
}

export async function getProfileStatsApi(): Promise<ProfileStats> {
  try {
    const { data } = await api.get<ProfileStats>("/profile/stats");
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch profile stats"));
  }
}

// ========== NEW ADMIN DASHBOARD FUNCTIONS ==========
export async function getDashboardStatsApi(): Promise<DashboardStats> {
  try {
    const { data } = await api.get<{ success: boolean; stats: DashboardStats }>(
      "/admin/dashboard/stats",
    );
    if (!data.success) throw new Error("Failed to fetch dashboard stats");
    return data.stats;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load dashboard statistics"));
  }
}

export async function getMentorshipAnalyticsApi(): Promise<{
  analytics: Array<{ _id: string; count: number; avgMatchScore: number }>;
  topMentors: Array<{ name: string; department: string; menteeCount: number }>;
}> {
  try {
    const { data } = await api.get("/admin/dashboard/mentorship-analytics");
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch mentorship analytics"));
  }
}

// ========== DEPARTMENT APIS ==========
export async function getDepartmentsApi(): Promise<Department[]> {
  try {
    const { data } = await api.get<{
      success: boolean;
      departments: Department[];
    }>("/departments");
    return data.departments;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch departments"));
  }
}

export async function getAllDepartmentsApi(): Promise<Department[]> {
  try {
    const { data } = await api.get<{
      success: boolean;
      departments: Department[];
    }>("/admin/departments/all");
    return data.departments;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch all departments"));
  }
}

export async function createDepartmentApi(payload: {
  name: string;
  code: string;
  description?: string;
}): Promise<Department> {
  try {
    const { data } = await api.post<{
      success: boolean;
      department: Department;
    }>("/admin/departments", payload);
    if (!data.success) throw new Error("Failed to create department");
    return data.department;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to create department"));
  }
}

export async function updateDepartmentApi(
  id: string,
  payload: {
    name?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
  },
): Promise<Department> {
  try {
    const { data } = await api.put<{
      success: boolean;
      department: Department;
    }>(`/admin/departments/${id}`, payload);
    return data.department;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to update department"));
  }
}

export async function deleteDepartmentApi(id: string): Promise<void> {
  try {
    await api.delete(`/admin/departments/${id}`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to delete department"));
  }
}

export async function getDepartmentStatsApi(): Promise<DepartmentStats[]> {
  try {
    const { data } = await api.get<{
      success: boolean;
      stats: DepartmentStats[];
    }>("/admin/departments/stats");
    return data.stats;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch department stats"));
  }
}

// ========== ADMIN USER MANAGEMENT ==========
export async function getAllUsersAdminApi(filters?: {
  role?: string;
  department?: string;
  isApproved?: boolean;
  search?: string;
}): Promise<User[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.role) params.append("role", filters.role);
    if (filters?.department) params.append("department", filters.department);
    if (filters?.isApproved !== undefined)
      params.append("isApproved", String(filters.isApproved));
    if (filters?.search) params.append("search", filters.search);

    const url = `/admin/users${params.toString() ? `?${params.toString()}` : ""}`;
    const { data } = await api.get<{ success: boolean; users: User[] }>(url);
    return data.users;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch users"));
  }
}

export async function getPendingAlumniApi(): Promise<User[]> {
  try {
    const { data } = await api.get<{ success: boolean; alumni: User[] }>(
      "/admin/users/pending-alumni",
    );
    return data.alumni;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch pending alumni"));
  }
}
