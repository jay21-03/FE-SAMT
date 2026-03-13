import type {
  SyncRequest,
  SyncResult,
  SyncAllResult,
  SyncJob,
  SyncJobsQuery,
  SyncJobsPage,
} from "../types/sync";
import { api } from "./apiClient";

interface ApiResponse<T> {
  status: number;
  success: boolean;
  data: T;
  path: string;
  correlationId?: string;
  degraded?: boolean;
}

export const syncApi = {
  /**
   * Sync Jira issues for a project config
   */
  async syncJiraIssues(projectConfigId: string): Promise<SyncResult> {
    const payload: SyncRequest = { projectConfigId };
    const { data } = await api.post<ApiResponse<SyncResult>>("/api/sync/jira/issues", payload);
    return data.data;
  },

  /**
   * Sync GitHub commits for a project config
   */
  async syncGithubCommits(projectConfigId: string): Promise<SyncResult> {
    const payload: SyncRequest = { projectConfigId };
    const { data } = await api.post<ApiResponse<SyncResult>>("/api/sync/github/commits", payload);
    return data.data;
  },

  /**
   * Sync both Jira and GitHub in parallel
   */
  async syncAll(projectConfigId: string): Promise<SyncAllResult> {
    const payload: SyncRequest = { projectConfigId };
    const { data } = await api.post<ApiResponse<SyncAllResult>>("/api/sync/all", payload);
    return data.data;
  },

  /**
   * Get sync job by ID
   */
  async getSyncJob(syncJobId: number): Promise<SyncJob> {
    const { data } = await api.get<ApiResponse<SyncJob>>(`/api/sync/jobs/${syncJobId}`);
    return data.data;
  },

  /**
   * List sync jobs with optional filters
   */
  async listSyncJobs(query?: SyncJobsQuery): Promise<SyncJobsPage> {
    const { data } = await api.get<ApiResponse<SyncJobsPage>>("/api/sync/jobs", { params: query });
    return data.data;
  },
};
