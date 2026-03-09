"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type UserRole = "admin" | "nmc";

export interface AuthUser {
  username: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const CREDENTIALS: Record<string, { password: string; role: UserRole }> = {
  admin: { password: "123", role: "admin" },
  nmc: { password: "123", role: "nmc" },
};

const AUTH_KEY = "civicapp_auth";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        if (parsed.username && parsed.role) {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    (username: string, password: string) => {
      const entry = CREDENTIALS[username.toLowerCase()];
      if (!entry || entry.password !== password) {
        return { success: false, error: "Invalid username or password" };
      }
      const authUser: AuthUser = { username: username.toLowerCase(), role: entry.role };
      setUser(authUser);
      localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
