import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import {
  useLeaderGroupProgress,
  useLeaderCommitSummary,
  useMemberTaskStats,
  useMemberCommitStats,
} from "../../hooks/useReport";
import { useProfile } from "../../hooks/useAuth";
import { useUserGroups } from "../../hooks/useUserGroups";
import { getAccessTokenUserId } from "../../utils/authToken";

export default function StudentStats() {
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Get current user profile to get userId
  const { data: profile, isLoading: profileLoading } = useProfile();
  const userId = getAccessTokenUserId() || profile?.id || 0;

  // Fetch student's group memberships using userId
  const { data: membershipsData, isLoading: membershipsLoading } = useUserGroups(userId);

  const memberships = membershipsData?.groups || [];

  // Use selected group or first group
  const groupId = selectedGroupId ? Number(selectedGroupId) : (memberships[0]?.groupId || 0);
  const selectedMembership = selectedGroupId
    ? memberships.find((item) => item.groupId === Number(selectedGroupId))
    : memberships[0];
  const selectedGroupRole = selectedMembership?.role || "MEMBER";
  const isLeader = selectedGroupRole === "LEADER";

  // Build optional date query
  const dateQuery = useMemo(() => {
    const q = {};
    if (dateRange.from) q.from = dateRange.from;
    if (dateRange.to) q.to = dateRange.to;
    return q;
  }, [dateRange.from, dateRange.to]);

  const { data: leaderProgress, isLoading: leaderProgressLoading } = useLeaderGroupProgress(
    isLeader ? groupId : 0,
    dateQuery
  );
  const { data: leaderCommitSummary, isLoading: leaderCommitLoading } = useLeaderCommitSummary(
    isLeader ? groupId : 0,
    dateQuery
  );

  const { data: memberTaskStats, isLoading: memberTaskStatsLoading } = useMemberTaskStats(
    isLeader ? 0 : groupId
  );
  const { data: memberCommitStats, isLoading: memberCommitStatsLoading } = useMemberCommitStats(
    isLeader ? 0 : groupId,
    dateQuery
  );

  const stats = memberCommitStats || {
    commitCount: 0,
    prCount: 0,
    mergedPrCount: 0,
    reviewCount: 0,
    activeDays: 0,
    lastCommitAt: null,
  };

  const contrib = memberTaskStats || {
    totalAssigned: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    completionRate: 0,
  };

  const isLoading =
    profileLoading ||
    membershipsLoading ||
    leaderProgressLoading ||
    leaderCommitLoading ||
    memberTaskStatsLoading ||
    memberCommitStatsLoading;

  return (
    <DashboardLayout>
      <div className="student-dashboard">
        <div className="student-header">
          <div>
            <h1 className="page-title">{isLeader ? "Team Stats" : "My Stats"}</h1>
            <p className="page-subtitle">
              {isLeader
                ? "View team progress reports and commit summaries for your group."
                : "Track your personal task and GitHub contribution statistics."}
            </p>
          </div>
        </div>

        <div className="tab-row">
          <Link className="tab" to="/app/student/team-board">
            Team Board
          </Link>
          <Link className="tab" to="/app/student/my-work">
            My Work
          </Link>
          <Link className="tab tab-active" to="/app/student/stats">
            My Stats
          </Link>
        </div>

        {/* Filters */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h3>Filters</h3>
            {memberships.length > 0 && (
              <span className={`status-pill ${selectedGroupRole === "LEADER" ? "status-active" : "status-pending"}`}>
                Role in selected group: {selectedGroupRole}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "8px 0" }}>
            <label className="modal-field" style={{ margin: 0 }}>
              <span>Group</span>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                {memberships.map((m) => (
                  <option key={m.groupId} value={m.groupId}>
                    {m.groupName} ({m.semesterCode})
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field" style={{ margin: 0 }}>
              <span>From Date</span>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              />
            </label>
            <label className="modal-field" style={{ margin: 0 }}>
              <span>To Date</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              />
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="panel" style={{ marginTop: 16, padding: 32, textAlign: "center" }}>
            Loading statistics...
          </div>
        ) : (
          <>
            {/* Role-based stats */}
            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panel-header">
                <h3>{isLeader ? "Team Progress" : "GitHub Statistics"}</h3>
                {!isLeader && stats.lastCommitAt && (
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    Last commit: {new Date(stats.lastCommitAt).toLocaleDateString("en-US")}
                  </span>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, padding: "16px 0" }}>
                {isLeader ? (
                  <>
                    <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
                      <div className="stat-value" style={{ color: "#f59e0b" }}>{leaderProgress?.todoCount ?? 0}</div>
                      <div className="stat-label">To Do</div>
                    </div>
                    <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
                      <div className="stat-value" style={{ color: "#3b82f6" }}>{leaderProgress?.inProgressCount ?? 0}</div>
                      <div className="stat-label">In Progress</div>
                    </div>
                    <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
                      <div className="stat-value" style={{ color: "#10b981" }}>{leaderProgress?.doneCount ?? 0}</div>
                      <div className="stat-label">Done</div>
                    </div>
                    <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
                      <div className="stat-value" style={{ color: "#374151" }}>
                        {Math.round((leaderProgress?.completionRate ?? 0) * 100)}%
                      </div>
                      <div className="stat-label">Completion</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
                      <div className="stat-value" style={{ color: "#059669" }}>
                        {stats.commitCount}
                      </div>
                      <div className="stat-label">Commits</div>
                    </div>
                    <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
                      <div className="stat-value" style={{ color: "#7c3aed" }}>
                        {stats.prCount}
                      </div>
                      <div className="stat-label">Pull Requests</div>
                    </div>
                    <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
                      <div className="stat-value" style={{ color: "#0066cc" }}>
                        {stats.mergedPrCount}
                      </div>
                      <div className="stat-label">Merged PRs</div>
                    </div>
                    <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
                      <div className="stat-value" style={{ color: "#d97706" }}>
                        {stats.reviewCount}
                      </div>
                      <div className="stat-label">Reviews</div>
                    </div>
                    <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
                      <div className="stat-value" style={{ color: "#374151" }}>
                        {stats.activeDays}
                      </div>
                      <div className="stat-label">Active Days</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Contribution Summary */}
            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panel-header">
                <h3>{isLeader ? "Team Commit Summary" : "Task Summary"}</h3>
              </div>
              <div className="student-stats">
                {isLeader ? (
                  <>
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
                      <span className="stat-number">{contrib.totalAssigned}</span>
                    </div>
                    <div className="stat-row">
                      <span>Completed</span>
                      <span className="stat-number">{contrib.completed}</span>
                    </div>
                    <div className="stat-row">
                      <span>In Progress</span>
                      <span className="stat-number">{contrib.inProgress}</span>
                    </div>
                    <div className="stat-row">
                      <span>TODO</span>
                      <span className="stat-number">{contrib.todo}</span>
                    </div>
                    <div className="stat-row">
                      <span>Completion Rate</span>
                      <span className="stat-number">
                        {Math.round((contrib.completionRate ?? 0) * 100)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
