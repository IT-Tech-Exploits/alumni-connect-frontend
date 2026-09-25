import mongoose, { type Model, type Types as MongooseTypes } from "mongoose";
import {
  DEPARTMENT_SEEDS,
  MENTORSHIP_GOALS,
  MENTORSHIP_STATUSES,
  ROSTER_STATUSES,
  type MentorshipGoal,
  type MentorshipStatus,
  type RosterStatus,
} from "../db/ref.js";
import { useJsonContract } from "../db/json.js";

// ---------------------------------------------------------------------------
// Mentorship request (mirror src/api/mentorshipApi.ts + the mentorship_*
// notification kinds in src/types/notification.ts)
// ---------------------------------------------------------------------------

export interface MentorshipRequest {
  _id: MongooseTypes.ObjectId;
  menteeId: MongooseTypes.ObjectId;
  mentorId: MongooseTypes.ObjectId;
  menteeName: string;
  menteePhoto?: string;
  mentorName: string;
  mentorRole: string;
  mentorPhoto?: string;
  status: MentorshipStatus;
  goal: MentorshipGoal;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
}

const mentorshipSchema = new mongoose.Schema<MentorshipRequest>(
  {
    menteeId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, index: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, index: true },
    menteeName: { type: String, required: true },
    menteePhoto: String,
    mentorName: { type: String, required: true },
    mentorRole: { type: String, required: true },
    mentorPhoto: String,
    status: { type: String, enum: MENTORSHIP_STATUSES, default: "pending", index: true },
    goal: { type: String, enum: MENTORSHIP_GOALS, required: true },
    message: String,
  },
  { timestamps: true },
);
// One live request per mentee/mentor pair; resolved pairs stay queryable by status.
mentorshipSchema.index({ menteeId: 1, mentorId: 1, status: 1, createdAt: -1 });
// Admin dashboard: total / pending / active / completed counters.
mentorshipSchema.index({ status: 1, createdAt: -1 });
useJsonContract(mentorshipSchema);

export const MentorshipModel: Model<MentorshipRequest> =
  mongoose.models.MentorshipRequest ?? mongoose.model<MentorshipRequest>("MentorshipRequest", mentorshipSchema);

// ---------------------------------------------------------------------------
// CV roster (one row per alumnus whose CV an admin can approve / view)
// ---------------------------------------------------------------------------

export interface CvRosterRow {
  _id: MongooseTypes.ObjectId;
  userId: MongooseTypes.ObjectId;
  name: string;
  email: string;
  position?: string;
  role: string;
  department?: string;
  /** Programme code, matching `AlumniUser.program`. */
  program?: string;
  campus?: string;
  graduationYear?: string;
  contact?: string;
  approved: boolean;
  approvedAt?: string;
  cvUrl?: string;
  createdAt?: string;
}

const cvRosterRowSchema = new mongoose.Schema<CvRosterRow>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    position: String,
    role: { type: String, required: true },
    department: String,
    program: String,
    campus: String,
    graduationYear: String,
    contact: String,
    approved: { type: Boolean, default: false, index: true },
    approvedAt: String,
    cvUrl: String,
  },
  { timestamps: true },
);
cvRosterRowSchema.index({ approved: 1, createdAt: -1 });
useJsonContract(cvRosterRowSchema);

export const CvRosterModel: Model<CvRosterRow> =
  mongoose.models.CvRosterRow ?? mongoose.model<CvRosterRow>("CvRosterRow", cvRosterRowSchema);

// ---------------------------------------------------------------------------
// Alumni roster (mirror src/api/alumniRosterApi.ts)
// One document per known alumnus, keyed by the sanitised registration number
// ("BIT/24/BT/NE/009" -> "BIT-24-BT-NE-009"). A registering alumnus whose
// number is present claims the entry and is auto-approved.
// ---------------------------------------------------------------------------

export interface AlumniRosterEntry {
  _id: string;
  registrationNumber: string;
  fullName: string;
  department?: string;
  program?: string;
  graduationYear?: string;
  email?: string;
  status: RosterStatus;
  claimedBy?: MongooseTypes.ObjectId | null;
  claimedAt?: Date | null;
  importBatchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const alumniRosterEntrySchema = new mongoose.Schema<AlumniRosterEntry>(
  {
    _id: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    fullName: { type: String, required: true, index: true },
    department: String,
    program: String,
    graduationYear: String,
    email: { type: String, lowercase: true, trim: true },
    status: { type: String, enum: ROSTER_STATUSES, default: "unclaimed", index: true },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser", default: null },
    claimedAt: { type: Date },
    importBatchId: { type: String, index: true },
  },
  { timestamps: true },
);
// Roster list: filter by claim state, newest first.
alumniRosterEntrySchema.index({ status: 1, _id: 1 });
useJsonContract(alumniRosterEntrySchema);

export const AlumniRosterModel: Model<AlumniRosterEntry> =
  mongoose.models.AlumniRosterEntry ??
  mongoose.model<AlumniRosterEntry>("AlumniRosterEntry", alumniRosterEntrySchema);

/** Registration number -> document id, as the import + claim paths compute it. */
export function rosterIdFor(registrationNumber: string): string {
  return registrationNumber.trim().toUpperCase().replace(/\//g, "-");
}

export interface RosterImportBatch {
  _id: MongooseTypes.ObjectId;
  fileName: string;
  uploadedBy?: MongooseTypes.ObjectId;
  uploadedByEmail?: string;
  dryRun: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  created: number;
  updated: number;
  skippedClaimed: number;
  createdAt?: string;
  updatedAt?: string;
}

const rosterImportBatchSchema = new mongoose.Schema<RosterImportBatch>(
  {
    fileName: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniUser" },
    uploadedByEmail: String,
    dryRun: { type: Boolean, default: false },
    totalRows: { type: Number, default: 0 },
    validRows: { type: Number, default: 0 },
    errorRows: { type: Number, default: 0 },
    created: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    skippedClaimed: { type: Number, default: 0 },
  },
  { timestamps: true },
);
rosterImportBatchSchema.index({ createdAt: -1 });
useJsonContract(rosterImportBatchSchema);

export const RosterImportBatchModel: Model<RosterImportBatch> =
  mongoose.models.RosterImportBatch ??
  mongoose.model<RosterImportBatch>("RosterImportBatch", rosterImportBatchSchema);

// ---------------------------------------------------------------------------
// Reference data documents (mirror src/data/departments.ts + the campus /
// study-mode filter options the admin analytics screens read)
// ---------------------------------------------------------------------------

export interface DepartmentDoc {
  _id: string;
  name: string;
  code: string;
  description: string;
  /** Programme names, as the UI renders them. */
  programs: string[];
  programCategories?: Record<string, string[]>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const departmentDocSchema = new mongoose.Schema<DepartmentDoc>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true },
    description: String,
    programs: { type: [String], default: [] },
    programCategories: { type: mongoose.Schema.Types.Mixed },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
useJsonContract(departmentDocSchema);

export const DepartmentModel: Model<DepartmentDoc> =
  mongoose.models.DepartmentDoc ?? mongoose.model<DepartmentDoc>("DepartmentDoc", departmentDocSchema);

export interface CampusDoc {
  _id: string;
  code: string;
  name: string;
  city: string;
}

const campusDocSchema = new mongoose.Schema<CampusDoc>(
  {
    _id: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    city: { type: String, required: true },
  },
  { timestamps: true },
);
useJsonContract(campusDocSchema);

export const CampusModel: Model<CampusDoc> =
  mongoose.models.CampusDoc ?? mongoose.model<CampusDoc>("CampusDoc", campusDocSchema);

export interface StudyModeDoc {
  _id: string;
  code: string;
  name: string;
}

const studyModeDocSchema = new mongoose.Schema<StudyModeDoc>(
  {
    _id: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
  },
  { timestamps: true },
);
useJsonContract(studyModeDocSchema);

export const StudyModeModel: Model<StudyModeDoc> =
  mongoose.models.StudyModeDoc ?? mongoose.model<StudyModeDoc>("StudyModeDoc", studyModeDocSchema);

/** Reference documents to upsert, so the filters always have their options. */
export function departmentDocuments(): Omit<DepartmentDoc, "createdAt" | "updatedAt">[] {
  return DEPARTMENT_SEEDS.map((d) => ({
    _id: d._id,
    name: d.name,
    code: d.code,
    description: d.description,
    programs: d.programs,
    programCategories: d.programCategories,
    isActive: true,
  }));
}
