import type { Event } from "../types";
import { api, getErrorMessage } from "./client";

export async function getEventsApi(): Promise<Event[]> {
  try {
    const { data } = await api.get("/events");
    return Array.isArray(data) ? data : (data.events ?? []);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch events"));
  }
}

export async function createEventApi(data: Partial<Event>): Promise<Event> {
  try {
    const { data: ev } = await api.post<Event>("/events", data);
    return ev;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to create event"));
  }
}

export async function deleteEventApi(id: string): Promise<void> {
  try {
    await api.delete(`/admin/events/${id}`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to delete event"));
  }
}

export async function joinEventApi(id: string): Promise<void> {
  try {
    await api.post(`/events/${id}/join`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to join event"));
  }
}

export interface RsvpState {
  rsvped: boolean;
  count: number;
}

/** Toggles RSVP for the current user and returns the new state. */
export async function toggleRsvpApi(id: string): Promise<RsvpState> {
  try {
    const { data } = await api.post<RsvpState>(`/events/${id}/rsvp`);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Could not update RSVP"));
  }
}

export async function isRsvpedApi(id: string): Promise<boolean> {
  try {
    const { data } = await api.get<{ rsvped: boolean }>(`/events/${id}/rsvp-status`);
    return data.rsvped;
  } catch {
    return false;
  }
}

/** Upcoming events the current user is registered to attend. */
export async function getMyUpcomingEventsApi(): Promise<Event[]> {
  try {
    const { data } = await api.get("/events/mine");
    return Array.isArray(data) ? data : (data.events ?? []);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load your events"));
  }
}

// ── Participants details (admin) ──────────────────────────────────────────────
export interface EventParticipant {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  profilePhoto: string;
  graduationYear: string;
  university: string;
  company: string;
  position: string;
}

export interface EventParticipantsResponse {
  eventId: string;
  title: string;
  eventDate: string;
  location: string;
  total: number;
  participants: EventParticipant[];
}

export async function getEventParticipantsApi(
  id: string,
): Promise<EventParticipantsResponse> {
  try {
    const { data } = await api.get<EventParticipantsResponse>(
      `/events/${id}/participants`,
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch participants"));
  }
}
