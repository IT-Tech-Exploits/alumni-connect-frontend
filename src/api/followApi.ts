import type { ProfileConnectionPresence } from "../types/profile";
import { api, getErrorMessage } from "./client";

/**
 * Follow system (LinkedIn-inspired but simpler than connections).
 * A follow is a lightweight one-way subscription used for feed filtering.
 */

export async function getProfileFollowersApi(
  userId?: string,
): Promise<ProfileConnectionPresence[]> {
  try {
    const { data } = await api.get<ProfileConnectionPresence[]>(
      userId ? `/users/${userId}/followers` : "/profile/followers",
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load followers"));
  }
}

export async function getFollowingApi(): Promise<ProfileConnectionPresence[]> {
  try {
    const { data } = await api.get<ProfileConnectionPresence[]>("/profile/following");
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load following"));
  }
}

export async function isFollowingApi(targetId: string): Promise<boolean> {
  try {
    const { data } = await api.get<{ following: boolean }>(
      `/users/${targetId}/follow-status`,
    );
    return data.following;
  } catch {
    return false;
  }
}

/** Toggles follow state for the current viewer. Returns the new state. */
export async function toggleFollowApi(
  targetId: string,
): Promise<{ following: boolean }> {
  try {
    const { data } = await api.post<{ following: boolean }>(
      `/users/${targetId}/follow`,
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Could not update follow"));
  }
}

/** Ids the current viewer follows — used for feed filtering. */
export async function getFollowingIdsApi(): Promise<string[]> {
  try {
    const { data } = await api.get<{ following: string[] }>("/profile/following-ids");
    return data.following;
  } catch {
    return [];
  }
}
