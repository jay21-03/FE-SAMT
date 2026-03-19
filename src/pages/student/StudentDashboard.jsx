import { useState, useMemo } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import { useMemberTasks, useStudentContribution, useUpdateMemberTaskStatus } from "../../hooks/useReport";
import { useProfile } from "../../hooks/useAuth";
import { useUserGroups } from "../../hooks/useUserGroups";
import StudentWorkspaceTabs from "../../components/StudentWorkspaceTabs";

export default function StudentDashboard() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Get current user profile to get userId
  const { data: profile, isLoading: profileLoading } = useProfile();
  const userId = profile?.id || 0;

  // Fetch student's group memberships using userId
  const { data: membershipsData, isLoading: membershipsLoading } = useUserGroups(userId);

  const memberships = membershipsData?.groups || [];
  const primaryGroup = memberships[0];
  const groupId = primaryGroup?.groupId || 0;

  // Build query for tasks
  const tasksQuery = useMemo(() => {
    const q = { groupId, page, size: 10 };
    if (statusFilter) q.status = statusFilter;
    return q;
  }, [groupId, page, statusFilter]);

  // Fetch member tasks (group-scoped) so status filters match Jira workflow
  const { data: tasksData, isLoading: tasksLoading } = useMemberTasks(tasksQuery);
  const updateTaskStatus = useUpdateMemberTaskStatus();

  // Fetch contribution summary for primary group - only when groupId is valid
  const { data: contributionData } = useStudentContribution({ groupId });

  const tasks = tasksData?.content || [];
  const totalPages = tasksData?.totalPages || 0;
  const totalElements = tasksData?.totalElements || 0;

  const contribution = contributionData || {
    taskCount: 0,
    completedTaskCount: 0,
    githubCommitCount: 0,
    githubPrCount: 0,
    contributionScore: 0,
    recentHighlights: [],
  };

  const isLoading = profileLoading || membershipsLoading || tasksLoading;

  const getStatusClass = (status) => {
    if (!status) return "";
    const s = status.toLowerCase().replace(/\s+/g, "-");
    switch (s) {
      case "approved":
      case "done":
        return "status-active";
      case "in-design":
      case "in-progress":
      case "in_design":
      case "in_progress":
        return "status-pending";
      case "todo":
      case "to-do":
        return "status-invited";
      default:
        return "";
    }
  };

  const getScoreLabel = (score) => {
    const s = Number(score || 0);
    if (s >= 90) return "Excellent";
    if (s >= 80) return "Very Good";
    if (s >= 70) return "Good";
    if (s >= 60) return "Fair";
    return "Needs Improvement";
  };

  const scoreDisplay =
    contribution.contributionScore > 0
      ? Math.min(100, Number(contribution.contributionScore)).toFixed(1)
      : "-";

  const statusOptions = ["TODO", "IN_PROGRESS", "DONE"];

  const getStatusLabel = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "DONE" || s === "APPROVED") return "APPROVED";
    if (s === "IN_PROGRESS" || s === "IN_DESIGN") return "IN DESIGN";
    return s || "-";
  };

  const canUpdateStatus = (task) => String(task?.source || "").toUpperCase() === "JIRA";

  const updateStatus = async (taskId, nextStatus) => {
    if (!taskId || !groupId || !nextStatus) return;
    try {
      setStatusUpdatingId(taskId);
      await updateTaskStatus.mutateAsync({
        taskId: String(taskId),
        groupId: Number(groupId),
        request: { status: String(nextStatus) },
      });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="student-dashboard">
        <div className="student-header">
          <div>
            <h1 className="page-title">My Work</h1>
            <p className="page-subtitle">
              Track your tasks, progress, and contribution statistics.
            </p>
          </div>
        </div>

        <StudentWorkspaceTabs activeTab="my-work" />

        <div className="tab-row student-status-tabs">
          <button
            className={`tab ${statusFilter === "" ? "tab-active" : ""}`}
            onClick={() => {
              setStatusFilter("");
              setPage(0);
            }}
          >
            All ({totalElements})
          </button>
          <button
            className={`tab ${statusFilter === "TODO" ? "tab-active" : ""}`}
            onClick={() => {
              setStatusFilter("TODO");
              setPage(0);
            }}
          >
            To Do
          </button>
          <button
            className={`tab ${statusFilter === "IN_PROGRESS" ? "tab-active" : ""}`}
            onClick={() => {
              setStatusFilter("IN_PROGRESS");
              setPage(0);
            }}
          >
            In Design
          </button>
          <button
            className={`tab ${statusFilter === "DONE" ? "tab-active" : ""}`}
            onClick={() => {
              setStatusFilter("DONE");
              setPage(0);
            }}
          >
            Approved
          </button>
        </div>

        <div className="student-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>My Tasks</h3>
              {primaryGroup && (
                <span className="text-muted-sm">
                  Group: {primaryGroup.groupName}
                </span>
              )}
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="table-empty-cell">
                      Loading...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-empty-cell text-muted">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.taskId}>
                      <td>
                        <div>
                          <a
                            href={task.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="lecturer-link lecturer-link-strong"
                          >
                            {task.key}
                          </a>
                          <div className="student-task-title">
                            {task.title}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`student-source-badge ${task.source === "JIRA" ? "jira" : "github"}`}>
                          {task.source}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span className={`status-pill ${getStatusClass(task.status)}`}>
                            {getStatusLabel(task.status)}
                          </span>
                          {canUpdateStatus(task) && (
                            <select
                              className="reports-select"
                              aria-label={`Update status ${task.key}`}
                              value={String(task.status || "").toUpperCase()}
                              disabled={statusUpdatingId === task.taskId || updateTaskStatus.isPending}
                              onChange={(e) => updateStatus(task.taskId, e.target.value)}
                            >
                              {statusOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {getStatusLabel(opt)}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="student-cell-sm">{task.priority || "-"}</td>
                      <td className="text-muted-sm">
                        {task.updatedAt
                          ? new Date(task.updatedAt).toLocaleDateString("en-US")
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="student-pagination">
                <button
                  className="action-button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </button>
                <span className="student-page-indicator">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  className="action-button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>My Statistics</h3>
            </div>
            <div className="student-stats">
              <div className="stat-row">
                <span>Total Tasks</span>
                <span className="stat-number">{contribution.taskCount}</span>
              </div>
              <div className="stat-row">
                <span>Completed Tasks</span>
                <span className="stat-number">{contribution.completedTaskCount}</span>
              </div>
              <div className="stat-row">
                <span>GitHub Commits</span>
                <span className="stat-number">{contribution.githubCommitCount}</span>
              </div>
              <div className="stat-row">
                <span>Pull Requests</span>
                <span className="stat-number">{contribution.githubPrCount}</span>
              </div>

              <div className="contribution-summary">
                <h4>Contribution Summary</h4>
                <div className="summary-score">
                  <div className="score-circle">
                    {scoreDisplay}
                  </div>
                  <div className="score-meta">
                    <span className="score-label">Score</span>
                    <span className="score-text">
                      {contribution.contributionScore > 0
                        ? getScoreLabel(contribution.contributionScore)
                        : "No data"}
                    </span>
                  </div>
                </div>

                {contribution.recentHighlights?.length > 0 && (
                  <div className="student-highlights-wrap">
                    <h5 className="student-highlights-title">
                      Recent Highlights
                    </h5>
                    <ul className="student-highlights-list">
                      {contribution.recentHighlights.slice(0, 5).map((highlight, idx) => (
                        <li key={idx} className="student-highlights-item">
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="summary-bars">
                  <div className="summary-bar-row">
                    <span>Tasks</span>
                    <div className="summary-bar">
                      <div
                        className="summary-bar-fill commits"
                        style={{
                          width: `${
                            contribution.taskCount > 0
                              ? Math.min(
                                  100,
                                  (contribution.completedTaskCount / contribution.taskCount) * 100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="summary-bar-row">
                    <span>Commits</span>
                    <div className="summary-bar">
                      <div
                        className="summary-bar-fill issues"
                        style={{
                          width: `${Math.min(100, contribution.githubCommitCount * 2)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="summary-bar-row">
                    <span>PRs</span>
                    <div className="summary-bar">
                      <div
                        className="summary-bar-fill reviews"
                        style={{
                          width: `${Math.min(100, contribution.githubPrCount * 10)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
