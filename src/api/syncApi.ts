import type {
  SyncRequest,
  SyncResult,
  SyncAllResult,
  SyncJob,
  SyncJobsQuery,
  SyncJobsPage,
} from "../types/sync";
import { api } from "./apiClient";
import { unwrapApiData } from "./response";

const postSync = async <T>(path: string, projectConfigId: string): Promise<T> => {
  const payload: SyncRequest = { projectConfigId };
  const { data } = await api.post<unknown>(path, payload);
  return unwrapApiData<T>(data);
};

export const syncApi = {
  /**
   * Sync Jira issues for a project config
   */
  async syncJiraIssues(projectConfigId: string): Promise<SyncResult> {
    return postSync<SyncResult>("/api/sync/jira/issues", projectConfigId);
  },

  /**
   * Sync GitHub commits for a project config
   */
  async syncGithubCommits(projectConfigId: string): Promise<SyncResult> {
    return postSync<SyncResult>("/api/sync/github/commits", projectConfigId);
  },

  /**
   * Sync both Jira and GitHub in parallel
   */
  async syncAll(projectConfigId: string): Promise<SyncAllResult> {
    return postSync<SyncAllResult>("/api/sync/all", projectConfigId);
  },

  /**
   * Get sync job by ID
   */
  async getSyncJob(syncJobId: number): Promise<SyncJob> {
    const { data } = await api.get<unknown>(`/api/sync/jobs/${syncJobId}`);
    return unwrapApiData<SyncJob>(data);
  },

  /**
   * List sync jobs with optional filters
   */
  async listSyncJobs(query?: SyncJobsQuery): Promise<SyncJobsPage> {
    const { data } = await api.get<unknown>("/api/sync/jobs", {
      params: query,
    });
    return unwrapApiData<SyncJobsPage>(data);
  },
};
