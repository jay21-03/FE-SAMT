import type {
  ConfigEnvelope,
  CreateConfigRequest,
  UpdateConfigRequest,
  VerificationEnvelope,
} from "../types/projectConfig"
import { api } from "./apiClient"

export const projectConfigApi = {
  async createConfig(payload: CreateConfigRequest) {
    const r = await api.post<ConfigEnvelope>("/api/project-configs", payload)
    return r.data
  },

  async getConfig(id: string) {
    const r = await api.get<ConfigEnvelope | Record<string, unknown>>(`/api/project-configs/${id}`)
    return r.data
  },

  async updateConfig(id: string, payload: UpdateConfigRequest) {
    const r = await api.put<ConfigEnvelope | Record<string, unknown>>(`/api/project-configs/${id}`, payload)
    return r.data
  },

  async deleteConfig(id: string) {
    const r = await api.delete<Record<string, unknown>>(`/api/project-configs/${id}`)
    return r.data
  },

  async verifyConfig(id: string) {
    const r = await api.post<VerificationEnvelope>(`/api/project-configs/${id}/verify`)
    return r.data
  },

  async restoreConfig(id: string) {
    const r = await api.post<Record<string, unknown>>(`/api/project-configs/admin/${id}/restore`)
    return r.data
  },

  async getConfigByGroupId(groupId: number) {
    const r = await api.get<ConfigEnvelope>(`/api/project-configs/group/${groupId}`)
    return r.data
  },
}
