// ─── AuthContext.tsx ───────────────────────────────────────────────────────────
//
// This file creates a "global state bucket" for authentication.
// React Context lets any component in the app read and update the auth state
// without having to pass props manually through every layer of the tree.
//
// HOW IT WORKS (plain English):
//   1. AuthProvider wraps the whole app. It holds the single source of truth
//      for whether someone is logged in.
//   2. Any component that needs to know (Login, ProtectedRoute, etc.) calls
//      `useAuth()` to get that state and the login/logout helpers.
//   3. When the real backend is ready, only the `login` and `logout` functions
//      below need to be updated — everything else stays the same.

import { createContext, useContext, useEffect, useState } from "react";
import type {
  AuthPermissions,
  AuthUser,
  LoginResponse,
  SessionResponse,
} from "../../../shared/auth.types";

// ─── Types ────────────────────────────────────────────────────────────────────

// Describes what the auth context exposes to the rest of the app.
type AuthContextValue = {
  isAuthenticated: boolean;
  isCheckingSession: boolean;
  currentUser: AuthUser | null;
  canAccessAdminControls: boolean;
  showDayIcons: boolean;
  showNightIcons: boolean;
  login: (
    username: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  authenticatedFetch: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  updateCurrentUser: (user: AuthUser) => void;
  updatePermissions: (permissions: Partial<AuthPermissions>) => void;
};

// ─── Context creation ─────────────────────────────────────────────────────────

// Creates the context object. The `null` default is intentional — it lets
// `useAuth()` detect when a component is used outside of AuthProvider.
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

// AuthProvider is a wrapper component. Place it high in the component tree
// (in App.tsx) so every child can access auth state via useAuth().
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Tracks whether the current browser session has an authenticated server cookie.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [canAccessAdminControls, setCanAccessAdminControls] = useState(false);
  const [showDayIcons, setShowDayIcons] = useState(true);
  const [showNightIcons, setShowNightIcons] = useState(true);
  // While true, the app is checking /api/auth/session on first load.
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // On app start, ask the backend if the current cookie maps to a valid session.
  // This keeps frontend route guards and backend truth in sync.
  useEffect(() => {
    fetch("/api/auth/session", { credentials: "same-origin" })
      .then(async (res) => {
        // Shared SessionResponse type keeps frontend in sync with worker response shape.
        const body = (await res
          .json()
          .catch(() => null)) as SessionResponse | null;

        if (res.ok && body?.ok) {
          setIsAuthenticated(true);
          setCurrentUser(body.user);
          setCanAccessAdminControls(body.permissions.canAccessAdminControls);
          setShowDayIcons(body.permissions.showDayIcons);
          setShowNightIcons(body.permissions.showNightIcons);
          return;
        }

        setIsAuthenticated(false);
        setCurrentUser(null);
        setCanAccessAdminControls(false);
        setShowDayIcons(true);
        setShowNightIcons(true);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setCanAccessAdminControls(false);
        setShowDayIcons(true);
        setShowNightIcons(true);
      })
      .finally(() => {
        setIsCheckingSession(false);
      });
  }, []);

  function handleUnauthorized() {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCanAccessAdminControls(false);
    setShowDayIcons(true);
    setShowNightIcons(true);
    setIsCheckingSession(false);

    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.replace("/login");
    }
  }

  async function authenticatedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ) {
    const response = await fetch(input, {
      credentials: "same-origin",
      ...init,
    });

    if (response.status === 401) {
      handleUnauthorized();
    }

    return response;
  }

  // Sends credentials to the backend login endpoint.
  // If the backend accepts them, it sets an HttpOnly session cookie and we
  // mark the frontend auth state as true.
  async function login(username: string, password: string) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });

      const body = (await response
        .json()
        .catch(() => null)) as LoginResponse | null;

      if (!response.ok || !body?.ok) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setCanAccessAdminControls(false);
        setShowDayIcons(true);
        setShowNightIcons(true);
        return {
          ok: false as const,
          error: body && !body.ok ? body.error : "Login failed",
        };
      }

      setIsAuthenticated(true);
      setCurrentUser(body.user);
      setCanAccessAdminControls(body.permissions.canAccessAdminControls);
      setShowDayIcons(body.permissions.showDayIcons);
      setShowNightIcons(body.permissions.showNightIcons);
      return { ok: true as const };
    } catch {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCanAccessAdminControls(false);
      setShowDayIcons(true);
      setShowNightIcons(true);
      return { ok: false as const, error: "Network error while signing in" };
    }
  }

  // Logs out from the backend and clears local auth state regardless of API result.
  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Intentionally ignored: even if logout API fails, we still clear local state.
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCanAccessAdminControls(false);
    setShowDayIcons(true);
    setShowNightIcons(true);
  }

  function updateCurrentUser(user: AuthUser) {
    setCurrentUser(user);
  }

  function updatePermissions(permissions: Partial<AuthPermissions>) {
    if (typeof permissions.canAccessAdminControls === "boolean") {
      setCanAccessAdminControls(permissions.canAccessAdminControls);
    }
    if (typeof permissions.showDayIcons === "boolean") {
      setShowDayIcons(permissions.showDayIcons);
    }
    if (typeof permissions.showNightIcons === "boolean") {
      setShowNightIcons(permissions.showNightIcons);
    }
  }

  // The Provider makes `isAuthenticated`, `login`, and `logout` available
  // to every component nested inside it.
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isCheckingSession,
        currentUser,
        canAccessAdminControls,
        showDayIcons,
        showNightIcons,
        login,
        logout,
        authenticatedFetch,
        updateCurrentUser,
        updatePermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

// useAuth() is the friendly way to read the auth context from any component.
// Example usage inside a component:
//   const { isAuthenticated, login, logout } = useAuth()
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  // Guard: if someone accidentally uses useAuth() outside of AuthProvider,
  // this throws a clear error instead of a confusing crash elsewhere.
  if (!ctx) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }

  return ctx;
}
