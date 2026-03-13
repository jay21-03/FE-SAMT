import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { syncApi } from "../api/syncApi";
import type { SyncJobsQuery } from "../types/sync";

export const syncQueryKeys = {
  syncJobs: (query?: SyncJobsQuery) => ["syncJobs", query] as const,
  syncJob: (jobId: number) => ["syncJob", jobId] as const,
};

/**
 * Hook to sync Jira issues
 */
export const useSyncJira = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectConfigId: string) => syncApi.syncJiraIssues(projectConfigId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["syncJobs"] });
    },
  });
};

/**
 * Hook to sync GitHub commits
 */
export const useSyncGithub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectConfigId: string) => syncApi.syncGithubCommits(projectConfigId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["syncJobs"] });
    },
  });
};

/**
 * Hook to sync both Jira and GitHub
 */
export const useSyncAll = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectConfigId: string) => syncApi.syncAll(projectConfigId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["syncJobs"] });
    },
  });
};

/**
 * Hook to get a specific sync job
 */
export const useSyncJob = (syncJobId: number) =>
  useQuery({
    queryKey: syncQueryKeys.syncJob(syncJobId),
    queryFn: () => syncApi.getSyncJob(syncJobId),
    enabled: syncJobId > 0,
  });

/**
 * Hook to list sync jobs with filters
 */
export const useSyncJobs = (query?: SyncJobsQuery) =>
  useQuery({
    queryKey: syncQueryKeys.syncJobs(query),
    queryFn: () => syncApi.listSyncJobs(query),
    staleTime: 10_000,
  });
