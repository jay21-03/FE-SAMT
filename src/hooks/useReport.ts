import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportApi } from "../api/reportApi";
import type {
  GenerateReportRequest,
  ReportsQuery,
  StudentTasksQuery,
  GithubStatsQuery,
  AdminOverviewQuery,
  LecturerOverviewQuery,
  GroupProgressQuery,
  RecentActivitiesQuery,
  LeaderGroupTasksQuery,
  MemberTasksQuery,
  TaskAssigneeUpdateRequest,
  TaskStatusUpdateRequest,
} from "../types/report";

export const reportQueryKeys = {
  reports: (query?: ReportsQuery) => ["reports", query] as const,
  report: (reportId: string) => ["report", reportId] as const,
  studentTasks: (query?: StudentTasksQuery) => ["studentTasks", query] as const,
  studentGithubStats: (query: GithubStatsQuery) => ["studentGithubStats", query] as const,
  studentContribution: (query: GithubStatsQuery) => ["studentContribution", query] as const,
  adminOverview: (query?: AdminOverviewQuery) => ["adminOverview", query] as const,
  lecturerOverview: (query?: LecturerOverviewQuery) => ["lecturerOverview", query] as const,
  groupProgress: (groupId: number, query?: GroupProgressQuery) =>
    ["groupProgress", groupId, query] as const,
  recentActivities: (groupId: number, query?: RecentActivitiesQuery) =>
    ["recentActivities", groupId, query] as const,
  leaderGroupTasks: (groupId: number, query?: LeaderGroupTasksQuery) =>
    ["leaderGroupTasks", groupId, query] as const,
  leaderGroupProgress: (groupId: number, query?: GroupProgressQuery) =>
    ["leaderGroupProgress", groupId, query] as const,
  leaderCommitSummary: (groupId: number, query?: GroupProgressQuery) =>
    ["leaderCommitSummary", groupId, query] as const,
  memberTasks: (query: MemberTasksQuery) => ["memberTasks", query] as const,
  memberTaskStats: (groupId: number) => ["memberTaskStats", groupId] as const,
  memberCommitStats: (groupId: number, query?: Omit<GithubStatsQuery, "groupId">) =>
    ["memberCommitStats", groupId, query] as const,
};

export const retryUnlessForbidden = (failureCount: number, error: any) => {
  const status = error?.response?.status;
  if (status === 403) return false;
  return failureCount < 2;
};

export const retryStudentStats = (failureCount: number, error: any) => {
  const status = error?.response?.status;
  if (status === 401 || status === 403 || status === 404 || status === 503) return false;
  return failureCount < 1;
};

// ============ Report Management Hooks ============

/**
 * Generate SRS report mutation
 */
export const useGenerateReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: GenerateReportRequest) => reportApi.generateSrsReport(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

/**
 * Get report metadata
 */
export const useReport = (reportId: string) =>
  useQuery({
    queryKey: reportQueryKeys.report(reportId),
    queryFn: () => reportApi.getReport(reportId),
    enabled: !!reportId,
  });

/**
 * List reports with filters
 */
export const useReports = (query?: ReportsQuery) =>
  useQuery({
    queryKey: reportQueryKeys.reports(query),
    queryFn: () => reportApi.listReports(query),
    staleTime: 30_000,
  });

/**
 * Download report mutation
 */
export const useDownloadReport = () =>
  useMutation({
    mutationFn: (input: string | { reportId: string; fileName?: string }) => {
      const payload = typeof input === "string" ? { reportId: input } : input
      return reportApi.downloadReport(payload.reportId, payload.fileName)
    },
    onSuccess: ({ url, fileName }) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });

// ============ Student Dashboard Hooks ============

/**
 * Get current student's tasks
 */
export const useStudentTasks = (query?: StudentTasksQuery) =>
  useQuery({
    queryKey: reportQueryKeys.studentTasks(query),
    queryFn: () => reportApi.getStudentTasks(query),
    staleTime: 30_000,
  });

/**
 * Get current student's GitHub stats
 */
export const useStudentGithubStats = (query: GithubStatsQuery) =>
  useQuery({
    queryKey: reportQueryKeys.studentGithubStats(query),
    queryFn: () => reportApi.getStudentGithubStats(query),
    enabled: query.groupId > 0,
    retry: retryStudentStats,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/**
 * Get current student's contribution summary
 */
export const useStudentContribution = (query: GithubStatsQuery) =>
  useQuery({
    queryKey: reportQueryKeys.studentContribution(query),
    queryFn: () => reportApi.getStudentContributionSummary(query),
    enabled: query.groupId > 0,
    retry: retryStudentStats,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

// ============ Lecturer Dashboard Hooks ============

/**
 * Get lecturer overview metrics
 */
export const useLecturerOverview = (query?: LecturerOverviewQuery) =>
  useQuery({
    queryKey: reportQueryKeys.lecturerOverview(query),
    queryFn: () => reportApi.getLecturerOverview(query),
    staleTime: 60_000,
  });

/**
 * Get admin overview metrics
 */
export const useAdminOverview = (query?: AdminOverviewQuery) =>
  useQuery({
    queryKey: reportQueryKeys.adminOverview(query),
    queryFn: () => reportApi.getAdminOverview(query),
    staleTime: 60_000,
  });

/**
 * Get group task progress
 */
export const useGroupProgress = (groupId: number, query?: GroupProgressQuery) =>
  useQuery({
    queryKey: reportQueryKeys.groupProgress(groupId, query),
    queryFn: () => reportApi.getGroupProgress(groupId, query),
    enabled: groupId > 0,
    retry: retryUnlessForbidden,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/**
 * Get recent activities for a group
 */
export const useRecentActivities = (groupId: number, query?: RecentActivitiesQuery) =>
  useQuery({
    queryKey: reportQueryKeys.recentActivities(groupId, query),
    queryFn: () => reportApi.getRecentActivities(groupId, query),
    enabled: groupId > 0,
    retry: retryUnlessForbidden,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const useLeaderGroupTasks = (groupId: number, query?: LeaderGroupTasksQuery) =>
  useQuery({
    queryKey: reportQueryKeys.leaderGroupTasks(groupId, query),
    queryFn: () => reportApi.getLeaderGroupTasks(groupId, query),
    enabled: groupId > 0,
    retry: retryUnlessForbidden,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const useLeaderGroupProgress = (groupId: number, query?: GroupProgressQuery) =>
  useQuery({
    queryKey: reportQueryKeys.leaderGroupProgress(groupId, query),
    queryFn: () => reportApi.getLeaderGroupProgress(groupId, query),
    enabled: groupId > 0,
    retry: retryUnlessForbidden,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const useLeaderCommitSummary = (groupId: number, query?: GroupProgressQuery) =>
  useQuery({
    queryKey: reportQueryKeys.leaderCommitSummary(groupId, query),
    queryFn: () => reportApi.getLeaderCommitSummary(groupId, query),
    enabled: groupId > 0,
    retry: retryUnlessForbidden,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const useAssignLeaderTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      taskId,
      request,
    }: {
      groupId: number;
      taskId: string;
      request: TaskAssigneeUpdateRequest;
    }) => reportApi.assignLeaderTask(groupId, taskId, request),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["leaderGroupTasks", vars.groupId] });
    },
  });
};

export const useUpdateLeaderTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      taskId,
      request,
    }: {
      groupId: number;
      taskId: string;
      request: TaskStatusUpdateRequest;
    }) => reportApi.updateLeaderTaskStatus(groupId, taskId, request),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["leaderGroupTasks", vars.groupId] });
      qc.invalidateQueries({ queryKey: ["leaderGroupProgress", vars.groupId] });
    },
  });
};

export const useMemberTasks = (query: MemberTasksQuery) =>
  useQuery({
    queryKey: reportQueryKeys.memberTasks(query),
    queryFn: () => reportApi.getMemberTasks(query),
    enabled: query.groupId > 0,
    retry: retryUnlessForbidden,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const useUpdateMemberTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      groupId,
      request,
    }: {
      taskId: string;
      groupId: number;
      request: TaskStatusUpdateRequest;
    }) => reportApi.updateMemberTaskStatus(taskId, groupId, request),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["memberTasks"] });
      qc.invalidateQueries({ queryKey: reportQueryKeys.memberTaskStats(vars.groupId) });
    },
  });
};

export const useMemberTaskStats = (groupId: number) =>
  useQuery({
    queryKey: reportQueryKeys.memberTaskStats(groupId),
    queryFn: () => reportApi.getMemberTaskStats(groupId),
    enabled: groupId > 0,
    retry: retryUnlessForbidden,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const useMemberCommitStats = (groupId: number, query?: Omit<GithubStatsQuery, "groupId">) =>
  useQuery({
    queryKey: reportQueryKeys.memberCommitStats(groupId, query),
    queryFn: () => reportApi.getMemberCommitStats(groupId, query),
    enabled: groupId > 0,
    retry: retryUnlessForbidden,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
