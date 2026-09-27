/**
 * Profile-domain types for the LinkedIn-inspired profile experience.
 * All profile data is served by the backend API.
 */

import type { User } from "./user";

export interface ProfileExperience {
  _id: string;
  title: string;
  company: string;
  employmentType?: string;
  location?: string;
  /** ISO date (yyyy-mm or full date). */
  startDate: string;
  /** ISO date; omit when the role is current. */
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface ProfileEducation {
  _id: string;
  institution: string;
  programme: string;
  department?: string;
  campus?: string;
  startYear?: string;
  graduationYear?: string;
  description?: string;
}

export interface ProfileAchievement {
  _id: string;
  title: string;
  description?: string;
  date?: string;
  organization?: string;
  icon?: string;
}

export type ProfileActivityType =
  | "post"
  | "comment"
  | "reaction"
  | "connection"
  | "event"
  | "job"
  | "profile"
  | "skill"
  | "experience"
  | "achievement";

export interface ProfileActivity {
  _id: string;
  type: ProfileActivityType;
  title: string;
  description?: string;
  timestamp: string;
}

export interface ProfileConnectionPresence {
  _id: string;
  name: string;
  profilePhoto?: string;
  headline?: string;
  program?: string;
  graduationYear?: string;
  company?: string;
  position?: string;
  mutual?: number;
  since?: string;
}

export interface ProfileSuggestion {
  _id: string;
  name: string;
  profilePhoto?: string;
  headline?: string;
  position?: string;
  company?: string;
  program?: string;
  graduationYear?: string;
  sharedConnections?: number;
}

export type ConnectionStatus = "none" | "pending" | "accepted" | "outgoing";

export interface ProfileSuggestions {
  peopleYouMayKnow: ProfileSuggestion[];
  similarProfessionals: ProfileSuggestion[];
}

export interface PublicProfile {
  user: User;
  isStudent: boolean;
  headline: string;
  location: string;
  coverPhoto: string;
  programme: string;
  department: string;
  campus: string;
  graduationYear: string;
  profileCompletion: number;
  connectionsCount: number;
}