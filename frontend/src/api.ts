import { SchoolClass, CreateHoldResponse, HoldDetail, StudentHold } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function request<T>(path: string, options: RequestInit = {}, studentId?: string): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (studentId) {
    headers.set('X-Student-Id', studentId.trim());
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.title || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  getClasses: () => request<SchoolClass[]>('/classes'),

  getClass: (classId: string) => request<SchoolClass>(`/classes/${classId}`),

  createClass: (name: string, totalSeats: number) =>
    request<SchoolClass>('/classes', {
      method: 'POST',
      body: JSON.stringify({ name, totalSeats }),
    }),

  createHold: (classId: string, studentId: string) =>
    request<CreateHoldResponse>(`/classes/${classId}/holds`, { method: 'POST' }, studentId),

  getHold: (holdId: string) => request<HoldDetail>(`/holds/${holdId}`),

  confirmHold: (holdId: string, studentId: string) =>
    request<{ holdId: string; status: string }>(`/holds/${holdId}/confirm`, { method: 'POST' }, studentId),

  cancelHold: (holdId: string, studentId: string) =>
    request<void>(`/holds/${holdId}`, { method: 'DELETE' }, studentId),

  getMyHolds: (studentId: string) =>
    request<StudentHold[]>('/me/holds', { method: 'GET' }, studentId),
};

