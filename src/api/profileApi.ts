import type { User } from "../types";
import type {
  ConnectionStatus,
  ProfileAchievement,
  ProfileActivity,
  ProfileConnectionPresence,
  ProfileEducation,
  ProfileExperience,
  ProfileSuggestions,
  PublicProfile,
} from "../types/profile";
import type { Post } from "../types";
import { api, getErrorMessage } from "./client";

/**
 * Profile sections. Every call is a real HTTP request — the backend derives
 * headline/location/completion counts and owns the section data. Omitting
 * `userId` targets your own profile.
 */

const own = (suffix: string, userId?: string) =>
  userId ? `/users/${userId}/${suffix}` : `/profile/${suffix}`;

export async function getPublicProfileApi(userId?: string): Promise<PublicProfile> {
  try {
    const { data } = await api.get<PublicProfile>(
      userId ? `/users/${userId}/public` : "/profile/public",
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load profile"));
  }
}

export async function getProfileExperiencesApi(
  userId?: string,
): Promise<ProfileExperience[]> {
  try {
    const { data } = await api.get<ProfileExperience[]>(
      own("experiences", userId),
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load experiences"));
  }
}

export async function saveProfileExperiencesApi(
  experiences: ProfileExperience[],
): Promise<User> {
  try {
    const { data } = await api.put<{ user: User }>("/profile/experiences", {
      experiences,
    });
    return data.user;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to save experiences"));
  }
}

export async function getProfileEducationApi(
  userId?: string,
): Promise<ProfileEducation[]> {
  try {
    const { data } = await api.get<ProfileEducation[]>(own("education", userId));
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load education"));
  }
}

export async function getProfileAchievementsApi(
  userId?: string,
): Promise<ProfileAchievement[]> {
  try {
    const { data } = await api.get<ProfileAchievement[]>(
      own("achievements", userId),
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load achievements"));
  }
}

export async function saveProfileAchievementsApi(
  achievements: ProfileAchievement[],
): Promise<User> {
  try {
    const { data } = await api.put<{ user: User }>("/profile/achievements", {
      achievements,
    });
    return data.user;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to save achievements"));
  }
}

/** Posts authored by the profile owner. */
export async function getProfilePostsApi(userId?: string): Promise<Post[]> {
  try {
    const { data } = await api.get<Post[] | { posts: Post[] }>(
      own("posts", userId),
    );
    return Array.isArray(data) ? data : (data.posts ?? []);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load posts"));
  }
}

/** Posts that mention/tag the profile owner. */
export async function getTaggedPostsApi(userId?: string): Promise<Post[]> {
  try {
    const { data } = await api.get<Post[] | { posts: Post[] }>(
      own("tagged-posts", userId),
    );
    return Array.isArray(data) ? data : (data.posts ?? []);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load tagged posts"));
  }
}

export async function getProfileActivityApi(
  userId?: string,
): Promise<ProfileActivity[]> {
  try {
    const { data } = await api.get<ProfileActivity[]>(own("activity", userId));
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load activity"));
  }
}

export async function getProfileSuggestionsApi(
  userId?: string,
): Promise<ProfileSuggestions> {
  try {
    const { data } = await api.get<ProfileSuggestions>(own("suggestions", userId));
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load suggestions"));
  }
}

export async function getProfileConnectionsApi(
  userId?: string,
): Promise<ProfileConnectionPresence[]> {
  try {
    const { data } = await api.get<ProfileConnectionPresence[]>(
      own("connections", userId),
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load connections"));
  }
}

export async function getConnectionStatusApi(
  targetId: string,
): Promise<ConnectionStatus> {
  try {
    const { data } = await api.get<{ status: ConnectionStatus }>(
      `/connections/status/${targetId}`,
    );
    return data.status;
  } catch {
    return "none";
  }
}

export async function requestConnectionStatusApi(
  targetId: string,
): Promise<ConnectionStatus> {
  try {
    const { data } = await api.post<{ status: ConnectionStatus }>(
      "/connections/request",
      { targetId },
    );
    return data.status;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Could not send request"));
  }
}

/** Uploads a new profile or cover image; the backend returns the stored URL. */
export async function changeProfilePhotoApi(
  file: File,
  kind: "profile" | "cover",
): Promise<{ profilePhoto?: string; coverPhoto?: string }> {
  try {
    const formData = new FormData();
    formData.append(kind === "cover" ? "cover" : "photo", file);
    const { data } = await api.post<{
      profilePhoto?: string;
      coverPhoto?: string;
    }>("/profile/media", formData);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to upload the photo"));
  }
}
