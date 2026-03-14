import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportApi } from "../api/reportApi";
import type {
  GenerateReportRequest,
  ReportsQuery,
  StudentTasksQuery,
  GithubStatsQuery,
  LecturerOverviewQuery,
  GroupProgressQuery,
  RecentActivitiesQuery,
} from "../types/report";

export const reportQueryKeys = {
  reports: (query?: ReportsQuery) => ["reports", query] as const,
  report: (reportId: string) => ["report", reportId] as const,
  studentTasks: (query?: StudentTasksQuery) => ["studentTasks", query] as const,
  studentGithubStats: (query: GithubStatsQuery) => ["studentGithubStats", query] as const,
  studentContribution: (query: GithubStatsQuery) => ["studentContribution", query] as const,
  lecturerOverview: (query?: LecturerOverviewQuery) => ["lecturerOverview", query] as const,
  groupProgress: (groupId: number, query?: GroupProgressQuery) =>
    ["groupProgress", groupId, query] as const,
  recentActivities: (groupId: number, query?: RecentActivitiesQuery) =>
    ["recentActivities", groupId, query] as const,
};

const retryUnlessForbidden = (failureCount: number, error: any) => {
  const status = error?.response?.status;
  if (status === 403) return false;
  return failureCount < 2;
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
    mutationFn: (reportId: string) => reportApi.downloadReport(reportId),
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
    staleTime: 60_000,
  });

/**
 * Get current student's contribution summary
 */
export const useStudentContribution = (query: GithubStatsQuery) =>
  useQuery({
    queryKey: reportQueryKeys.studentContribution(query),
    queryFn: () => reportApi.getStudentContributionSummary(query),
    enabled: query.groupId > 0,
    staleTime: 60_000,
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
 * Get group task progress
 */
export const useGroupProgress = (groupId: number, query?: GroupProgressQuery) =>
  useQuery({
    queryKey: reportQueryKeys.groupProgress(groupId, query),
    queryFn: () => reportApi.getGroupProgress(groupId, query),
    enabled: groupId > 0,
    retry: retryUnlessForbidden,
    staleTime: 60_000,
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
  });
