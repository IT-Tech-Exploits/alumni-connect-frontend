export type UserRole = "student" | "alumni" | "admin";

import type { ProfileAchievement, ProfileExperience } from "./profile";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  graduationYear?: string;
  university?: string;
  profilePhoto?: string;
  company?: string;
  position?: string;
  skills?: string[];
  bio?: string;
  cvUrl?: string;
  isApproved?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  // NEW FIELDS
  registrationNumber?: string;
  department?: string;
  program?: string;
  interests?: string[];
  // PROFESSIONAL PROFILE (LinkedIn-inspired)
  headline?: string;
  location?: string;
  coverPhoto?: string;
  website?: string;
  industry?: string;
  yearsOfExperience?: string;
  careerGoals?: string;
  experiences?: ProfileExperience[];
  achievements?: ProfileAchievement[];
}

export interface AuthUser extends User {
  token: string;
}
