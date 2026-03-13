import { api } from "./apiClient";
import type {
  GenerateReportRequest,
  ReportsQuery,
  ReportResponse,
  ReportMetadata,
  PageResponse,
  StudentTasksQuery,
  StudentTask,
  GithubStatsQuery,
  GithubStats,
  ContributionSummary,
  LecturerOverviewQuery,
  LecturerOverview,
  GroupProgressQuery,
  GroupProgress,
  RecentActivitiesQuery,
  RecentActivity,
} from "../types/report";

interface ApiResponse<T> {
  status: number;
  success: boolean;
  data: T;
  path: string;
}

export const reportApi = {
  // ============ Report Management ============

  /**
   * Generate SRS report
   */
  async generateSrsReport(request: GenerateReportRequest): Promise<ReportResponse> {
    const { data } = await api.post<ApiResponse<ReportResponse>>("/api/reports/srs", request);
    return data.data;
  },

  /**
   * Get report metadata by ID
   */
  async getReport(reportId: string): Promise<ReportMetadata> {
    const { data } = await api.get<ApiResponse<ReportMetadata>>(`/api/reports/${reportId}`);
    return data.data;
  },

  /**
   * List reports with filters
   */
  async listReports(query?: ReportsQuery): Promise<PageResponse<ReportMetadata>> {
    const { data } = await api.get<ApiResponse<PageResponse<ReportMetadata>>>("/api/reports", {
      params: query,
    });
    return data.data;
  },

  /**
   * Download report file - returns blob URL
   */
  async downloadReport(reportId: string): Promise<{ url: string; fileName: string }> {
    const response = await api.get(`/api/reports/${reportId}/download`, {
      responseType: "blob",
    });

    const contentDisposition = response.headers["content-disposition"];
    let fileName = `report_${reportId}.docx`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^;\n"']+)/i);
      if (match) {
        fileName = decodeURIComponent(match[1]);
      }
    }

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    return { url, fileName };
  },

  // ============ Student Dashboard ============

  /**
   * Get current student's tasks
   */
  async getStudentTasks(query?: StudentTasksQuery): Promise<PageResponse<StudentTask>> {
    const { data } = await api.get<ApiResponse<PageResponse<StudentTask>>>(
      "/api/reports/students/me/tasks",
      { params: query }
    );
    return data.data;
  },

  /**
   * Get current student's GitHub stats
   */
  async getStudentGithubStats(query: GithubStatsQuery): Promise<GithubStats> {
    const { data } = await api.get<ApiResponse<GithubStats>>(
      "/api/reports/students/me/github-stats",
      { params: query }
    );
    return data.data;
  },

  /**
   * Get current student's contribution summary
   */
  async getStudentContributionSummary(query: GithubStatsQuery): Promise<ContributionSummary> {
    const { data } = await api.get<ApiResponse<ContributionSummary>>(
      "/api/reports/students/me/contribution-summary",
      { params: query }
    );
    return data.data;
  },

  // ============ Lecturer Dashboard ============

  /**
   * Get lecturer overview metrics
   */
  async getLecturerOverview(query?: LecturerOverviewQuery): Promise<LecturerOverview> {
    const { data } = await api.get<ApiResponse<LecturerOverview>>(
      "/api/reports/lecturer/overview",
      { params: query }
    );
    return data.data;
  },

  /**
   * Get group task progress
   */
  async getGroupProgress(groupId: number, query?: GroupProgressQuery): Promise<GroupProgress> {
    const { data } = await api.get<ApiResponse<GroupProgress>>(
      `/api/reports/lecturer/groups/${groupId}/progress`,
      { params: query }
    );
    return data.data;
  },

  /**
   * Get recent activities for a group
   */
  async getRecentActivities(
    groupId: number,
    query?: RecentActivitiesQuery
  ): Promise<PageResponse<RecentActivity>> {
    const { data } = await api.get<ApiResponse<PageResponse<RecentActivity>>>(
      `/api/reports/lecturer/groups/${groupId}/recent-activities`,
      { params: query }
    );
    return data.data;
  },
};
