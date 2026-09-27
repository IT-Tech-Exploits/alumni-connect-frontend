import type { AlumniConnectionsResponse, StudentConnectionRow } from "../types";
import { api, getErrorMessage } from "./client";

export async function requestConnectionApi(
  alumniId: string,
): Promise<StudentConnectionRow> {
  try {
    const { data } = await api.post<StudentConnectionRow>(
      "/connections/request",
      {
        alumniId,
      },
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Could not send request"));
  }
}

export async function getStudentConnectionsApi(): Promise<
  StudentConnectionRow[]
> {
  try {
    const { data } = await api.get("/connections/student");
    return Array.isArray(data) ? data : (data.connections ?? data.data ?? []);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load connections"));
  }
}

export async function getAlumniConnectionsApi(): Promise<AlumniConnectionsResponse> {
  try {
    const { data } = await api.get<AlumniConnectionsResponse>(
      "/connections/alumni",
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to load requests"));
  }
}

export async function acceptConnectionApi(id: string): Promise<void> {
  try {
    await api.put(`/connections/${id}/accept`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to accept"));
  }
}

export async function rejectConnectionApi(id: string): Promise<void> {
  try {
    await api.delete(`/connections/${id}`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to decline"));
  }
}

export async function cancelConnectionApi(id: string): Promise<void> {
  try {
    await api.delete(`/connections/${id}`);
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to cancel"));
  }
}
