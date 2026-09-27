import type {
  AnalyticsDataset,
  AnalyticsFilterOptions,
  AnalyticsFilters,
} from "../types/analytics";
import { api, getErrorMessage } from "./client";
import { CAMPUSES, ENTRY_YEARS, GRADUATION_YEARS } from "../data/departments";

/**
 * Admin analytics. Every number here is computed by the backend from real
 * records; the frontend only serialises the filter and renders what comes back.
 */

export async function getAnalyticsDatasetApi(
  filters: AnalyticsFilters = {},
): Promise<AnalyticsDataset> {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.userType && filters.userType !== "all")
    params.set("userType", filters.userType);
  if (filters.department) params.set("department", filters.department);
  if (filters.programme) params.set("programme", filters.programme);
  if (filters.entryYear !== undefined && filters.entryYear !== "all")
    params.set("entryYear", String(filters.entryYear));
  if (filters.graduationYear !== undefined && filters.graduationYear !== "all")
    params.set("graduationYear", String(filters.graduationYear));
  if (filters.campus) params.set("campus", filters.campus);
  if (filters.entryType) params.set("entryType", filters.entryType);

  const query = params.toString();
  try {
    const { data } = await api.get<{ success?: boolean; dataset: AnalyticsDataset }>(
      `/admin/analytics${query ? `?${query}` : ""}`,
    );
    if (!data?.dataset) throw new Error("Analytics response was empty");
    return data.dataset;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load analytics"));
  }
}

/**
 * Filter dropdown values. The backend owns these lists; the academic reference
 * data in `data/departments` only backfills them if the endpoint is unavailable
 * so the selects are never blank.
 */
export async function getAnalyticsFilterOptionsApi(): Promise<AnalyticsFilterOptions> {
  const fallback: AnalyticsFilterOptions = {
    campuses: CAMPUSES.map((c) => c.name.replace(/\s*Campus$/, "")),
    entryTypes: [],
    entryYears: ENTRY_YEARS,
    graduationYears: GRADUATION_YEARS,
  };
  try {
    const { data } = await api.get<{
      success?: boolean;
      filters: AnalyticsFilterOptions;
    }>("/admin/analytics/filter-options");
    const filters = data?.filters;
    return {
      campuses: filters?.campuses?.length ? filters.campuses : fallback.campuses,
      entryTypes: filters?.entryTypes ?? fallback.entryTypes,
      entryYears: filters?.entryYears?.length
        ? filters.entryYears
        : fallback.entryYears,
      graduationYears: filters?.graduationYears?.length
        ? filters.graduationYears
        : fallback.graduationYears,
    };
  } catch {
    return fallback;
  }
}
