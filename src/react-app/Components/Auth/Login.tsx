'use client'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LockClosedIcon, UserIcon } from '@heroicons/react/24/outline'
import { useAuth } from './AuthContext'
import type { LoginFormState, LoginStatus } from './login.types'

// ─── Login ─────────────────────────────────────────────────────────────────────
//
// The login page — the first thing users see when they visit the site.
// It collects a username and password, and (once the backend is wired up)
// sends them to the server to verify.
//
// Current state: submission is STUBBED — it calls login() immediately without
// actually checking credentials. Replace the TODO block with a real API call.
export default function Login() {
  // `form` holds whatever the user has typed into the input fields.
  const [form, setForm] = useState<LoginFormState>({ username: '', password: '' })

  // `status` tracks what stage the login process is in so the UI can react.
  // See login.types.ts for the full list of possible values.
  const [status, setStatus] = useState<LoginStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // `login()` sends credentials to the backend and updates global auth state on success.
  const { login } = useAuth()

  // `navigate` lets us change the URL programmatically after a successful login.
  const navigate = useNavigate()

  // Called every time the user types in either input field.
  // It updates only the field that changed and keeps the rest of the form intact.
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Called when the user clicks "Sign in".
  // e.preventDefault() stops the browser from doing a full page reload (default form behaviour).
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage(null)

    // Send credentials to the backend. If they are valid, the backend writes
    // an HttpOnly session cookie and AuthContext becomes authenticated.
    const result = await login(form.username, form.password)

    if (!result.ok) {
      setStatus('error')
      setErrorMessage(result.error ?? 'Invalid username or password. Please try again.')
      return
    }

    setStatus('success')
    navigate('/app', { replace: true })
  }

  return (
    <div className="ui-page-bg flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* ── Header ── */}
        <div className="text-center">
          <LockClosedIcon className="ui-auth-accent-icon mx-auto h-10 w-10" />
          <h2 className="ui-text-primary mt-4 text-2xl font-bold tracking-tight">
            Sign in to Attendency
          </h2>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="ui-auth-label block text-sm font-medium"
            >
              Username
            </label>
            <div className="relative mt-1">
              <UserIcon className="ui-auth-input-icon pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={form.username}
                onChange={handleChange}
                className="ui-auth-input block w-full rounded-md border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1"
                placeholder="your username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="ui-auth-label block text-sm font-medium"
            >
              Password
            </label>
            <div className="relative mt-1">
              <LockClosedIcon className="ui-auth-input-icon pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                className="ui-auth-input block w-full rounded-md border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Error message */}
          {status === 'error' && (
            <p className="ui-danger-text text-sm">
              {errorMessage ?? 'Invalid username or password. Please try again.'}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="ui-auth-submit ui-accent-ring flex w-full justify-center rounded-md px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
          >
            {status === 'submitting' ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
