import { useCallback, useEffect, useMemo, useState } from "react";

interface User {
  id: number;
  email: string;
  name: string | null;
  role: "user" | "admin";
}

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load user from localStorage and verify token on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("jwt_token");
        const savedUser = localStorage.getItem("user");

        if (token && savedUser) {
          // Verify token with backend
          const response = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem("jwt_token");
            localStorage.removeItem("user");
            setUser(null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load user"));
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem("jwt_token");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user");
      setUser(null);
      window.location.href = "/";
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("jwt_token");
      if (token) {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to refresh user")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const state = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, error]
  );

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, loading, state.user]);

  return {
    ...state,
    refresh,
    logout,
  };
}
