"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "@/lib/types";
import { apiGet, apiPost, setToken, clearToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userId: string, userType: string) => Promise<User>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error("AuthProvider not mounted");
  },
  logout: () => {},
  token: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("auth_token");
    if (stored) {
      setTokenState(stored);
      apiGet<User>("/api/auth/me")
        .then((u) => setUser(u))
        .catch(() => {
          clearToken();
          setTokenState(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (userId: string, userType: string) => {
    const data = await apiPost<{ token: string; user: User }>(
      "/api/auth/login",
      { user_id: userId, user_type: userType }
    );
    setToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
