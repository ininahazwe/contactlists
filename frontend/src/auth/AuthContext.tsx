import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { AuthUser } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ user: AuthUser }>("/auth/me")
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Memoized: these functions are used as effect dependencies (notably
  // rendering the Google button); a stable identity avoids re-running
  // those effects on every re-render.
  const loginWithGoogleIdToken = useCallback(async (idToken: string) => {
    const res = await api.post<{ user: AuthUser }>("/auth/google", { idToken });
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogleIdToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
