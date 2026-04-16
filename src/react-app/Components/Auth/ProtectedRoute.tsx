// ─── ProtectedRoute.tsx ────────────────────────────────────────────────────────
//
// A "gatekeeper" component that sits in front of any page that requires login.
//
// HOW IT WORKS (plain English):
//   - If the user IS logged in  → render the protected page normally.
//   - If the user is NOT logged in → silently redirect them to /login.
//
// Usage in App.tsx:
//   <Route path="/app" element={<ProtectedRoute><Example /></ProtectedRoute>} />
//
// This means the calendar (or any future protected page) can never be reached
// by typing a URL directly — the user will always be bounced back to login first.

import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

// `children` is whatever page/component we want to protect.
// React.ReactNode means it can be any valid JSX — a component, element, fragment, etc.
type ProtectedRouteProps = {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Read the current login state from AuthContext.
  const { isAuthenticated, isCheckingSession } = useAuth()

  // While the app is checking /api/auth/session, keep this route in a simple
  // loading state so we don't redirect too early and cause route flicker.
  if (isCheckingSession) {
    return (
      <div className="ui-page-bg ui-text-muted flex min-h-screen items-center justify-center px-4 text-sm">
        Checking session...
      </div>
    )
  }

  // If not logged in, redirect to /login immediately.
  // `replace` replaces the current history entry so the user can't
  // press the back button to slip past the guard.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If logged in, render the protected content as normal.
  return <>{children}</>
}
