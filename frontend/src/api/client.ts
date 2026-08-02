import type { ApiSuccess, ApiError } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? "Empty response from server"
        : `Request failed (${res.status} ${res.statusText}). Is the API running on port 3210?`
    );
  }

  let json: ApiSuccess<T> | ApiError;
  try {
    json = JSON.parse(text) as ApiSuccess<T> | ApiError;
  } catch {
    throw new Error(`Invalid response from server (${res.status})`);
  }

  if (!json.success) {
    throw new Error(json.error?.message || "Request failed");
  }
  return json.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: async <T>(path: string, file: File, purpose?: string): Promise<T> => {
    const fd = new FormData();
    fd.append("file", file);
    if (purpose) fd.append("purpose", purpose);
    const res = await fetch(path, { method: "POST", body: fd, credentials: "include" });
    const json = (await res.json()) as ApiSuccess<T> | ApiError;
    if (!json.success) throw new Error(json.error?.message || "Upload failed");
    return json.data;
  },
};
