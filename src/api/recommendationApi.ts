import { api, getErrorMessage } from "./client";

/**
 * Recommendations + skill endorsements.
 * Recommendations are written by one member about another; endorsements are
 * lightweight likes on a profile's skills. Both are stored server-side.
 */

export type RecommendationRelation =
  | "mentor"
  | "manager"
  | "colleague"
  | "mentee"
  | "peer";

export interface Recommendation {
  _id: string;
  from: {
    _id: string;
    name: string;
    role: string;
    position?: string;
  };
  relation: RecommendationRelation;
  text: string;
  createdAt: string;
}

export type SkillEndorsements = Record<string, number>;

export const RELATION_LABELS: Record<RecommendationRelation, string> = {
  mentor: "mentor",
  manager: "manager",
  colleague: "colleague",
  mentee: "mentee",
  peer: "peer",
};

export async function getRecommendationsApi(
  userId?: string,
): Promise<Recommendation[]> {
  try {
    const { data } = await api.get<Recommendation[]>(
      userId ? `/users/${userId}/recommendations` : "/profile/recommendations",
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load recommendations"));
  }
}

export async function addRecommendationApi(
  targetUserId: string,
  payload: { relation: RecommendationRelation; text: string },
): Promise<Recommendation[]> {
  try {
    const { data } = await api.post<Recommendation[]>(
      `/users/${targetUserId}/recommendations`,
      payload,
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Could not submit recommendation"));
  }
}

/** Endorsement count for each of a user's skills. */
export async function getSkillEndorsementsApi(
  userId?: string,
): Promise<SkillEndorsements> {
  try {
    const { data } = await api.get<SkillEndorsements>(
      userId ? `/users/${userId}/skill-endorsements` : "/profile/skill-endorsements",
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load endorsements"));
  }
}

export async function endorseSkillApi(
  targetUserId: string,
  skill: string,
): Promise<{ skill: string; count: number }> {
  try {
    const { data } = await api.post<{ skill: string; count: number }>(
      `/users/${targetUserId}/endorse`,
      { skill },
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Could not endorse skill"));
  }
}
