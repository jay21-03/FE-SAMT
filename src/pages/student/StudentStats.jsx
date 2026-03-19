import { useState, useMemo } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import { useStudentGithubStats, useStudentContribution } from "../../hooks/useReport";
import { useProfile } from "../../hooks/useAuth";
import { useUserGroups } from "../../hooks/useUserGroups";
import StudentWorkspaceTabs from "../../components/StudentWorkspaceTabs";

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
  const groupId = selectedGroupId ? Number(selectedGroupId) : (memberships[0]?.groupId || 0);

  // Build query for GitHub stats
  const githubQuery = useMemo(() => {
    const q = { groupId };
    if (dateRange.from) q.from = dateRange.from;
    if (dateRange.to) q.to = dateRange.to;
    return q;
  }, [groupId, dateRange.from, dateRange.to]);

  // Fetch GitHub stats - only if groupId is valid
  const { data: githubStats, isLoading: githubLoading } = useStudentGithubStats(githubQuery);

  // Fetch contribution summary - only if groupId is valid
  // Keep contribution summary consistent with current date filters (if backend supports from/to).
  const { data: contribution, isLoading: contributionLoading } = useStudentContribution(githubQuery);

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

        <StudentWorkspaceTabs activeTab="my-stats" />

        {/* Filters */}
        <div className="panel student-stats-panel-top">
          <div className="panel-header">
            <h3>Filters</h3>
          </div>
          <div className="student-stats-filters-row">
            <label className="modal-field student-stats-field-reset">
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
            <label className="modal-field student-stats-field-reset">
              <span>From Date</span>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              />
            </label>
            <label className="modal-field student-stats-field-reset">
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
          <div className="panel student-stats-loading">
            Loading statistics...
          </div>
        ) : (
          <>
            {/* GitHub Stats */}
            <div className="panel student-stats-panel-top">
              <div className="panel-header">
                <h3>GitHub Statistics</h3>
                {stats.lastCommitAt && (
                  <span className="student-stats-last-commit">
                    Last commit: {new Date(stats.lastCommitAt).toLocaleDateString("en-US")}
                  </span>
                )}
              </div>
              <div className="student-stats-cards-grid">
                <div className="stat-card student-stats-card">
                  <div className="stat-value student-stats-value-commit">
                    {stats.commitCount}
                  </div>
                  <div className="stat-label">Commits</div>
                </div>
                <div className="stat-card student-stats-card">
                  <div className="stat-value student-stats-value-pr">
                    {stats.prCount}
                  </div>
                  <div className="stat-label">Pull Requests</div>
                </div>
                <div className="stat-card student-stats-card">
                  <div className="stat-value student-stats-value-merged">
                    {stats.mergedPrCount}
                  </div>
                  <div className="stat-label">Merged PRs</div>
                </div>
                <div className="stat-card student-stats-card">
                  <div className="stat-value student-stats-value-review">
                    {stats.reviewCount}
                  </div>
                  <div className="stat-label">Reviews</div>
                </div>
                <div className="stat-card student-stats-card">
                  <div className="stat-value student-stats-value-active-day">
                    {stats.activeDays}
                  </div>
                  <div className="stat-label">Active Days</div>
                </div>
              </div>
            </div>

            {/* Contribution Summary */}
            <div className="panel student-stats-panel-top">
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
                  <span className="stat-number student-stats-score">
                    {contrib.contributionScore}
                  </span>
                </div>
              </div>

              {contrib.recentHighlights?.length > 0 && (
                <div className="student-stats-highlights">
                  <h4 className="student-stats-highlights-title">
                    Recent Highlights
                  </h4>
                  <ul className="student-stats-highlights-list">
                    {contrib.recentHighlights.map((highlight, idx) => (
                      <li key={idx} className="student-stats-highlights-item">
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
