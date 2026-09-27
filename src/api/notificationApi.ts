import type { Notification } from "../types";
import { api, getErrorMessage } from "./client";

export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

// Get all notifications for current user
export async function getNotificationsApi(
  limit: number = 20,
  skip: number = 0,
): Promise<NotificationResponse> {
  try {
    const { data } = await api.get<NotificationResponse>(
      `/notifications?limit=${limit}&skip=${skip}`,
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch notifications"));
  }
}

// Get unread count
export async function getUnreadCountApi(): Promise<number> {
  try {
    const { data } = await api.get<{ success: boolean; unreadCount: number }>(
      "/notifications/unread-count",
    );
    return data.unreadCount;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to get unread count"));
  }
}

// Mark single notification as read
export async function markNotificationAsReadApi(
  notificationId: string,
): Promise<Notification> {
  try {
    const { data } = await api.put<{
      success: boolean;
      notification: Notification;
    }>(`/notifications/${notificationId}/read`);
    return data.notification;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to mark as read"));
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsReadApi(): Promise<void> {
  try {
    await api.put("/notifications/read-all");
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to mark all as read"));
  }
}

// Delete notification
export async function deleteNotificationApi(
  notificationId: string,
): Promise<void> {
  try {
    await api.delete(`/notifications/${notificationId}`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to delete notification"));
  }
}
