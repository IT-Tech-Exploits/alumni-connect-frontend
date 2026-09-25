import mongoose, { type Model } from "mongoose";
import { USER_ROLES, STUDY_MODES, type UserRole } from "../db/ref.js";
import { useJsonContract } from "../db/json.js";

/**
 * Exploits University alumni-connect user. Mirrors src/types/user.ts `User`
 * (auth payload included) plus the roster/approval fields the admin screens
 * touch: registrationNumber, department, program, studyModeCode, campusCode,
 * entryYear, graduationYear, isApproved/pendingApproval, mustChangePassword.
 *
 * Note on `program` vs `programmeName`: the UI stores the programme *code*
 * ("BIT") in `User.program` and renders `User.programme` on the profile. We
 * therefore keep `program` = code and `programmeName` = display name, and
 * resolve the display name from `PROGRAMME_INFO` when it is missing.
 */

export interface EducationSubDoc {
  _id?: unknown;
  institution: string;
  programme: string;
  programmeCode?: string;
  department?: string;
  campus?: string;
  startYear?: string;
  graduationYear?: string;
  description?: string;
}

const educationSchema = new mongoose.Schema<EducationSubDoc>(
  {
    institution: { type: String, required: true },
    programme: { type: String, required: true },
    programmeCode: String,
    department: String,
    campus: String,
    startYear: String,
    graduationYear: String,
    description: String,
  },
  { _id: true },
);
useJsonContract(educationSchema);

export interface ExperienceSubDoc {
  _id?: unknown;
  title: string;
  company: string;
  employmentType?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

const experienceSchema = new mongoose.Schema<ExperienceSubDoc>(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    employmentType: String,
    location: String,
    startDate: { type: String, required: true },
    endDate: String,
    current: Boolean,
    description: String,
  },
  { _id: true },
);
useJsonContract(experienceSchema);

export interface AchievementSubDoc {
  _id?: unknown;
  title: string;
  description?: string;
  date?: string;
  organization?: string;
  icon?: string;
}

const achievementSchema = new mongoose.Schema<AchievementSubDoc>(
  {
    title: { type: String, required: true },
    description: String,
    date: String,
    organization: String,
    icon: String,
  },
  { _id: true },
);
useJsonContract(achievementSchema);

export interface AlumniUser {
  _id?: unknown;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  registrationNumber?: string;
  department?: string;
  /** Programme code, e.g. "BIT". */
  program?: string;
  /** Programme display name, e.g. "Bachelor of Information Technology". */
  programmeName?: string;
  studyModeCode?: string;
  campusCode?: string;
  entryYear?: string;
  graduationYear?: string;
  university?: string;
  profilePhoto?: string;
  coverPhoto?: string;
  cvUrl?: string;
  headline?: string;
  bio?: string;
  location?: string;
  website?: string;
  industry?: string;
  yearsOfExperience?: string;
  careerGoals?: string;
  company?: string;
  position?: string;
  skills: string[];
  interests: string[];
  education: EducationSubDoc[];
  experiences: ExperienceSubDoc[];
  achievements: AchievementSubDoc[];
  isApproved: boolean;
  pendingApproval?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const userSchema = new mongoose.Schema<AlumniUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, required: true, index: true },
    phone: String,
    registrationNumber: { type: String, index: true },
    department: { type: String, index: true },
    program: { type: String, index: true },
    programmeName: String,
    studyModeCode: { type: String, enum: STUDY_MODES },
    campusCode: { type: String, index: true },
    entryYear: String,
    graduationYear: { type: String, index: true },
    university: { type: String, default: "Exploits University" },
    profilePhoto: String,
    coverPhoto: String,
    cvUrl: String,
    headline: String,
    bio: String,
    location: String,
    website: String,
    industry: String,
    yearsOfExperience: String,
    careerGoals: String,
    company: String,
    position: String,
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    education: { type: [educationSchema], default: [] },
    experiences: { type: [experienceSchema], default: [] },
    achievements: { type: [achievementSchema], default: [] },
    isApproved: { type: Boolean, default: false, index: true },
    pendingApproval: { type: Boolean, default: false, index: true },
    mustChangePassword: { type: Boolean, default: false },
  },
  { timestamps: true },
);
// Directory + admin roster screens filter by role and free-text search.
userSchema.index({ name: "text", email: "text", registrationNumber: "text" });
userSchema.index({ role: 1, isApproved: 1, graduationYear: 1 });
useJsonContract(userSchema);

export const User: Model<AlumniUser> =
  mongoose.models.AlumniUser ??
  mongoose.model<AlumniUser>("AlumniUser", userSchema);
