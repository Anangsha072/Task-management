"use client";

import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, User } from "@/lib/api";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
};

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "task_access_token";
const USER_KEY = "task_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    loading: true,
  });
  const router = useRouter();

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await api.auth.refresh();
      if (res?.accessToken) {
        setState((s) => ({ ...s, accessToken: res.accessToken }));
        typeof window !== "undefined" && localStorage.setItem(TOKEN_KEY, res.accessToken);
        return res.accessToken;
      }
    } catch {
      setState({ user: null, accessToken: null, loading: false });
      typeof window !== "undefined" && (localStorage.removeItem(TOKEN_KEY), localStorage.removeItem(USER_KEY));
    }
    return null;
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (state.accessToken) return state.accessToken;
    const stored = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (stored) {
      setState((s) => ({ ...s, accessToken: stored }));
      return stored;
    }
    return await refreshAccessToken();
  }, [state.accessToken, refreshAccessToken]);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        setState({ user, accessToken: storedToken, loading: false });
        return;
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setState((s) => ({ ...s, loading: false }));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.auth.login(email, password);
      setState({ user: res.user, accessToken: res.accessToken, loading: false });
      localStorage.setItem(TOKEN_KEY, res.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      router.push("/dashboard");
    },
    [router]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const res = await api.auth.register(email, password);
      setState({ user: res.user, accessToken: res.accessToken, loading: false });
      localStorage.setItem(TOKEN_KEY, res.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(async () => {
    const token = state.accessToken || localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await api.auth.logout(token);
      } catch {
        /* ignore */
      }
    }
    setState({ user: null, accessToken: null, loading: false });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    router.push("/login");
  }, [state.accessToken, router]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
