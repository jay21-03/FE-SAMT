import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import {
  useLeaderGroupTasks,
  useMemberTasks,
  useUpdateLeaderTaskStatus,
  useUpdateMemberTaskStatus,
  useAssignLeaderTask,
  useLeaderGroupProgress,
  useLeaderCommitSummary,
  useMemberTaskStats,
  useMemberCommitStats,
} from "../../hooks/useReport";
import { useProfile } from "../../hooks/useAuth";
import { useGroup, useGroupMembers, useUserGroups } from "../../hooks/useUserGroups";
import { getAccessTokenUserId } from "../../utils/authToken";

export default function StudentDashboard() {
  const location = useLocation();
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [assigneeDrafts, setAssigneeDrafts] = useState({});
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Get current user profile to get userId
  const { data: profile, isLoading: profileLoading } = useProfile();
  const userId = getAccessTokenUserId() || profile?.id || 0;

  // Fetch student's group memberships using userId
  const { data: membershipsData, isLoading: membershipsLoading } = useUserGroups(userId);
  
  const memberships = membershipsData?.groups || [];
  const groupId = selectedGroupId ? Number(selectedGroupId) : (memberships[0]?.groupId || 0);
  const selectedMembership = selectedGroupId
    ? memberships.find((item) => item.groupId === Number(selectedGroupId))
    : memberships[0];
  const selectedGroupRole = selectedMembership?.role || "MEMBER";
  const isLeader = selectedGroupRole === "LEADER";
  const isTeamBoardRoute = location.pathname === "/app/student/team-board";
  const isMyWorkRoute = location.pathname === "/app/student/my-work" || location.pathname === "/app/student/profile/me";
  const canManageTeam = isLeader && isTeamBoardRoute;
  const { data: groupDetail } = useGroup(groupId);
  const { data: membersData } = useGroupMembers(groupId);
  const groupMembers = Array.isArray(membersData) ? membersData : [];
  const groupDetailMembers = Array.isArray(groupDetail?.members) ? groupDetail.members : [];
  const assignableMembers = useMemo(() => {
    const sourceMembers = groupDetailMembers.length > 0 ? groupDetailMembers : groupMembers;
    return sourceMembers
      .map((member) => ({
        userId: member.userId,
        role: member.role ?? member.groupRole,
        displayName:
          member.fullName?.trim() ||
          member.email?.trim() ||
          (member.userId ? `User #${member.userId}` : ""),
      }))
      .filter((member) => member.userId && member.userId !== userId)
      .filter((member) => String(member.role ?? "").toUpperCase() !== "LEADER");
  }, [groupDetailMembers, groupMembers, userId]);

  // Build query for tasks
  const pagedTasksQuery = useMemo(() => {
    const q = { page, size: 10 };
    if (statusFilter) q.status = statusFilter;
    return q;
  }, [page, statusFilter]);

  const { data: leaderTasksData, isLoading: leaderTasksLoading } = useLeaderGroupTasks(
    canManageTeam ? groupId : 0,
    pagedTasksQuery
  );

  const { data: memberTasksData, isLoading: memberTasksLoading } = useMemberTasks({
    groupId: canManageTeam ? 0 : groupId,
    ...pagedTasksQuery,
  });

  const { mutateAsync: updateLeaderTaskStatusAsync, isPending: leaderStatusUpdating } = useUpdateLeaderTaskStatus();
  const { mutateAsync: updateMemberTaskStatusAsync, isPending: memberStatusUpdating } = useUpdateMemberTaskStatus();
  const { mutateAsync: assignLeaderTaskAsync, isPending: leaderAssigning } = useAssignLeaderTask();

  const { data: leaderProgressData } = useLeaderGroupProgress(canManageTeam ? groupId : 0);
  const { data: leaderCommitSummary } = useLeaderCommitSummary(canManageTeam ? groupId : 0);
  const { data: memberTaskStats } = useMemberTaskStats(canManageTeam ? 0 : groupId);
  const { data: memberCommitStats } = useMemberCommitStats(canManageTeam ? 0 : groupId);

  const activeTasksData = canManageTeam ? leaderTasksData : memberTasksData;
  const tasks = activeTasksData?.content || [];
  const totalPages = activeTasksData?.totalPages || 0;
  const totalElements = activeTasksData?.totalElements || 0;

  const isLoading = profileLoading || membershipsLoading || leaderTasksLoading || memberTasksLoading;
  const isMutating = leaderStatusUpdating || memberStatusUpdating || leaderAssigning;

  const getStatusClass = (status) => {
    if (!status) return "";
    const s = status.toLowerCase().replace(/\s+/g, "-");
    switch (s) {
      case "done":
      case "completed":
        return "status-active";
      case "in-progress":
      case "in_progress":
        return "status-pending";
      case "to-do":
      case "todo":
        return "status-invited";
      default:
        return "";
    }
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  const handleUpdateStatus = async (task) => {
    const nextStatus = statusDrafts[task.taskId] || task.status;
    if (!nextStatus || nextStatus === task.status) {
      return;
    }

    setActionError("");
    setActionSuccess("");

    try {
      if (canManageTeam) {
        await updateLeaderTaskStatusAsync({
          groupId,
          taskId: task.taskId,
          request: { status: nextStatus },
        });
      } else {
        await updateMemberTaskStatusAsync({
          groupId,
          taskId: task.taskId,
          request: { status: nextStatus },
        });
      }
      setActionSuccess("Task status updated.");
    } catch (error) {
      setActionError(error?.response?.data?.message || "Unable to update task status.");
    }
  };

  const handleAssignTask = async (task) => {
    const assigneeUserId = Number(assigneeDrafts[task.taskId]);
    if (!canManageTeam || !assigneeUserId) {
      return;
    }

    setActionError("");
    setActionSuccess("");

    try {
      await assignLeaderTaskAsync({
        groupId,
        taskId: task.taskId,
        request: { assigneeUserId },
      });
      setActionSuccess("Task assigned successfully.");
    } catch (error) {
      setActionError(error?.response?.data?.message || "Unable to assign task.");
    }
  };

  return (
    <DashboardLayout>
      <div className="student-dashboard">
        <div className="student-header">
          <div>
            <h1 className="page-title">{isTeamBoardRoute ? "Team Board" : "My Work"}</h1>
            <p className="page-subtitle">
              Manage and track tasks based on your role in each group.
            </p>
          </div>
        </div>

        <div className="tab-row">
          <Link className={`tab ${isTeamBoardRoute ? "tab-active" : ""}`} to="/app/student/team-board">
            Team Board
          </Link>
          <Link className={`tab ${isMyWorkRoute ? "tab-active" : ""}`} to="/app/student/my-work">
            My Work
          </Link>
          <Link className="tab" to="/app/student/stats">
            My Stats
          </Link>
          <Link className="tab" to="/app/groups">
            My Groups
          </Link>
          {groupId > 0 && (
            <Link className="tab" to={`/app/groups/${groupId}/config`}>
              Project Config
            </Link>
          )}
        </div>

        {isTeamBoardRoute && !isLeader && (
          <div className="alert alert-error">
            Team Board is optimized for LEADER role. You can continue in My Work for personal tasks.
          </div>
        )}

        <div className="tab-row" style={{ marginTop: 12 }}>
          <label className="modal-field" style={{ margin: 0, minWidth: 240 }}>
            <span>Group</span>
            <select
              value={selectedGroupId}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                setPage(0);
              }}
            >
              {memberships.map((item) => (
                <option key={item.groupId} value={item.groupId}>
                  {item.groupName} ({item.semesterCode}) · {item.role}
                </option>
              ))}
            </select>
          </label>
          {groupId > 0 && (
            <span className={`status-pill ${isLeader ? "status-active" : "status-pending"}`}>
              Role: {selectedGroupRole}
            </span>
          )}
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
            In Progress
          </button>
          <button
            className={`tab ${statusFilter === "DONE" ? "tab-active" : ""}`}
            onClick={() => {
              setStatusFilter("DONE");
              setPage(0);
            }}
          >
            Completed
          </button>
        </div>

        {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
        {actionError && <div className="alert alert-error">{actionError}</div>}

        <div className="student-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>{canManageTeam ? "Team Tasks" : "My Tasks"}</h3>
              {selectedMembership && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    Group: {selectedMembership.groupName}
                  </span>
                  <span className={`status-pill ${selectedGroupRole === "LEADER" ? "status-active" : "status-pending"}`}>
                    {selectedGroupRole}
                  </span>
                </div>
              )}
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Priority</th>
                  {canManageTeam && <th>Member</th>}
                  {canManageTeam && <th>Assign</th>}
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={canManageTeam ? 7 : 5} style={{ textAlign: "center", padding: 16 }}>
                      Loading...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={canManageTeam ? 7 : 5} style={{ textAlign: "center", padding: 16, color: "#6b7280" }}>
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
                            style={{ color: "#0066cc", textDecoration: "none", fontWeight: 500 }}
                          >
                            {task.key}
                          </a>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                            {task.title}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: task.source === "JIRA" ? "#e6f0ff" : "#f0f0f0",
                            color: task.source === "JIRA" ? "#0052cc" : "#24292e",
                          }}
                        >
                          {task.source}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <select
                            value={statusDrafts[task.taskId] || task.status || ""}
                            onChange={(e) =>
                              setStatusDrafts((prev) => ({ ...prev, [task.taskId]: e.target.value }))
                            }
                            disabled={isMutating}
                          >
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="DONE">DONE</option>
                          </select>
                          <button
                            className="primary-button secondary"
                            style={{ padding: "4px 10px", fontSize: 12 }}
                            onClick={() => handleUpdateStatus(task)}
                            disabled={isMutating}
                          >
                            Save
                          </button>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{task.priority || "-"}</td>
                      {canManageTeam && (
                        <td style={{ fontSize: 12, color: "#374151" }}>{task.assignee || "Unassigned"}</td>
                      )}
                      {canManageTeam && (
                        <td>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <select
                              value={assigneeDrafts[task.taskId] || ""}
                              onChange={(e) =>
                                setAssigneeDrafts((prev) => ({ ...prev, [task.taskId]: e.target.value }))
                              }
                              disabled={isMutating}
                            >
                              <option value="">Select member</option>
                              {assignableMembers.map((member) => (
                                <option key={member.userId} value={member.userId}>
                                  {member.displayName}
                                </option>
                              ))}
                            </select>
                            <button
                              className="primary-button secondary"
                              style={{ padding: "4px 10px", fontSize: 12 }}
                              onClick={() => handleAssignTask(task)}
                              disabled={isMutating || !assigneeDrafts[task.taskId]}
                            >
                              Assign
                            </button>
                          </div>
                        </td>
                      )}
                      <td style={{ fontSize: 12, color: "#6b7280" }}>
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
              <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 16 }}>
                <button
                  className="action-button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </button>
                <span style={{ padding: "8px 12px", fontSize: 13 }}>
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
              <h3>{canManageTeam ? "Team Statistics" : "My Statistics"}</h3>
            </div>
            <div className="student-stats">
              {canManageTeam ? (
                <>
                  <div className="stat-row">
                    <span>To Do</span>
                    <span className="stat-number">{leaderProgressData?.todoCount ?? 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>In Progress</span>
                    <span className="stat-number">{leaderProgressData?.inProgressCount ?? 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Done</span>
                    <span className="stat-number">{leaderProgressData?.doneCount ?? 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Completion Rate</span>
                    <span className="stat-number">
                      {Math.round((leaderProgressData?.completionRate ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="stat-row">
                    <span>Total Team Commits</span>
                    <span className="stat-number">{leaderCommitSummary?.totalCommits ?? 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Total Team PRs</span>
                    <span className="stat-number">{leaderCommitSummary?.totalPullRequests ?? 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Active Contributors</span>
                    <span className="stat-number">{leaderCommitSummary?.activeContributors ?? 0}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="stat-row">
                    <span>Total Assigned</span>
                    <span className="stat-number">{memberTaskStats?.totalAssigned ?? 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Completed</span>
                    <span className="stat-number">{memberTaskStats?.completed ?? 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>In Progress</span>
                    <span className="stat-number">{memberTaskStats?.inProgress ?? 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>TODO</span>
                    <span className="stat-number">{memberTaskStats?.todo ?? 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Completion Rate</span>
                    <span className="stat-number">
                      {Math.round((memberTaskStats?.completionRate ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="stat-row">
                    <span>Commits</span>
                    <span className="stat-number">{memberCommitStats?.commitCount ?? 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Pull Requests</span>
                    <span className="stat-number">{memberCommitStats?.prCount ?? 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Active Days</span>
                    <span className="stat-number">{memberCommitStats?.activeDays ?? 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
