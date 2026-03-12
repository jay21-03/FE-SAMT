import type { Envelope, PageResponse, PageableQuery } from "./common"
import type { UserRole } from "./auth"

export interface IdentityUser {
  id: number
  email: string
  fullName: string
  role?: UserRole
  status?: string
  jiraAccountId?: string | null
  githubUsername?: string | null
  createdAt?: string
}

export interface AdminCreateUserRequest {
  email: string
  password: string
  fullName: string
  role: UserRole
}

export interface AdminCreateUserResponse {
  message: string
  user: IdentityUser
  temporaryPassword?: string
}

export interface AdminActionResponse {
  message: string
  userId: string
}

export interface ExternalAccountsRequest {
  jiraAccountId?: string | null
  githubUsername?: string | null
}

export interface ExternalAccountsResponse {
  message: string
  user: IdentityUser
}

export interface ProfileEnvelope extends Envelope<IdentityUser> {
  status: number
  success: boolean
  path: string
  correlationId: string
}

export interface UpdateProfileRequest {
  email: string
  fullName: string
}

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "SOFT_DELETE"
  | "RESTORE"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_DENIED"
  | "LOGOUT"
  | "REFRESH_SUCCESS"
  | "REFRESH_REUSE"
  | "REFRESH_EXPIRED"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_UNLOCKED"
  | "PASSWORD_CHANGE"

export type AuditOutcome = "SUCCESS" | "FAILURE" | "DENIED"

export interface AuditLog {
  id: number
  entityType: string
  entityId: number
  action: AuditAction
  actorId?: number | null
  actorEmail?: string | null
  timestamp: string
  ipAddress?: string | null
  userAgent?: string | null
  oldValue?: unknown
  newValue?: unknown
  outcome: AuditOutcome
}

export type AuditPage = PageResponse<AuditLog>

export interface AuditQuery extends PageableQuery {
  startDate?: string
  endDate?: string
  outcome?: AuditOutcome
}
