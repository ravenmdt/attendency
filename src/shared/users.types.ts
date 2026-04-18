export type UserQualification = 'NONE' | 'PTT' | 'ACT' | 'PTT TO ACT'

export type UserRole = 'User' | 'Admin Assistant' | 'Admin'

export type UserListApiRow = {
  id: number
  name: string
  qualification: UserQualification
  role: UserRole
  imageUrl: string | null
  lastLoginAt: number | null
  isOnline: boolean
}

export type UserDetailApiRow = UserListApiRow

export type UserUpdateRequest = {
  name: string
  qualification: UserQualification
  role: UserRole
}

export type UserCreateRequest = {
  name: string
  qualification: UserQualification
  role: UserRole
  password?: string
}

export type UsersListSuccessResponse = {
  ok: true
  rows: UserListApiRow[]
}

export type UsersListErrorResponse = {
  ok: false
  error: string
}

export type UserDetailSuccessResponse = {
  ok: true
  user: UserDetailApiRow
}

export type UserSaveSuccessResponse = {
  ok: true
  user: UserDetailApiRow
}

export type UserCreateSuccessResponse = {
  ok: true
  user: UserDetailApiRow
}

export type UserPasswordResetSuccessResponse = {
  ok: true
  message: string
}

export type UserDeleteSuccessResponse = {
  ok: true
  deletedCurrentUser: boolean
}

export type UsersListResponse = UsersListSuccessResponse | UsersListErrorResponse
export type UserDetailResponse = UserDetailSuccessResponse | UsersListErrorResponse
export type UserSaveResponse = UserSaveSuccessResponse | UsersListErrorResponse
export type UserCreateResponse = UserCreateSuccessResponse | UsersListErrorResponse
export type UserPasswordResetResponse =
  | UserPasswordResetSuccessResponse
  | UsersListErrorResponse
export type UserDeleteResponse = UserDeleteSuccessResponse | UsersListErrorResponse
