import type { DirectoryUser, DirectoryFilters, FilterOptions } from "../types";
import { api, getErrorMessage } from "./client";

export async function getAlumniDirectoryApi(
  filters?: DirectoryFilters,
): Promise<{ success: boolean; count: number; alumni: DirectoryUser[] }> {
  try {
    const params = new URLSearchParams();
    if (filters?.department && filters.department !== "all") {
      params.append("department", filters.department);
    }
    if (filters?.skills && filters.skills !== "all") {
      params.append("skills", filters.skills);
    }
    if (filters?.location && filters.location !== "all") {
      params.append("location", filters.location);
    }
    if (filters?.search && filters.search.trim()) {
      params.append("search", filters.search.trim());
    }

    const url = `/directory/alumni${params.toString() ? `?${params.toString()}` : ""}`;
    const { data } = await api.get(url);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load alumni"));
  }
}

export async function getStudentsDirectoryApi(
  filters?: DirectoryFilters,
): Promise<{ success: boolean; count: number; students: DirectoryUser[] }> {
  try {
    const params = new URLSearchParams();
    if (filters?.department && filters.department !== "all") {
      params.append("department", filters.department);
    }
    if (filters?.skills && filters.skills !== "all") {
      params.append("skills", filters.skills);
    }
    if (filters?.search && filters.search.trim()) {
      params.append("search", filters.search.trim());
    }

    const url = `/directory/students${params.toString() ? `?${params.toString()}` : ""}`;
    const { data } = await api.get(url);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load students"));
  }
}

export async function getDirectoryFilterOptionsApi(): Promise<FilterOptions> {
  try {
    const { data } = await api.get<{
      success: boolean;
      filters: FilterOptions;
    }>("/directory/filters");
    return data.filters;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load filter options"));
  }
}
