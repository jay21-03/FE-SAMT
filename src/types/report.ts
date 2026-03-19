// Report types
export type ReportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ExportType = "DOCX" | "PDF";
export type ActivitySource = "JIRA" | "GITHUB" | "ALL";

// Request types
export interface GenerateReportRequest {
  projectConfigId: string;
  useAi?: boolean;
  exportType?: ExportType;
}

export interface AnalyticsTimeRange {
  from: string;
  to: string;
}

export interface AnalyticsMember {
  id: string;
  name: string;
  email?: string;
  githubUsername?: string;
}

export interface AnalyticsJiraIssue {
  id: string;
  assigneeId: string;
  status: string;
  createdAt: string;
  completedAt?: string | null;
  dueDate?: string | null;
}

export interface AnalyticsGitCommit {
  authorId: string;
  message: string;
  linesAdded: number;
  linesDeleted: number;
  timestamp: string;
}

export interface AnalyticsReportRequest {
  projectConfigId: string;
  groupId: string;
  timeRange: AnalyticsTimeRange;
  members: AnalyticsMember[];
  jiraIssues: AnalyticsJiraIssue[];
  gitCommits: AnalyticsGitCommit[];
}

export interface ReportsQuery {
  projectConfigId?: string;
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

export interface AdminOverviewQuery {
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

export interface LeaderGroupTasksQuery {
  status?: string;
  page?: number;
  size?: number;
}

export interface MemberTasksQuery {
  groupId: number;
  status?: string;
  page?: number;
  size?: number;
}

export interface TaskAssigneeUpdateRequest {
  assigneeUserId: number;
}

export interface TaskStatusUpdateRequest {
  status: string;
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
  projectConfigId: string;
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

export type HealthStatus = "HEALTHY" | "DEGRADED" | "ISSUE" | "NO_DATA";
export type ServerHealth = "ONLINE" | "DEGRADED" | "OFFLINE";

export interface AdminOverview {
  semesterId: number | null;
  totalUsers: number;
  totalGroups: number;
  activeProjects: number;
  pendingSyncJobs: number;
  jiraApiHealth: HealthStatus;
  githubApiHealth: HealthStatus;
  serverHealth: ServerHealth;
  lastCalculatedAt: string;
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

export interface MemberCommitSummary {
  authorEmail: string;
  authorName: string;
  authorLogin: string;
  commitCount: number;
  additions: number;
  deletions: number;
  totalChanges: number;
}

export interface TeamCommitSummary {
  groupId: number;
  from: string | null;
  to: string | null;
  totalCommits: number;
  totalPullRequests: number;
  activeContributors: number;
  members: MemberCommitSummary[];
}

export interface TeamMemberTaskStats {
  groupId: number;
  memberId: number;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  todo: number;
  completionRate: number;
}

// Page response
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
