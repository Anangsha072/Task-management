const API_BASE = "https://task-management-15.onrender.com";

export type User = { id: string; email: string };
export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

async function request<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (accessToken) (headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      request<{ user: User; accessToken: string; expiresIn: number }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    login: (email: string, password: string) =>
      request<{ user: User; accessToken: string; expiresIn: number }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    refresh: (accessToken?: string) =>
      request<{ accessToken: string; expiresIn: number }>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({}),
        accessToken,
      }),
    logout: (accessToken: string) =>
      request("/auth/logout", {
        method: "POST",
        body: JSON.stringify({}),
        accessToken,
      }),
  },
  tasks: {
    list: (
      accessToken: string,
      params?: { page?: number; limit?: number; status?: string; search?: string }
    ) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.status) searchParams.set("status", params.status);
      if (params?.search) searchParams.set("search", params.search);
      const qs = searchParams.toString();
      return request<{ tasks: Task[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/tasks${qs ? `?${qs}` : ""}`,
        { accessToken }
      );
    },
    get: (accessToken: string, id: string) =>
      request<Task>(`/tasks/${id}`, { accessToken }),
    create: (accessToken: string, data: { title: string; description?: string; status?: string }) =>
      request<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
        accessToken,
      }),
    update: (
      accessToken: string,
      id: string,
      data: { title?: string; description?: string; status?: string; completed?: boolean }
    ) =>
      request<Task>(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        accessToken,
      }),
    delete: (accessToken: string, id: string) =>
      request(`/tasks/${id}`, { method: "DELETE", accessToken }),
    toggle: (accessToken: string, id: string) =>
      request<Task>(`/tasks/${id}/toggle`, { method: "PATCH", accessToken }),
  },
};
