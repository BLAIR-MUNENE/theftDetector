"use client";

import { API_BASE } from "@/lib/config";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AppUser = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  role: "admin" | "user";
};

type AuthContextValue = {
  loading: boolean;
  authenticated: boolean;
  user: AppUser | null;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  loading: true,
  authenticated: false,
  user: null,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);

  async function refresh() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include", cache: "no-store" });
      const data = await res.json();
      setAuthenticated(Boolean(data?.authenticated && data?.user));
      setUser(data?.user ?? null);
    } catch {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(() => ({ loading, authenticated, user, refresh }), [loading, authenticated, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
