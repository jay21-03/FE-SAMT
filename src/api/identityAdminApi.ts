import type {
  AdminActionResponse,
  AdminCreateUserRequest,
  AdminCreateUserResponse,
  AuditPage,
  AuditQuery,
  ExternalAccountsRequest,
  ExternalAccountsResponse,
} from "../types/identity"
import { api } from "./apiClient"

export const identityAdminApi = {
  async createUser(payload: AdminCreateUserRequest) {
    const r = await api.post<AdminCreateUserResponse>("/api/admin/users", payload)
    return r.data
  },

  async deleteUser(userId: number) {
    const r = await api.delete<AdminActionResponse>(`/api/admin/users/${userId}`)
    return r.data
  },

  async restoreUser(userId: number) {
    const r = await api.post<AdminActionResponse>(`/api/admin/users/${userId}/restore`)
    return r.data
  },

  async lockUser(userId: number, reason?: string) {
    const r = await api.post<AdminActionResponse>(`/api/admin/users/${userId}/lock`, undefined, {
      params: reason ? { reason } : undefined,
    })
    return r.data
  },

  async unlockUser(userId: number) {
    const r = await api.post<AdminActionResponse>(`/api/admin/users/${userId}/unlock`)
    return r.data
  },

  async updateExternalAccounts(userId: number, payload: ExternalAccountsRequest) {
    const r = await api.put<ExternalAccountsResponse>(`/api/admin/users/${userId}/external-accounts`, payload)
    return r.data
  },

  async getSecurityEvents(query?: AuditQuery) {
    const r = await api.get<AuditPage>("/api/admin/audit/security-events", { params: query })
    return r.data
  },

  async getAuditByRange(query?: AuditQuery) {
    const r = await api.get<AuditPage>("/api/admin/audit/range", { params: query })
    return r.data
  },

  async getAuditByEntity(entityType: string, entityId: number, query?: AuditQuery) {
    const r = await api.get<AuditPage>(`/api/admin/audit/entity/${entityType}/${entityId}`, { params: query })
    return r.data
  },

  async getAuditByActor(actorId: number, query?: AuditQuery) {
    const r = await api.get<AuditPage>(`/api/admin/audit/actor/${actorId}`, { params: query })
    return r.data
  },
}
