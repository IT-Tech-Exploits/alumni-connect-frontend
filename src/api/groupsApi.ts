import type { Post, Group } from "../types";
import { api, getErrorMessage } from "./client";

export async function getGroupsApi(): Promise<Group[]> {
  try {
    const { data } = await api.get("/groups");
    return Array.isArray(data) ? data : (data.groups ?? []);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch groups"));
  }
}

export async function toggleJoinGroupApi(
  id: string,
): Promise<{ joined: boolean; memberCount: number }> {
  try {
    const { data } = await api.post<{ joined: boolean; memberCount: number }>(
      `/groups/${id}/toggle`,
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Could not update group membership"));
  }
}

export async function isInGroupApi(id: string): Promise<boolean> {
  try {
    const { data } = await api.get<{ joined: boolean }>(`/groups/${id}/membership`);
    return data.joined;
  } catch {
    return false;
  }
}

export async function getGroupPostsApi(id: string): Promise<Post[]> {
  try {
    const { data } = await api.get<Post[] | { posts: Post[] }>(`/groups/${id}/posts`);
    return Array.isArray(data) ? data : (data.posts ?? []);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load group posts"));
  }
}

export async function getGroupMemberNamesApi(id: string): Promise<string[]> {
  try {
    const { data } = await api.get<string[] | { members: string[] }>(
      `/groups/${id}/members`,
    );
    return Array.isArray(data) ? data : (data.members ?? []);
  } catch {
    return [];
  }
}
