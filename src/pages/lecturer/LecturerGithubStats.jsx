import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import { useLecturerOverview, useRecentActivities } from "../../hooks/useReport";
import { useGroups, useSemesters } from "../../hooks/useUserGroups";

export default function LecturerGithubStats() {
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

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
  });
  const groups = groupsData?.content || [];

  // Auto-select first group when groups load
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(String(groups[0].id));
    }
  }, [groups, selectedGroupId]);

  // Get active group
  const activeGroupId = selectedGroupId ? Number(selectedGroupId) : (groups[0]?.id || 0);

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
          <Link className="tab" to="/app/lecturer/grading">
            Grading
          </Link>
        </div>

        {/* Filters */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h3>Filters</h3>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "12px 0" }}>
            <label className="modal-field" style={{ margin: 0, minWidth: 150 }}>
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
            <label className="modal-field" style={{ margin: 0, minWidth: 200 }}>
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
          </div>
        </div>

        {/* Overview Stats */}
        {overview && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginTop: 16 }}>
            <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
              <div className="stat-value" style={{ color: "#059669" }}>
                {overview.githubCommitCount}
              </div>
              <div className="stat-label">Total Commits</div>
            </div>
            <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
              <div className="stat-value" style={{ color: "#7c3aed" }}>
                {overview.githubPrCount}
              </div>
              <div className="stat-label">Pull Requests</div>
            </div>
            <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
              <div className="stat-value">{overview.groupCount}</div>
              <div className="stat-label">Groups</div>
            </div>
            <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
              <div className="stat-value">{overview.studentCount}</div>
              <div className="stat-label">Students</div>
            </div>
          </div>
        )}

        <div className="admin-main-grid" style={{ marginTop: 16 }}>
          {/* Recent Activity for selected group */}
          <div className="panel">
            <div className="panel-header">
              <h3>Recent GitHub Activity</h3>
              {activeGroupId > 0 && (
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                  {groups.find((g) => g.id === activeGroupId)?.groupName || ""}
                </span>
              )}
            </div>
            {activitiesLoading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
                Loading...
              </div>
            ) : activities.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
                No GitHub activities found. Make sure data is synced.
              </div>
            ) : (
              <ul className="activity-list" style={{ maxHeight: 400, overflowY: "auto" }}>
                {activities.map((a) => (
                  <li key={a.activityId} className="activity-item">
                    <div className="activity-main">
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 4,
                          marginRight: 8,
                          background:
                            a.type?.toLowerCase() === "commit"
                              ? "#f0fdf4"
                              : "#faf5ff",
                          color:
                            a.type?.toLowerCase() === "commit"
                              ? "#059669"
                              : "#7c3aed",
                        }}
                      >
                        {a.type}
                      </span>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#0066cc", textDecoration: "none" }}
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
              <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
                No contributor data available.
              </div>
            ) : (
              <div className="student-stats">
                {githubStats.topContributors.map(([author, count], idx) => (
                  <div key={author} className="stat-row">
                    <span>
                      <span
                        style={{
                          display: "inline-block",
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: idx === 0 ? "#fbbf24" : idx === 1 ? "#9ca3af" : idx === 2 ? "#d97706" : "#e5e7eb",
                          color: idx < 3 ? "white" : "#374151",
                          textAlign: "center",
                          lineHeight: "20px",
                          fontSize: 11,
                          marginRight: 8,
                        }}
                      >
                        {idx + 1}
                      </span>
                      {author}
                    </span>
                    <span className="stat-number">{count}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 24, padding: "16px 0", borderTop: "1px solid #e5e7eb" }}>
              <h4 style={{ fontSize: 14, marginBottom: 12, color: "#374151" }}>
                Activity Summary (Selected Group)
              </h4>
              <div className="student-stats">
                <div className="stat-row">
                  <span>Recent Commits</span>
                  <span className="stat-number" style={{ color: "#059669" }}>
                    {githubStats.commitCount}
                  </span>
                </div>
                <div className="stat-row">
                  <span>Recent PRs</span>
                  <span className="stat-number" style={{ color: "#7c3aed" }}>
                    {githubStats.prCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Last Sync Info */}
        {overview?.lastSyncAt && (
          <div style={{ marginTop: 16, color: "#6b7280", fontSize: 12, textAlign: "right" }}>
            Last synced: {new Date(overview.lastSyncAt).toLocaleString("en-US")}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
