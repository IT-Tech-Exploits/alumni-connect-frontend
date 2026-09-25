/**
 * Shared reference constants + enums for the `alumni-connect` database package.
 *
 * Mirrors the frontend reference data exactly (no cross-package imports) so the
 * Mongoose schemas and the seed stay in sync with what the UI renders.
 * Sources: src/types/*, src/data/departments.ts, src/data/mockProfiles.ts,
 * src/lib/gradYears.ts, src/lib/demoCode.ts.
 */

// ---------------------------------------------------------------------------
// Reference enums (mirror src/types/*)
// ---------------------------------------------------------------------------

export const USER_ROLES = ["student", "alumni", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CONNECTION_STATUSES = ["pending", "accepted", "rejected"] as const;
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export const POST_CATEGORIES = [
  "Achievement",
  "Career Update",
  "News",
  "General",
  "Event",
  "Job",
] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];

export const JOB_STATUSES = ["pending", "approved", "rejected"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_TYPES = ["full-time", "part-time", "internship", "remote"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const GROUP_CATEGORIES = ["Programme", "Campus", "Year", "Interest"] as const;
export type GroupCategory = (typeof GROUP_CATEGORIES)[number];

export const STUDY_MODES = ["NE", "ME"] as const;
export type StudyModeCode = (typeof STUDY_MODES)[number];
export const STUDY_MODE_NAMES: Record<StudyModeCode, string> = {
  NE: "Normal Entry",
  ME: "Mature Entry",
};

/** Recommendation relations offered by the write form (mirror recommendationApi). */
export const RECOMMENDATION_RELATIONS = [
  "mentor",
  "manager",
  "colleague",
  "mentee",
  "peer",
] as const;
export type RecommendationRelation = (typeof RECOMMENDATION_RELATIONS)[number];

export const RELATION_LABELS: Record<RecommendationRelation, string> = {
  mentor: "mentor",
  manager: "manager",
  colleague: "colleague",
  mentee: "mentee",
  peer: "peer",
};

/**
 * Mentorship lifecycle. Derived from the notification union in
 * src/types/notification.ts (request / accepted / rejected / completed).
 */
export const MENTORSHIP_STATUSES = ["pending", "accepted", "rejected", "completed"] as const;
export type MentorshipStatus = (typeof MENTORSHIP_STATUSES)[number];

/** Goals surfaced as match interests in src/api/mentorshipApi.ts. */
export const MENTORSHIP_GOALS = [
  "Career guidance",
  "Interview prep",
  "CV review",
  "Industry insights",
  "Referral",
] as const;
export type MentorshipGoal = (typeof MENTORSHIP_GOALS)[number];
export const DEFAULT_MENTORSHIP_GOAL: MentorshipGoal = "Career guidance";

/** Notification kinds the UI can render (mirror src/types/notification.ts). */
export const NOTIFICATION_TYPES = [
  "mentorship_request",
  "mentorship_accepted",
  "mentorship_rejected",
  "mentorship_completed",
  "new_message",
  "job_application",
  "job_approved",
  "event_reminder",
  "event_rsvp",
  "alumni_approved",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Roster claim states (mirror src/api/alumniRosterApi.ts RosterEntry.status). */
export const ROSTER_STATUSES = ["unclaimed", "claimed"] as const;
export type RosterStatus = (typeof ROSTER_STATUSES)[number];

// ---------------------------------------------------------------------------
// Dynamic graduation years (mirror src/lib/gradYears.ts)
// ---------------------------------------------------------------------------

const BASE_YEAR = 1990;
/** Years past the current year to offer for a student's expected graduation. */
const FUTURE_HORIZON = 9;

export function currentYear(): number {
  return new Date().getFullYear();
}

/** Upper bound of the graduation-year picker — always at least 2035. */
export function graduationMaxYear(): number {
  return Math.max(currentYear() + FUTURE_HORIZON, 2035);
}

/** Full range of graduation years (oldest -> newest). */
export function graduationYearRange(): number[] {
  const years: number[] = [];
  for (let y = BASE_YEAR; y <= graduationMaxYear(); y++) years.push(y);
  return years;
}

/** Future-facing years for a student's expected graduation: current..max. */
export function expectedGraduationYears(): number[] {
  const years: number[] = [];
  for (let y = currentYear(); y <= graduationMaxYear(); y++) years.push(y);
  return years;
}

/** Years an alumnus could actually have graduated: BASE_YEAR..current. */
export function alumniGraduationYears(): number[] {
  const years: number[] = [];
  for (let y = BASE_YEAR; y <= currentYear(); y++) years.push(y);
  return years;
}

// ---------------------------------------------------------------------------
// Campuses + study modes (mirror src/data/departments.ts)
// ---------------------------------------------------------------------------

export interface CampusInfo {
  code: string;
  name: string;
  city: string;
}

export const CAMPUSES: CampusInfo[] = [
  { code: "BT", name: "Blantyre Campus", city: "Blantyre" },
  { code: "LL", name: "Lilongwe Campus", city: "Lilongwe" },
  { code: "MZ", name: "Mzuzu Campus", city: "Mzuzu" },
];

export function campusNameFor(code?: string): string {
  if (!code) return "";
  return CAMPUSES.find((c) => c.code === code)?.name ?? code;
}

// ---------------------------------------------------------------------------
// Programmes + departments (mirror src/data/departments.ts departmentSeeds)
// ---------------------------------------------------------------------------

export interface ProgrammeInfo {
  code: string;
  name: string;
  departmentId: string;
  duration: number;
}

export const PROGRAMME_INFO: ProgrammeInfo[] = [
  { code: "BCS", name: "BSc Computer Science", departmentId: "dep-computer-science", duration: 4 },
  { code: "BCY", name: "BSc Cyber Security", departmentId: "dep-computer-science", duration: 4 },
  { code: "BIT", name: "Bachelor of Information Technology", departmentId: "dep-information-technology", duration: 4 },
  { code: "BNE", name: "BSc Network Engineering", departmentId: "dep-information-technology", duration: 4 },
  { code: "BCL", name: "BSc Cloud Computing", departmentId: "dep-information-technology", duration: 4 },
  { code: "BSE", name: "BSc Software Engineering", departmentId: "dep-software-engineering", duration: 4 },
  { code: "BMO", name: "BSc Mobile Computing", departmentId: "dep-software-engineering", duration: 4 },
  { code: "BBA", name: "Bachelor of Business Administration", departmentId: "dep-business-management", duration: 4 },
  { code: "BMR", name: "BCom Marketing Management", departmentId: "dep-business-management", duration: 4 },
  { code: "BAC", name: "BSc Accounting", departmentId: "dep-accounting-finance", duration: 4 },
  { code: "BFC", name: "BSc Finance", departmentId: "dep-accounting-finance", duration: 4 },
];

export function programmeFor(code?: string): ProgrammeInfo | undefined {
  if (!code) return undefined;
  return PROGRAMME_INFO.find((p) => p.code === code);
}

export function programmeNameFor(code?: string): string {
  if (!code) return "";
  return programmeFor(code)?.name ?? code;
}

export function programmeDurationFor(code?: string): number | undefined {
  return programmeFor(code)?.duration;
}

// ---------------------------------------------------------------------------
// Departments (+ owning programmes) — mirrors src/data/departments.ts
// ---------------------------------------------------------------------------

export interface DepartmentSeed {
  _id: string;
  name: string;
  code: string;
  description: string;
  /** Programme codes owned by the department. */
  programmeCodes: string[];
  /** Programme names, as the frontend `Department.programs` list renders them. */
  programs: string[];
  programCategories: Record<string, string[]>;
}

export const DEPARTMENT_SEEDS: DepartmentSeed[] = [
  {
    _id: "dep-computer-science",
    name: "Computer Science",
    code: "CS",
    description:
      "Advanced computing fundamentals — algorithms, artificial intelligence, cyber security and system architecture.",
    programmeCodes: ["BCS", "BCY"],
    programs: ["BSc Computer Science", "BSc Cyber Security"],
    programCategories: { BSc: ["BSc Computer Science", "BSc Cyber Security"] },
  },
  {
    _id: "dep-information-technology",
    name: "Information Technology",
    code: "IT",
    description:
      "Applied IT skills — networking, database administration, cloud infrastructure and enterprise systems.",
    programmeCodes: ["BIT", "BNE", "BCL"],
    programs: [
      "Bachelor of Information Technology",
      "BSc Network Engineering",
      "BSc Cloud Computing",
    ],
    programCategories: {
      BSc: ["BSc Network Engineering", "BSc Cloud Computing"],
    },
  },
  {
    _id: "dep-software-engineering",
    name: "Software Engineering",
    code: "SE",
    description:
      "Engineering-grade software development — full-stack design, mobile computing, DevOps and quality assurance.",
    programmeCodes: ["BSE", "BMO"],
    programs: ["BSc Software Engineering", "BSc Mobile Computing"],
    programCategories: { BSc: ["BSc Software Engineering", "BSc Mobile Computing"] },
  },
  {
    _id: "dep-business-management",
    name: "Business Management",
    code: "BM",
    description:
      "Modern management practice — entrepreneurship, marketing, operations and organisational leadership.",
    programmeCodes: ["BBA", "BMR"],
    programs: ["Bachelor of Business Administration", "BCom Marketing Management"],
    programCategories: { BCom: ["BCom Marketing Management"] },
  },
  {
    _id: "dep-accounting-finance",
    name: "Accounting & Finance",
    code: "AF",
    description:
      "Financial stewardship — financial accounting, auditing, taxation and corporate finance.",
    programmeCodes: ["BAC", "BFC"],
    programs: ["BSc Accounting", "BSc Finance"],
    programCategories: { BSc: ["BSc Accounting", "BSc Finance"] },
  },
];

export function departmentSeedFor(idOrName?: string): DepartmentSeed | undefined {
  if (!idOrName) return undefined;
  return DEPARTMENT_SEEDS.find(
    (d) => d._id === idOrName || d.name === idOrName || d.code === idOrName,
  );
}

/** Department name for a programme code — the value `User.department` holds. */
export function departmentForProgramme(code?: string): string {
  return departmentSeedFor(programmeFor(code)?.departmentId)?.name ?? "General";
}

/** Department id (matches the frontend `Department._id`) for a programme code. */
export function departmentIdForProgramme(code?: string): string {
  return programmeFor(code)?.departmentId ?? "dep-computer-science";
}

// ---------------------------------------------------------------------------
// Student ID helpers (mirror parseStudentId in src/data/departments.ts)
// ---------------------------------------------------------------------------

export const STUDENT_ID_PATTERN = /^([A-Z]{2,4})\/(\d{2})\/([A-Z]{2})\/([A-Z]{2})\/(\d{3})$/;

export interface ParsedStudentId {
  programmeCode: string;
  programmeName: string;
  entryYear: number;
  campusCode: string;
  campusName: string;
  modeCode: string;
  modeName: string;
  sequence: string;
}

export function parseStudentId(id: string): ParsedStudentId | null {
  const match = STUDENT_ID_PATTERN.exec(id.trim().toUpperCase());
  if (!match) return null;
  const [, programmeCode, entryYear, campusCode, modeCode, sequence] = match;
  return {
    programmeCode,
    programmeName: programmeNameFor(programmeCode),
    entryYear: 2000 + Number(entryYear),
    campusCode,
    campusName: campusNameFor(campusCode),
    modeCode,
    modeName: STUDY_MODE_NAMES[modeCode as StudyModeCode] ?? modeCode,
    sequence,
  };
}

// ---------------------------------------------------------------------------
// Common reference data (skills / interests / achievements)
// ---------------------------------------------------------------------------

export const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL",
  "Java", "AWS", "DevOps", "Leadership", "Public Speaking", "Mentoring",
  "Data Analysis", "Project Management", "Communication",
];

export const COMMON_INTERESTS = [
  "Mentorship", "Software", "Career Growth", "Networking", "Entrepreneurship",
  "AI/ML", "Cloud", "Finance", "Teaching", "Community Service",
];

export const SAMPLE_ACHIEVEMENTS = [
  "Dean's List", "Best Graduating Student", "Hackathon Winner", "Published Research",
  "National Athlete", "Class Representative", "Treasurer", "Peer Mentor",
];

// ---------------------------------------------------------------------------
// Demo + OTP constants (mirror src/lib/demoCode.ts DEMO_CODE + demoLogins)
// ---------------------------------------------------------------------------

export const DEMO_CODE = "482913";

export const DEMO_CREDENTIALS = [
  { role: "admin", email: "admin@exploits.ac.zw", password: "admin123", label: "Administrator" },
  { role: "alumni", email: "alumni1@exploits.ac.zw", password: "alumni123", label: "Alumni" },
  { role: "student", email: "student1@exploits.ac.zw", password: "student123", label: "Student" },
] as const;
