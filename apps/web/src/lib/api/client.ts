const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ApiErrorData {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public data: ApiErrorData
  ) {
    super(`API Error: ${status}`);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data as ApiErrorData);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

export async function downloadBlob(endpoint: string): Promise<Blob> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const response = await fetch(`${API_BASE}${endpoint}`, { headers });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as ApiErrorData;
    throw new ApiError(response.status, data);
  }
  return response.blob();
}

export function dispararDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export { ApiError };
export type { ApiErrorData };
