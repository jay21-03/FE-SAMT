import type { Envelope } from "./common"

export interface CreateConfigRequest {
  groupId: number
  jiraHostUrl: string
  jiraEmail: string
  jiraApiToken: string
  githubRepoUrl: string
  githubToken: string
}

export interface UpdateConfigRequest {
  jiraHostUrl?: string
  jiraEmail?: string
  jiraApiToken?: string
  githubRepoUrl?: string
  githubToken?: string
}

export interface ConfigData {
  id: string
  groupId: number
  jiraHostUrl: string
  jiraEmail: string
  jiraApiToken: string
  githubRepoUrl: string
  githubToken: string
  state: string
  lastVerifiedAt?: string | null
  invalidReason?: string | null
  createdAt: string
  updatedAt: string
}

export type ConfigEnvelope = Envelope<ConfigData>

export interface VerificationEnvelope {
  data: Record<string, unknown>
  timestamp: string
}
