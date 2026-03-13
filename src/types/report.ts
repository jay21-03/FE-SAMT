// Report types
export type ReportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ExportType = "DOCX" | "PDF";
export type ActivitySource = "JIRA" | "GITHUB" | "ALL";

// Request types
export interface GenerateReportRequest {
  projectConfigId: number;
  useAi?: boolean;
  exportType?: ExportType;
}

export interface ReportsQuery {
  projectConfigId?: number;
  type?: string;
  createdBy?: string;
  page?: number;
  size?: number;
}

export interface StudentTasksQuery {
  semesterId?: number;
  status?: string;
  source?: ActivitySource;
  page?: number;
  size?: number;
}

export interface GithubStatsQuery {
  groupId: number;
  from?: string;
  to?: string;
}

export interface LecturerOverviewQuery {
  semesterId?: number;
}

export interface GroupProgressQuery {
  from?: string;
  to?: string;
}

export interface RecentActivitiesQuery {
  source?: ActivitySource;
  page?: number;
  size?: number;
}

// Response types
export interface ReportResponse {
  reportId: string;
  status: ReportStatus;
  createdAt: string;
  downloadUrl: string;
}

export interface ReportMetadata {
  reportId: string;
  projectConfigId: number;
  type: string;
  createdBy: string;
  createdAt: string;
  status: ReportStatus;
  fileName: string;
  downloadUrl: string;
}

export interface StudentTask {
  taskId: string;
  source: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  groupId: number;
  groupName: string;
  assignee: string;
  updatedAt: string;
  url: string;
}

export interface GithubStats {
  commitCount: number;
  prCount: number;
  mergedPrCount: number;
  reviewCount: number;
  activeDays: number;
  lastCommitAt: string | null;
}

export interface ContributionSummary {
  studentId: number;
  groupId: number;
  taskCount: number;
  completedTaskCount: number;
  githubCommitCount: number;
  githubPrCount: number;
  contributionScore: number;
  recentHighlights: string[];
}

export interface LecturerOverview {
  lecturerId: number;
  semesterId: number | null;
  groupCount: number;
  studentCount: number;
  taskCount: number;
  completedTaskCount: number;
  githubCommitCount: number;
  githubPrCount: number;
  lastSyncAt: string | null;
}

export interface GroupProgress {
  groupId: number;
  groupName: string;
  completionRate: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  taskByType: Record<string, number>;
  taskByStatus: Record<string, number>;
}

export interface RecentActivity {
  activityId: number;
  source: string;
  type: string;
  title: string;
  author: string;
  occurredAt: string;
  externalId: string;
  url: string;
}

// Page response
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
