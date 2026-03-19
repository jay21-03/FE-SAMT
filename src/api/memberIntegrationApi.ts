import { api } from "./apiClient"
import { unwrapApiData } from "./response"

export type MemberIntegrationsUpdate = {
  jiraAccountId?: string
  githubUsername?: string
}

export const memberIntegrationApi = {
  async getJiraAccountId(email: string): Promise<{ accountId: string }> {
    const r = await api.get<{ accountId: string }>("/api/integrations/jira/account-id", {
      params: { email },
    })
    return unwrapApiData<{ accountId: string }>(r.data)
  },

  async updateMemberIntegrations(memberId: number, payload: MemberIntegrationsUpdate) {
    const r = await api.put<{ id: number; jiraAccountId: string | null; githubUsername: string | null }>(
      `/api/members/${memberId}/integrations`,
      payload,
    )
    return unwrapApiData<{ id: number; jiraAccountId: string | null; githubUsername: string | null }>(r.data)
  },

  async syncJira(memberId: number) {
    const r = await api.post<{ id: number; jiraAccountId: string | null; githubUsername: string | null }>(
      `/api/members/${memberId}/sync-jira`,
    )
    return unwrapApiData<{ id: number; jiraAccountId: string | null; githubUsername: string | null }>(r.data)
  },
}

