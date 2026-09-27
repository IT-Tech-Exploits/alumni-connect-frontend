import { api, getErrorMessage } from "./client";

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

/** dryRun = true previews the file and saves nothing. */
export async function importRosterFileApi(
  file: File,
  dryRun: boolean,
): Promise<RosterImportResult> {
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
  try {
    const { data } = await api.get<{ stats: RosterStats }>("/admin/alumni-roster/stats");
    return data.stats;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load roster stats"));
  }
}

export async function getRosterImportHistoryApi(): Promise<RosterImportHistoryItem[]> {
  try {
    const { data } = await api.get<{ imports: RosterImportHistoryItem[] }>("/admin/alumni-roster/imports");
    return data.imports;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load import history"));
  }
}

export async function deleteRosterEntryApi(id: string): Promise<void> {
  try {
    await api.delete(`/admin/alumni-roster/${id}`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to delete the roster entry"));
  }
}

/** Frees an entry a user has claimed, without changing that user's own account. */
export async function releaseRosterEntryApi(id: string): Promise<void> {
  try {
    await api.post(`/admin/alumni-roster/${id}/release`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to release the roster entry"));
  }
}

export async function recheckPendingAlumniApi(): Promise<RosterAutoApproval> {
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
