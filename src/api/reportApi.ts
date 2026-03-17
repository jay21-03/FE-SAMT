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
  AdminOverview,
  AdminOverviewQuery,
  LecturerOverviewQuery,
  LecturerOverview,
  GroupProgressQuery,
  GroupProgress,
  RecentActivitiesQuery,
  RecentActivity,
  LeaderGroupTasksQuery,
  MemberTasksQuery,
  TaskAssigneeUpdateRequest,
  TaskStatusUpdateRequest,
  TeamCommitSummary,
  TeamMemberTaskStats,
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
  async downloadReport(reportId: string, fallbackFileName?: string): Promise<{ url: string; fileName: string }> {
    const response = await api.get(`/api/reports/${reportId}/download`, {
      responseType: "blob",
    });

    const contentDisposition = response.headers["content-disposition"];
    let fileName = fallbackFileName || `report_${reportId}`;
    if (contentDisposition) {
      const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;\n]+)/i);
      const plainMatch = contentDisposition.match(/filename="?([^";\n]+)"?/i);
      const encodedName = utf8Match?.[1] || plainMatch?.[1];
      if (encodedName) {
        fileName = decodeURIComponent(encodedName.trim());
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
   * Get admin overview metrics
   */
  async getAdminOverview(query?: AdminOverviewQuery): Promise<AdminOverview> {
    const { data } = await api.get<ApiResponse<AdminOverview>>(
      "/api/reports/admin/overview",
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

  // ============ Team Leader Dashboard ============

  async getLeaderGroupTasks(
    groupId: number,
    query?: LeaderGroupTasksQuery
  ): Promise<PageResponse<StudentTask>> {
    const { data } = await api.get<ApiResponse<PageResponse<StudentTask>>>(
      `/api/reports/leader/groups/${groupId}/tasks`,
      { params: query }
    );
    return data.data;
  },

  async assignLeaderTask(
    groupId: number,
    taskId: string,
    request: TaskAssigneeUpdateRequest
  ): Promise<StudentTask> {
    const { data } = await api.patch<ApiResponse<StudentTask>>(
      `/api/reports/leader/groups/${groupId}/tasks/${taskId}/assignee`,
      request
    );
    return data.data;
  },

  async updateLeaderTaskStatus(
    groupId: number,
    taskId: string,
    request: TaskStatusUpdateRequest
  ): Promise<StudentTask> {
    const { data } = await api.patch<ApiResponse<StudentTask>>(
      `/api/reports/leader/groups/${groupId}/tasks/${taskId}/status`,
      request
    );
    return data.data;
  },

  async getLeaderGroupProgress(groupId: number, query?: GroupProgressQuery): Promise<GroupProgress> {
    const { data } = await api.get<ApiResponse<GroupProgress>>(
      `/api/reports/leader/groups/${groupId}/progress`,
      { params: query }
    );
    return data.data;
  },

  async getLeaderCommitSummary(groupId: number, query?: GroupProgressQuery): Promise<TeamCommitSummary> {
    const { data } = await api.get<ApiResponse<TeamCommitSummary>>(
      `/api/reports/leader/groups/${groupId}/commit-summary`,
      { params: query }
    );
    return data.data;
  },

  // ============ Team Member Dashboard ============

  async getMemberTasks(query: MemberTasksQuery): Promise<PageResponse<StudentTask>> {
    const { data } = await api.get<ApiResponse<PageResponse<StudentTask>>>(
      "/api/reports/members/me/tasks",
      { params: query }
    );
    return data.data;
  },

  async updateMemberTaskStatus(
    taskId: string,
    groupId: number,
    request: TaskStatusUpdateRequest
  ): Promise<StudentTask> {
    const { data } = await api.patch<ApiResponse<StudentTask>>(
      `/api/reports/members/me/tasks/${taskId}/status`,
      request,
      { params: { groupId } }
    );
    return data.data;
  },

  async getMemberTaskStats(groupId: number): Promise<TeamMemberTaskStats> {
    const { data } = await api.get<ApiResponse<TeamMemberTaskStats>>(
      "/api/reports/members/me/task-stats",
      { params: { groupId } }
    );
    return data.data;
  },

  async getMemberCommitStats(groupId: number, query?: Omit<GithubStatsQuery, "groupId">): Promise<GithubStats> {
    const { data } = await api.get<ApiResponse<GithubStats>>(
      "/api/reports/members/me/commit-stats",
      { params: { groupId, ...(query ?? {}) } }
    );
    return data.data;
  },
};
