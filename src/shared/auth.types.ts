// Shared auth API contracts used by both frontend and worker.
// Keeping these in one place prevents type drift across layers.

import type { UserRole } from './users.types'

export type AuthUser = {
  id: number
  name: string
  role: UserRole
  imageUrl: string | null
}

export type AuthPermissions = {
  canAccessAdminControls: boolean
  showDayIcons: boolean
  showNightIcons: boolean
}

export type LoginRequest = {
  username: string
  password: string
}

export type AuthSuccessResponse = {
  ok: true
  user: AuthUser
  permissions: AuthPermissions
}

export type AuthErrorResponse = {
  ok: false
  error: string
}

export type LoginResponse = AuthSuccessResponse | AuthErrorResponse
export type SessionResponse = AuthSuccessResponse | AuthErrorResponse

export type LogoutResponse = {
  ok: boolean
}
