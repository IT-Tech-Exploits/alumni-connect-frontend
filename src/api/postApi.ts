import type { Post, CreatePostInput } from "../types";
import { api, getErrorMessage } from "./client";

/**
 * Community feed. The backend owns the author, timestamps, like counts and
 * comment list — the client only ever sends text/category and re-renders the
 * post object the server returns.
 */

export async function getFeedApi(): Promise<Post[]> {
  try {
    const { data } = await api.get<Post[] | { posts: Post[] }>("/posts");
    return Array.isArray(data) ? data : (data.posts ?? []);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load the feed"));
  }
}

export async function createPostApi(input: CreatePostInput): Promise<Post> {
  try {
    const { data } = await api.post<Post>("/posts", {
      category: input.category,
      text: input.text,
      imageUrl: input.imageUrl,
    });
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Could not publish post"));
  }
}

export async function toggleLikePostApi(id: string): Promise<Post> {
  try {
    const { data } = await api.post<Post>(`/posts/${id}/like`);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Could not update like"));
  }
}

export async function addCommentApi(
  id: string,
  text: string,
): Promise<Post> {
  try {
    const { data } = await api.post<Post>(`/posts/${id}/comments`, { text });
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Could not add comment"));
  }
}

export async function editPostApi(id: string, text: string): Promise<Post> {
  try {
    const { data } = await api.put<Post>(`/posts/${id}`, { text });
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Could not edit post"));
  }
}

export async function deletePostApi(id: string): Promise<void> {
  try {
    await api.delete(`/posts/${id}`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Could not delete post"));
  }
}
