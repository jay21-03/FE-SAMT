import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import { useAssignLeaderTask, useLeaderCommitSummary, useLeaderGroupProgress, useLeaderGroupTasks, useUpdateLeaderTaskStatus } from "../../hooks/useReport";
import { useProfile } from "../../hooks/useAuth";
import { useGroup, useUserGroups } from "../../hooks/useUserGroups";
import StudentWorkspaceTabs from "../../components/StudentWorkspaceTabs";
import { toPercentLabel } from "../../utils/metrics";
import { isStudentLeader } from "../../utils/access";

export default function StudentTeamBoard() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [assigningId, setAssigningId] = useState(null);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const userId = profile?.id || 0;

  const { data: membershipsData, isLoading: membershipsLoading } = useUserGroups(userId);
  const memberships = membershipsData?.groups || [];
  const primaryMembership = memberships[0] || null;
  const groupId = primaryMembership?.groupId || 0;
  const isLeader = isStudentLeader(membershipsData);
  const { data: groupData } = useGroup(groupId);
  const members = groupData?.members || [];

  const tasksQuery = useMemo(() => {
    const q = { page, size: 10 };
    if (statusFilter) q.status = statusFilter;
    return q;
  }, [page, statusFilter]);

  const { data: tasksData, isLoading: tasksLoading } = useLeaderGroupTasks(groupId, tasksQuery);
  const { data: progressData } = useLeaderGroupProgress(groupId, {});
  const { data: commitSummaryData } = useLeaderCommitSummary(groupId, {});
  const assignTask = useAssignLeaderTask();
  const updateLeaderStatus = useUpdateLeaderTaskStatus();

  const tasks = tasksData?.content || [];
  const totalPages = tasksData?.totalPages || 0;
  const totalElements = tasksData?.totalElements || 0;
  const isLoading = profileLoading || membershipsLoading || tasksLoading;

  if (!profileLoading && !membershipsLoading && !isLeader) {
    return <Navigate to="/app/student/my-work" replace />;
  }

  const baseStatusOptions = ["TODO", "IN_PROGRESS", "DONE"];
  const getStatusLabel = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "DONE" || s === "APPROVED") return "APPROVED";
    if (s === "IN_PROGRESS" || s === "IN_DESIGN") return "IN DESIGN";
    return s || "-";
  };
  const canUpdateStatus = (task) => String(task?.source || "").toUpperCase() === "JIRA";
  const buildStatusOptions = (currentStatus) => {
    const current = String(currentStatus || "").toUpperCase();
    const all = [current, ...baseStatusOptions].filter(Boolean);
    return Array.from(new Set(all));
  };

  const updateStatus = async (taskId, nextStatus) => {
    if (!taskId || !groupId || !nextStatus) return;
    try {
      setStatusUpdatingId(taskId);
      await updateLeaderStatus.mutateAsync({
        groupId: Number(groupId),
        taskId: String(taskId),
        request: { status: String(nextStatus) },
      });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const assignTo = async (taskId, assigneeUserId) => {
    if (!taskId || !groupId) return;
    try {
      setAssigningId(taskId);
      if (!assigneeUserId) return;
      await assignTask.mutateAsync({
        groupId: Number(groupId),
        taskId: String(taskId),
        request: { assigneeUserId: Number(assigneeUserId) },
      });
    } finally {
      setAssigningId(null);
    }
  };

  const resolveAssigneeUserId = (task) => {
    const name = String(task?.assignee || "").trim();
    if (!name) return "";
    const m = members.find((x) => String(x?.fullName || "").trim() === name);
    return m ? String(m.userId) : "";
  };

  if (!profileLoading && !membershipsLoading && (!groupId || !primaryMembership)) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel panel-center-lg">
            <h2 className="project-config-invalid-title">No Group</h2>
            <p className="project-config-invalid-text">You are not assigned to any group yet.</p>
            <Link className="primary-button" to="/app/groups">
              Back to My Groups
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profileLoading && !membershipsLoading && !isLeader) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel panel-center-lg">
            <h2 className="project-config-invalid-title">Leader Only</h2>
            <p className="project-config-invalid-text">
              Team Board is available for group leaders only. Use My Work to track your own tasks.
            </p>
            <Link className="primary-button" to="/app/student/my-work">
              Go to My Work
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="student-dashboard">
        <div className="student-header">
          <div>
            <h1 className="page-title">Team Board</h1>
            <p className="page-subtitle">Manage team tasks and track overall progress.</p>
          </div>
        </div>

        <StudentWorkspaceTabs activeTab="team-board" />

        <div className="student-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Team Tasks</h3>
              <span className="text-muted-sm">Group: {primaryMembership?.groupName}</span>
            </div>

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

            <table className="data-table student-team-table">
              <colgroup>
                <col className="student-col-task" />
                <col className="student-col-source" />
                <col className="student-col-status" />
                <col className="student-col-assignee" />
                <col className="student-col-priority" />
                <col className="student-col-updated" />
              </colgroup>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="table-empty-cell">
                      Loading...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty-cell text-muted">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.taskId}>
                      <td className="student-task-cell">
                        <a
                          href={task.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lecturer-link lecturer-link-strong"
                        >
                          {task.key}
                        </a>
                        <div className="student-task-title">{task.title}</div>
                      </td>
                      <td className="student-source-cell">
                        <span className={`student-source-badge ${task.source === "JIRA" ? "jira" : "github"}`}>
                          {task.source}
                        </span>
                      </td>
                      <td className="student-status-cell">
                        <div className="student-status-wrap">
                          <span className="status-pill">{getStatusLabel(task.status)}</span>
                          {canUpdateStatus(task) && (
                            <select
                              className="reports-select student-status-select"
                              aria-label={`Update status ${task.key}`}
                              value={String(task.status || "").toUpperCase()}
                              disabled={statusUpdatingId === task.taskId || updateLeaderStatus.isPending}
                              onChange={(e) => updateStatus(task.taskId, e.target.value)}
                            >
                              {buildStatusOptions(task.status).map((opt) => (
                                <option key={opt} value={opt}>
                                  {getStatusLabel(opt)}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="student-assignee-cell">
                        <select
                          className="reports-select student-assignee-select"
                          aria-label={`Assign ${task.key}`}
                          value={resolveAssigneeUserId(task)}
                          disabled={assigningId === task.taskId || assignTask.isPending}
                          onChange={(e) => assignTo(task.taskId, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.userId} value={m.userId}>
                              {m.fullName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="student-cell-sm">{task.priority || "-"}</td>
                      <td className="text-muted-sm">
                        {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString("en-US") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

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
              <h3>Team Snapshot</h3>
            </div>
            <div className="student-stats">
              <div className="stat-row">
                <span>Completion Rate</span>
                <span className="stat-number">
                  {toPercentLabel(progressData?.completionRate)}
                </span>
              </div>
              <div className="stat-row">
                <span>Total Commits</span>
                <span className="stat-number">{commitSummaryData?.totalCommits ?? "-"}</span>
              </div>
              <div className="stat-row">
                <span>Total PRs</span>
                <span className="stat-number">{commitSummaryData?.totalPullRequests ?? "-"}</span>
              </div>
              <div className="stat-row">
                <span>Active Contributors</span>
                <span className="stat-number">{commitSummaryData?.activeContributors ?? "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

