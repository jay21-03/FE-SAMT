import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import { useLecturerOverview, useRecentActivities } from "../../hooks/useReport";
import { useProfile } from "../../hooks/useAuth";
import { useGroups, useSemesters } from "../../hooks/useUserGroups";

export default function LecturerGithubStats() {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const { data: profile } = useProfile();

  // Fetch semesters
  const { data: semestersData } = useSemesters();
  const semesters = Array.isArray(semestersData) ? semestersData : [];

  // Fetch lecturer overview for global stats
  const { data: overview } = useLecturerOverview(
    selectedSemester ? { semesterId: Number(selectedSemester) } : undefined
  );

  // Fetch groups
  const { data: groupsData } = useGroups({
    page: 0,
    size: 100,
    semesterId: selectedSemester ? Number(selectedSemester) : undefined,
    lecturerId: profile?.id,
  }, { enabled: !!profile?.id });
  const groups = groupsData?.content || [];
  const hasSelectedGroup = selectedGroupId && groups.some((g) => g.id === Number(selectedGroupId));

  // Get active group
  const activeGroupId = hasSelectedGroup ? Number(selectedGroupId) : (groups[0]?.id || 0);

  // Fetch recent GitHub activities for selected group - only if activeGroupId is valid
  const { data: activitiesData, isLoading: activitiesLoading } = useRecentActivities(
    activeGroupId,
    { source: "GITHUB", page: 0, size: 20 }
  );

  const activities = useMemo(() => activitiesData?.content || [], [activitiesData]);

  // Analyze GitHub activities
  const githubStats = useMemo(() => {
    const commits = activities.filter((a) => a.type?.toLowerCase() === "commit");
    const prs = activities.filter(
      (a) => a.type?.toLowerCase() === "pull_request" || a.type?.toLowerCase() === "pr"
    );

    // Count by author
    const authorCounts = {};
    activities.forEach((a) => {
      if (a.author) {
        authorCounts[a.author] = (authorCounts[a.author] ?? 0) + 1;
      }
    });

    const topContributors = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      commitCount: commits.length,
      prCount: prs.length,
      topContributors,
    };
  }, [activities]);

  const getActivityTypeClass = (type) => {
    const normalized = type?.toLowerCase();
    if (normalized === "commit") return "commit";
    return "pr";
  };

  const getRankClass = (idx) => {
    if (idx === 0) return "rank-1";
    if (idx === 1) return "rank-2";
    if (idx === 2) return "rank-3";
    return "rank-default";
  };

  return (
    <DashboardLayout>
      <div className="lecturer-dashboard">
        <div className="lecturer-header">
          <div>
            <h1 className="page-title">GitHub Stats</h1>
            <p className="page-subtitle">
              Track commits, pull requests and contributor activities from your groups.
            </p>
          </div>
        </div>

        <div className="tab-row">
          <Link className="tab" to="/app/lecturer/groups/list">
            My Groups
          </Link>
          <Link className="tab" to="/app/lecturer/tasks">
            Tasks
          </Link>
          <Link className="tab tab-active" to="/app/lecturer/github-stats">
            GitHub Stats
          </Link>
        </div>

        {/* Filters */}
        <div className="panel panel-mt-16">
          <div className="panel-header">
            <h3>Filters</h3>
          </div>
          <div className="lecturer-filters-row">
            <label className="modal-field lecturer-filter-semester">
              <span>Semester</span>
              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setSelectedGroupId("");
                }}
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.semesterCode} {s.isActive && "(Active)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field lecturer-filter-group">
              <span>Group</span>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="">All Groups</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.groupName}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button secondary"
              onClick={() => activeGroupId > 0 && navigate(`/app/groups/${activeGroupId}`)}
              disabled={activeGroupId <= 0}
              style={{ alignSelf: "flex-end" }}
            >
              View Group
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        {overview && (
          <div className="lecturer-github-overview-grid">
            <div className="stat-card lecturer-overview-card">
              <div className="stat-value lecturer-stat-completed">
                {overview.githubCommitCount}
              </div>
              <div className="stat-label">Total Commits</div>
            </div>
            <div className="stat-card lecturer-overview-card">
              <div className="stat-value lecturer-stat-commit">
                {overview.githubPrCount}
              </div>
              <div className="stat-label">Pull Requests</div>
            </div>
            <div className="stat-card lecturer-overview-card">
              <div className="stat-value">{overview.groupCount}</div>
              <div className="stat-label">Groups</div>
            </div>
            <div className="stat-card lecturer-overview-card">
              <div className="stat-value">{overview.studentCount}</div>
              <div className="stat-label">Students</div>
            </div>
          </div>
        )}

        <div className="admin-main-grid panel-mt-16">
          {/* Recent Activity for selected group */}
          <div className="panel">
            <div className="panel-header">
              <h3>Recent GitHub Activity</h3>
              {activeGroupId > 0 && (
                <span className="text-muted-sm">
                  {groups.find((g) => g.id === activeGroupId)?.groupName || ""}
                </span>
              )}
            </div>
            {activitiesLoading ? (
              <div className="lecturer-loading">
                Loading...
              </div>
            ) : activities.length === 0 ? (
              <div className="lecturer-loading">
                No GitHub activities found. Make sure data is synced.
              </div>
            ) : (
              <ul className="activity-list lecturer-github-activity-list">
                {activities.map((a) => (
                  <li key={a.activityId} className="activity-item">
                    <div className="activity-main">
                      <span className={`lecturer-github-type-badge ${getActivityTypeClass(a.type)}`}>
                        {a.type}
                      </span>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lecturer-link"
                      >
                        {a.title?.length > 60 ? `${a.title.substring(0, 60)}...` : a.title}
                      </a>
                    </div>
                    <div className="activity-meta">{a.author}</div>
                    <div className="activity-time">
                      {a.occurredAt
                        ? new Date(a.occurredAt).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "-"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Top Contributors */}
          <div className="panel">
            <div className="panel-header">
              <h3>Top Contributors</h3>
            </div>
            {githubStats.topContributors.length === 0 ? (
              <div className="lecturer-loading">
                No contributor data available.
              </div>
            ) : (
              <div className="student-stats">
                {githubStats.topContributors.map(([author, count], idx) => (
                  <div key={author} className="stat-row">
                    <span>
                      <span className={`lecturer-rank-badge ${getRankClass(idx)}`}>
                        {idx + 1}
                      </span>
                      {author}
                    </span>
                    <span className="stat-number">{count}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="lecturer-summary-box">
              <h4 className="lecturer-summary-title">
                Activity Summary (Selected Group)
              </h4>
              <div className="student-stats">
                <div className="stat-row">
                  <span>Recent Commits</span>
                  <span className="stat-number lecturer-stat-completed">
                    {githubStats.commitCount}
                  </span>
                </div>
                <div className="stat-row">
                  <span>Recent PRs</span>
                  <span className="stat-number lecturer-stat-commit">
                    {githubStats.prCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Last Sync Info */}
        {overview?.lastSyncAt && (
          <div className="lecturer-last-sync">
            Last synced: {new Date(overview.lastSyncAt).toLocaleString("en-US")}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
