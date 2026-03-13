import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import { useStudentGithubStats, useStudentContribution } from "../../hooks/useReport";
import { useProfile } from "../../hooks/useAuth";
import { useUserGroups } from "../../hooks/useUserGroups";

export default function StudentStats() {
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Get current user profile to get userId
  const { data: profile, isLoading: profileLoading } = useProfile();
  const userId = profile?.id || 0;

  // Fetch student's group memberships using userId
  const { data: membershipsData, isLoading: membershipsLoading } = useUserGroups(userId);

  const memberships = membershipsData?.groups || [];

  // Use selected group or first group
  const groupId = selectedGroupId ? Number(selectedGroupId) : memberships[0]?.groupId || 0;

  // Build query for GitHub stats
  const githubQuery = useMemo(() => {
    const q = { groupId };
    if (dateRange.from) q.from = dateRange.from;
    if (dateRange.to) q.to = dateRange.to;
    return q;
  }, [groupId, dateRange.from, dateRange.to]);

  // Fetch GitHub stats
  const { data: githubStats, isLoading: githubLoading } = useStudentGithubStats(githubQuery);

  // Fetch contribution summary
  const { data: contribution, isLoading: contributionLoading } = useStudentContribution({
    groupId,
  });

  const stats = githubStats || {
    commitCount: 0,
    prCount: 0,
    mergedPrCount: 0,
    reviewCount: 0,
    activeDays: 0,
    lastCommitAt: null,
  };

  const contrib = contribution || {
    taskCount: 0,
    completedTaskCount: 0,
    githubCommitCount: 0,
    githubPrCount: 0,
    contributionScore: 0,
    recentHighlights: [],
  };

  const isLoading = profileLoading || membershipsLoading || githubLoading || contributionLoading;

  return (
    <DashboardLayout>
      <div className="student-dashboard">
        <div className="student-header">
          <div>
            <h1 className="page-title">My Stats</h1>
            <p className="page-subtitle">
              Track your GitHub contributions and project statistics.
            </p>
          </div>
        </div>

        <div className="tab-row">
          <Link className="tab" to="/app/student/profile/me">
            My Tasks
          </Link>
          <Link className="tab tab-active" to="/app/student/stats">
            My Stats
          </Link>
        </div>

        {/* Filters */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h3>Filters</h3>
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
            {/* GitHub Stats */}
            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panel-header">
                <h3>GitHub Statistics</h3>
                {stats.lastCommitAt && (
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    Last commit: {new Date(stats.lastCommitAt).toLocaleDateString("en-US")}
                  </span>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, padding: "16px 0" }}>
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
              </div>
            </div>

            {/* Contribution Summary */}
            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panel-header">
                <h3>Contribution Summary</h3>
              </div>
              <div className="student-stats">
                <div className="stat-row">
                  <span>Total Tasks</span>
                  <span className="stat-number">{contrib.taskCount}</span>
                </div>
                <div className="stat-row">
                  <span>Completed Tasks</span>
                  <span className="stat-number">{contrib.completedTaskCount}</span>
                </div>
                <div className="stat-row">
                  <span>Completion Rate</span>
                  <span className="stat-number">
                    {contrib.taskCount > 0
                      ? Math.round((contrib.completedTaskCount / contrib.taskCount) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="stat-row">
                  <span>Contribution Score</span>
                  <span className="stat-number" style={{ color: "#059669", fontWeight: 600 }}>
                    {contrib.contributionScore}
                  </span>
                </div>
              </div>

              {contrib.recentHighlights?.length > 0 && (
                <div style={{ marginTop: 16, padding: "12px 0", borderTop: "1px solid #e5e7eb" }}>
                  <h4 style={{ fontSize: 14, marginBottom: 12, color: "#374151" }}>
                    Recent Highlights
                  </h4>
                  <ul style={{ fontSize: 13, color: "#6b7280", paddingLeft: 20 }}>
                    {contrib.recentHighlights.map((highlight, idx) => (
                      <li key={idx} style={{ marginBottom: 6 }}>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
