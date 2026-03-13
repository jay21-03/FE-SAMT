import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import { useLecturerOverview, useGroupProgress, useRecentActivities } from "../../hooks/useReport";
import { useGroups } from "../../hooks/useUserGroups";
import { useSemesters } from "../../hooks/useUserGroups";

export default function LecturerDashboard() {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Fetch semesters for filter
  const { data: semestersData } = useSemesters({ page: 0, size: 50 });
  const semesters = semestersData?.data?.content || semestersData?.content || [];

  // Fetch lecturer overview
  const { data: overview, isLoading: overviewLoading } = useLecturerOverview(
    selectedSemester ? { semesterId: Number(selectedSemester) } : undefined
  );

  // Fetch groups
  const { data: groupsData, isLoading: groupsLoading } = useGroups({
    page: 0,
    size: 50,
    semesterId: selectedSemester || undefined,
  });
  const groups = groupsData?.data?.content || groupsData?.content || [];

  // Select first group if none selected
  const activeGroupId = selectedGroupId || groups[0]?.id;

  // Fetch group progress for selected group
  const { data: progress, isLoading: progressLoading } = useGroupProgress(activeGroupId || 0);

  // Fetch recent activities for selected group
  const { data: activitiesData, isLoading: activitiesLoading } = useRecentActivities(
    activeGroupId || 0,
    { page: 0, size: 10 }
  );

  const activities = activitiesData?.content || [];

  const isLoading = overviewLoading || groupsLoading;

  const getCompletionPercent = () => {
    if (!progress) return { todo: 33, inProgress: 33, done: 34 };
    const total = progress.todoCount + progress.inProgressCount + progress.doneCount;
    if (total === 0) return { todo: 33, inProgress: 33, done: 34 };
    return {
      todo: Math.round((progress.todoCount / total) * 100),
      inProgress: Math.round((progress.inProgressCount / total) * 100),
      done: Math.round((progress.doneCount / total) * 100),
    };
  };

  const percents = getCompletionPercent();

  return (
    <DashboardLayout>
      <div className="lecturer-dashboard">
        <div className="lecturer-header">
          <div>
            <h1 className="page-title">My Groups</h1>
            <p className="page-subtitle">
              Overview of your supervised groups and student progress.
            </p>
          </div>
          <div className="lecturer-header-meta">
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedGroupId(null);
              }}
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db" }}
            >
              <option value="">All Semesters</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} {s.active && "(Active)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="tab-row">
          <Link className="tab tab-active" to="/app/lecturer/groups/list">
            My Groups
          </Link>
          <Link className="tab" to="/app/lecturer/tasks">
            Tasks
          </Link>
          <Link className="tab" to="/app/lecturer/github-stats">
            GitHub Stats
          </Link>
          <Link className="tab" to="/app/lecturer/grading">
            Grading
          </Link>
        </div>

        {/* Overview Stats */}
        {overview && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginTop: 16 }}>
            <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
              <div className="stat-value">{overview.groupCount}</div>
              <div className="stat-label">Groups</div>
            </div>
            <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
              <div className="stat-value">{overview.studentCount}</div>
              <div className="stat-label">Students</div>
            </div>
            <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
              <div className="stat-value">{overview.taskCount}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
            <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
              <div className="stat-value" style={{ color: "#059669" }}>
                {overview.completedTaskCount}
              </div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
              <div className="stat-value" style={{ color: "#7c3aed" }}>
                {overview.githubCommitCount}
              </div>
              <div className="stat-label">Commits</div>
            </div>
            <div className="stat-card" style={{ padding: 16, textAlign: "center" }}>
              <div className="stat-value" style={{ color: "#0066cc" }}>
                {overview.githubPrCount}
              </div>
              <div className="stat-label">PRs</div>
            </div>
          </div>
        )}

        {/* Groups List */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h3>Groups ({groups.length})</h3>
          </div>
          {isLoading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>Loading...</div>
          ) : groups.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
              No groups found for this semester.
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "12px 0" }}>
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`action-button ${activeGroupId === group.id ? "primary" : ""}`}
                  style={{
                    background: activeGroupId === group.id ? "#0066cc" : "#f3f4f6",
                    color: activeGroupId === group.id ? "white" : "#374151",
                    border: "none",
                  }}
                >
                  {group.groupName}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeGroupId && (
          <div className="lecturer-main-grid" style={{ marginTop: 16 }}>
            <div className="panel">
              <div className="panel-header">
                <h3>Progress Overview</h3>
                <button
                  className="action-button"
                  style={{ fontSize: 12, padding: "4px 12px" }}
                  onClick={() => navigate(`/app/groups/${activeGroupId}`)}
                >
                  View Group
                </button>
              </div>

              {progressLoading ? (
                <div style={{ padding: 32, textAlign: "center" }}>Loading...</div>
              ) : progress ? (
                <div className="progress-overview">
                  <div className="progress-pie-legend">
                    <div className="progress-pie">
                      <div
                        className="pie-segment pie-todo"
                        style={{
                          background: `conic-gradient(
                            #f59e0b 0% ${percents.todo}%,
                            #3b82f6 ${percents.todo}% ${percents.todo + percents.inProgress}%,
                            #10b981 ${percents.todo + percents.inProgress}% 100%
                          )`,
                        }}
                      />
                    </div>
                    <ul className="progress-legend">
                      <li>
                        <span className="legend-dot legend-todo" />
                        To Do &mdash; {progress.todoCount} ({percents.todo}%)
                      </li>
                      <li>
                        <span className="legend-dot legend-inprogress" />
                        In Progress &mdash; {progress.inProgressCount} ({percents.inProgress}%)
                      </li>
                      <li>
                        <span className="legend-dot legend-done" />
                        Done &mdash; {progress.doneCount} ({percents.done}%)
                      </li>
                    </ul>
                  </div>

                  <div className="progress-bars-grid">
                    <div className="progress-metric">
                      <div className="metric-label">Completion Rate</div>
                      <div className="metric-bar">
                        <div
                          className="metric-bar-fill metric-commits"
                          style={{ width: `${Math.round(progress.completionRate * 100)}%` }}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>
                        {Math.round(progress.completionRate * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
                  No progress data available.
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Recent Activity</h3>
              </div>
              {activitiesLoading ? (
                <div style={{ padding: 32, textAlign: "center" }}>Loading...</div>
              ) : (
                <ul className="activity-list">
                  {activities.length === 0 ? (
                    <li className="activity-item">
                      <div className="activity-main" style={{ color: "#6b7280" }}>
                        No recent activities.
                      </div>
                    </li>
                  ) : (
                    activities.map((a) => (
                      <li key={a.activityId} className="activity-item">
                        <div className="activity-main">
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 4,
                              marginRight: 8,
                              background: a.source === "JIRA" ? "#e6f0ff" : "#f0f0f0",
                              color: a.source === "JIRA" ? "#0052cc" : "#24292e",
                            }}
                          >
                            {a.source}
                          </span>
                          {a.title}
                        </div>
                        <div className="activity-meta">
                          {a.author} · {a.type}
                        </div>
                        <div className="activity-time">
                          {a.occurredAt
                            ? new Date(a.occurredAt).toLocaleString("en-US", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "-"}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
