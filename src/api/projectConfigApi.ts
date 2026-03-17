import type {
  ConfigEnvelope,
  CreateConfigRequest,
  UpdateConfigRequest,
  VerificationEnvelope,
} from "../types/projectConfig"
import { api } from "./apiClient"
import { unwrapApiData } from "./response"

export const projectConfigApi = {
  async createConfig(payload: CreateConfigRequest) {
    const r = await api.post<ConfigEnvelope>("/api/project-configs", payload)
    return unwrapApiData<ConfigEnvelope>(r.data)
  },

  async getConfig(id: string) {
    const r = await api.get<ConfigEnvelope | Record<string, unknown>>(`/api/project-configs/${id}`)
    return unwrapApiData<ConfigEnvelope | Record<string, unknown>>(r.data)
  },

  async updateConfig(id: string, payload: UpdateConfigRequest) {
    const r = await api.put<ConfigEnvelope | Record<string, unknown>>(`/api/project-configs/${id}`, payload)
    return unwrapApiData<ConfigEnvelope | Record<string, unknown>>(r.data)
  },

  async deleteConfig(id: string) {
    const r = await api.delete<Record<string, unknown>>(`/api/project-configs/${id}`)
    return unwrapApiData<Record<string, unknown>>(r.data)
  },

  async verifyConfig(id: string) {
    const r = await api.post<VerificationEnvelope>(`/api/project-configs/${id}/verify`)
    return unwrapApiData<VerificationEnvelope>(r.data)
  },

  async restoreConfig(id: string) {
    const r = await api.post<Record<string, unknown>>(`/api/project-configs/admin/${id}/restore`)
    return unwrapApiData<Record<string, unknown>>(r.data)
  },

  async getConfigByGroupId(groupId: number) {
    const r = await api.get<ConfigEnvelope>(`/api/project-configs/group/${groupId}`)
    return unwrapApiData<ConfigEnvelope>(r.data)
  },
}
