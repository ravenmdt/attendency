export type UserQualification = 'NONE' | 'PTT' | 'ACT' | 'PTT TO ACT'

export type UserRole = 'User' | 'Admin'

export type UserListApiRow = {
  id: number
  name: string
  qualification: UserQualification
  role: UserRole
  imageUrl: string | null
  lastLoginAt: number | null
  isOnline: boolean
}

export type UsersListSuccessResponse = {
  ok: true
  rows: UserListApiRow[]
}

export type UsersListErrorResponse = {
  ok: false
  error: string
}

export type UsersListResponse = UsersListSuccessResponse | UsersListErrorResponse
