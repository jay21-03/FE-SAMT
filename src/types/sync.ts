export type SyncJobType = "JIRA_ISSUES" | "GITHUB_COMMITS";
export type SyncJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface SyncRequest {
  projectConfigId: string;
}

export interface SyncResult {
  syncJobId: number;
  projectConfigId: string;
  jobType: SyncJobType;
  success: boolean;
  degraded: boolean;
  recordsFetched: number;
  recordsSaved: number;
  durationMs: number;
  errorMessage?: string | null;
  correlationId?: string;
}

export interface SyncAllResult {
  projectConfigId: string;
  success: boolean;
  degraded: boolean;
  durationMs: number;
  correlationId?: string;
  jira: SyncResult;
  github: SyncResult;
}

export interface SyncJob {
  syncJobId: number;
  projectConfigId: string;
  jobType: SyncJobType;
  status: SyncJobStatus;
  startedAt?: string;
  completedAt?: string;
  recordsFetched?: number;
  recordsSaved?: number;
  degraded: boolean;
  errorMessage?: string | null;
  correlationId?: string;
}

export interface SyncJobsQuery {
  projectConfigId?: string;
  jobType?: SyncJobType;
  status?: SyncJobStatus;
  page?: number;
  size?: number;
}

export interface SyncJobsPage {
  content: SyncJob[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
