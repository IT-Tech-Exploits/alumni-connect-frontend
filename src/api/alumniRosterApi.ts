import { api, getErrorMessage } from "./client";
import { MOCK_MODE, mockDelay } from "./mockMode";

/**
 * Admin "Alumni Roster" feature: the CSV/Excel list of known alumni that lets
 * a registering alumnus be approved automatically instead of by hand.
 * Matches backend/src/controllers/alumniRosterController.js under
 * /api/admin/alumni-roster.
 */

export interface RosterEntry {
  _id: string; // e.g. "BIT-24-BT-NE-009" (registration number with "/" -> "-")
  registrationNumber: string; // e.g. "BIT/24/BT/NE/009"
  fullName: string;
  department?: string;
  program?: string;
  graduationYear?: string;
  email?: string;
  status: "unclaimed" | "claimed";
  claimedBy?: string | null;
  claimedAt?: string | null;
  importBatchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RosterRowError {
  row: number;
  registrationNumber: string;
  problems: string[];
}

export interface RosterImportSummary {
  created: number;
  updated: number;
  skippedClaimed: number;
}

export interface RosterAutoApproval {
  checked: number;
  approved: number;
  notInRoster: number;
  alreadyClaimed: number;
  invalidNumber: number;
  failed: number;
  approvedUsers: Array<{ id: string; name: string; registrationNumber: string }>;
}

export interface RosterImportResult {
  success: boolean;
  dryRun: boolean;
  fileName: string;
  batchId: string | null;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: RosterRowError[];
  summary: RosterImportSummary;
  autoApproval: RosterAutoApproval | null;
}

export interface RosterStats {
  total: number;
  unclaimed: number;
  claimed: number;
}

export interface RosterImportHistoryItem {
  id: string;
  fileName: string;
  uploadedByEmail?: string;
  totalRows: number;
  errorRows: number;
  created: number;
  updated: number;
  skippedClaimed: number;
  createdAt: string;
}

export interface RosterListPage {
  entries: RosterEntry[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------- mock data

let MOCK_ROSTER: RosterEntry[] = [
  {
    _id: "BSE-16-LL-NE-001",
    registrationNumber: "BSE/16/LL/NE/001",
    fullName: "Chikondi Banda",
    department: "Software Engineering",
    program: "BSc Software Engineering",
    graduationYear: "2020",
    email: "chikondi.banda@example.com",
    status: "claimed",
    claimedBy: "mock-user-1",
    claimedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    _id: "BAF-14-BT-NE-014",
    registrationNumber: "BAF/14/BT/NE/014",
    fullName: "Thoko Phiri",
    department: "Accounting & Finance",
    program: "BSc Accounting",
    graduationYear: "2018",
    email: "thoko.phiri@example.com",
    status: "unclaimed",
    claimedBy: null,
    claimedAt: null,
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    _id: "BIT-18-BT-NE-009",
    registrationNumber: "BIT/18/BT/NE/009",
    fullName: "Limbani Gondwe",
    department: "Information Technology",
    program: "Bachelor of Information Technology",
    graduationYear: "2022",
    email: "",
    status: "unclaimed",
    claimedBy: null,
    claimedAt: null,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];
let MOCK_HISTORY: RosterImportHistoryItem[] = [
  {
    id: "mock-batch-1",
    fileName: "alumni-roster-2026.csv",
    uploadedByEmail: "admin@exploits.ac.zw",
    totalRows: 3,
    errorRows: 0,
    created: 3,
    updated: 0,
    skippedClaimed: 0,
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
];

/** Very small CSV reader, only used to make the mock preview realistic. */
function mockParseCsv(text: string) {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim() !== "");
  const [header, ...rows] = lines;
  const cols = header.split(",").map((c) => c.trim().toLowerCase());
  const idx = (name: string) => cols.findIndex((c) => c.replace(/[^a-z]/g, "") === name);
  const numberCol = idx("registrationnumber");
  const nameCol = idx("fullname");
  const records: RosterEntry[] = [];
  const errors: RosterRowError[] = [];
  const numberPattern = /^[A-Z]{2,6}\/\d{2}\/[A-Z]{2,3}\/[A-Z]{2,3}\/\d{1,5}$/;

  rows.forEach((line, i) => {
    const cells = line.split(",").map((c) => c.trim());
    const registrationNumber = (cells[numberCol] || "").toUpperCase();
    const fullName = cells[nameCol] || "";
    const problems: string[] = [];
    if (!registrationNumber) problems.push("Missing registration number");
    else if (!numberPattern.test(registrationNumber)) problems.push(`Invalid registration number "${registrationNumber}"`);
    if (!fullName) problems.push("Missing full name");
    if (problems.length) {
      errors.push({ row: i + 2, registrationNumber, problems });
    } else {
      const now = new Date().toISOString();
      records.push({
        _id: registrationNumber.replace(/\//g, "-"),
        registrationNumber,
        fullName,
        department: cells[idx("department")] || "",
        program: cells[idx("program")] || "",
        graduationYear: cells[idx("graduationyear")] || "",
        email: (cells[idx("email")] || "").toLowerCase(),
        status: "unclaimed",
        claimedBy: null,
        claimedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    }
  });
  return { records, errors };
}

// ---------------------------------------------------------------- API calls

/** dryRun = true previews the file and saves nothing. */
export async function importRosterFileApi(
  file: File,
  dryRun: boolean,
): Promise<RosterImportResult> {
  if (MOCK_MODE) {
    await mockDelay(500);
    const text = await file.text();
    const { records, errors } = mockParseCsv(text);
    const existingIds = new Set(MOCK_ROSTER.map((r) => r._id));
    const created = records.filter((r) => !existingIds.has(r._id)).length;
    const updated = records.length - created;
    if (!dryRun) {
      records.forEach((r) => {
        const existingIndex = MOCK_ROSTER.findIndex((e) => e._id === r._id);
        if (existingIndex === -1) MOCK_ROSTER = [...MOCK_ROSTER, r];
        else if (MOCK_ROSTER[existingIndex].status === "unclaimed") {
          MOCK_ROSTER[existingIndex] = { ...MOCK_ROSTER[existingIndex], ...r, status: "unclaimed" };
        }
      });
      MOCK_HISTORY = [
        {
          id: `mock-batch-${Date.now()}`,
          fileName: file.name,
          uploadedByEmail: "admin@exploits.ac.zw",
          totalRows: records.length + errors.length,
          errorRows: errors.length,
          created,
          updated,
          skippedClaimed: 0,
          createdAt: new Date().toISOString(),
        },
        ...MOCK_HISTORY,
      ];
    }
    return {
      success: true,
      dryRun,
      fileName: file.name,
      batchId: dryRun ? null : `mock-batch-${Date.now()}`,
      totalRows: records.length + errors.length,
      validRows: records.length,
      errorRows: errors.length,
      errors,
      summary: { created, updated, skippedClaimed: 0 },
      autoApproval: dryRun ? null : { checked: 0, approved: 0, notInRoster: 0, alreadyClaimed: 0, invalidNumber: 0, failed: 0, approvedUsers: [] },
    };
  }
  try {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<RosterImportResult>(
      `/admin/alumni-roster/import?dryRun=${dryRun}`,
      formData,
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to import the roster file"));
  }
}

export interface ListRosterParams {
  status?: "claimed" | "unclaimed";
  q?: string;
  limit?: number;
  after?: string | null;
}

export async function listRosterApi(params: ListRosterParams = {}): Promise<RosterListPage> {
  if (MOCK_MODE) {
    await mockDelay(250);
    let entries = MOCK_ROSTER;
    if (params.status) entries = entries.filter((e) => e.status === params.status);
    if (params.q) {
      const needle = params.q.toUpperCase().replace(/[-\s]/g, "");
      entries = entries.filter(
        (e) =>
          e.registrationNumber.replace(/\//g, "").includes(needle) ||
          e.fullName.toUpperCase().includes(params.q!.toUpperCase()),
      );
    }
    const sorted = [...entries].sort((a, b) => a._id.localeCompare(b._id));
    const limit = params.limit ?? 20;
    const startIndex = params.after ? sorted.findIndex((e) => e._id === params.after) + 1 : 0;
    const page = sorted.slice(startIndex, startIndex + limit);
    const nextCursor = startIndex + limit < sorted.length ? page[page.length - 1]?._id ?? null : null;
    return { entries: page, nextCursor };
  }
  try {
    const search = new URLSearchParams();
    if (params.status) search.set("status", params.status);
    if (params.q) search.set("q", params.q);
    if (params.limit) search.set("limit", String(params.limit));
    if (params.after) search.set("after", params.after);
    const { data } = await api.get<{ entries: RosterEntry[]; nextCursor: string | null }>(
      `/admin/alumni-roster?${search.toString()}`,
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load the alumni roster"));
  }
}

export async function getRosterStatsApi(): Promise<RosterStats> {
  if (MOCK_MODE) {
    await mockDelay(150);
    const claimed = MOCK_ROSTER.filter((e) => e.status === "claimed").length;
    return { total: MOCK_ROSTER.length, claimed, unclaimed: MOCK_ROSTER.length - claimed };
  }
  try {
    const { data } = await api.get<{ stats: RosterStats }>("/admin/alumni-roster/stats");
    return data.stats;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load roster stats"));
  }
}

export async function getRosterImportHistoryApi(): Promise<RosterImportHistoryItem[]> {
  if (MOCK_MODE) {
    await mockDelay(150);
    return MOCK_HISTORY;
  }
  try {
    const { data } = await api.get<{ imports: RosterImportHistoryItem[] }>("/admin/alumni-roster/imports");
    return data.imports;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load import history"));
  }
}

export async function deleteRosterEntryApi(id: string): Promise<void> {
  if (MOCK_MODE) {
    await mockDelay(200);
    const entry = MOCK_ROSTER.find((e) => e._id === id);
    if (entry?.status === "claimed") {
      throw new Error("This entry has been claimed by a registered user. Release the claim first.");
    }
    MOCK_ROSTER = MOCK_ROSTER.filter((e) => e._id !== id);
    return;
  }
  try {
    await api.delete(`/admin/alumni-roster/${id}`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to delete the roster entry"));
  }
}

/** Frees an entry a user has claimed, without changing that user's own account. */
export async function releaseRosterEntryApi(id: string): Promise<void> {
  if (MOCK_MODE) {
    await mockDelay(200);
    MOCK_ROSTER = MOCK_ROSTER.map((e) =>
      e._id === id ? { ...e, status: "unclaimed", claimedBy: null, claimedAt: null } : e,
    );
    return;
  }
  try {
    await api.post(`/admin/alumni-roster/${id}/release`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to release the roster entry"));
  }
}

export async function recheckPendingAlumniApi(): Promise<RosterAutoApproval> {
  if (MOCK_MODE) {
    await mockDelay(400);
    return { checked: 0, approved: 0, notInRoster: 0, alreadyClaimed: 0, invalidNumber: 0, failed: 0, approvedUsers: [] };
  }
  try {
    const { data } = await api.post<{ result: RosterAutoApproval }>("/admin/alumni-roster/recheck-pending");
    return data.result;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to re-check pending alumni"));
  }
}

/** Resolves to the same base URL api.ts uses, for a plain <a href> download link. */
export function rosterTemplateUrl(): string {
  const base = (api.defaults.baseURL || "/api").replace(/\/$/, "");
  return `${base}/admin/alumni-roster/template`;
}
