import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearStoredAuth, readStoredAuth, saveStoredAuth } from "../lib/auth";
import { api } from "../lib/api";
import type { AuthResponse, AuthUser, StoredAuth } from "../lib/types";

type AuthStatus = "loading" | "anonymous" | "authenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  signup: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistAuth(result: AuthResponse): StoredAuth {
  return saveStoredAuth(result);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredAuth | null>(() => readStoredAuth());
  const [status, setStatus] = useState<AuthStatus>(session ? "loading" : "anonymous");

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!session?.refreshToken) {
        if (active) setStatus("anonymous");
        return;
      }

      try {
        const tokens = await api.refresh({ refreshToken: session.refreshToken });
        if (!active) return;
        const next = persistAuth({ user: session.user, ...tokens });
        setSession(next);
        setStatus("authenticated");
      } catch {
        if (!active) return;
        clearStoredAuth();
        setSession(null);
        setStatus("anonymous");
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    refreshToken: session?.refreshToken ?? null,
    isAuthenticated: status === "authenticated" && Boolean(session?.user),
    login: async (payload) => {
      const result = await api.login(payload);
      const next = persistAuth(result);
      setSession(next);
      setStatus("authenticated");
    },
    signup: async (payload) => {
      const result = await api.signup(payload);
      const next = persistAuth(result);
      setSession(next);
      setStatus("authenticated");
    },
    logout: () => {
      clearStoredAuth();
      setSession(null);
      setStatus("anonymous");
    },
    refreshSession: async () => {
      if (!session?.refreshToken) return;
      const tokens = await api.refresh({ refreshToken: session.refreshToken });
      const freshUser = await api.getMe();
      const next = persistAuth({ user: freshUser as any, ...tokens });
      setSession(next);
      setStatus("authenticated");
    },
  }), [session, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
