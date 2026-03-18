import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import { useLecturerOverview, useGroupProgress, useRecentActivities } from "../../hooks/useReport";
import { useProfile } from "../../hooks/useAuth";
import { useSemesters, useUserGroups } from "../../hooks/useUserGroups";

export default function LecturerDashboard() {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const { data: profile, isLoading: profileLoading } = useProfile();

  // Fetch semesters for filter
  const { data: semestersData } = useSemesters();
  const semesters = Array.isArray(semestersData) ? semestersData : [];

  // Fetch lecturer overview - only when profile is loaded
  const { data: overview, isLoading: overviewLoading } = useLecturerOverview(
    selectedSemester ? { semesterId: Number(selectedSemester) } : undefined
  );

  // Fetch own groups for the lecturer
  const { data: membershipsData, isLoading: groupsLoading } = useUserGroups(Number(profile?.id || 0));
  const groups = useMemo(() => {
    const memberships = membershipsData?.groups || [];
    const semesterId = selectedSemester ? Number(selectedSemester) : undefined;
    const filtered = semesterId
      ? memberships.filter((group) => group.semesterId === semesterId)
      : memberships;

    return filtered.map((group) => ({
      id: group.groupId,
      groupName: group.groupName,
    }));
  }, [membershipsData, selectedSemester]);

  // Select first group if none selected
  const activeGroupId = selectedGroupId ?? groups[0]?.id ?? null;

  // Fetch group progress for selected group - only if activeGroupId is valid
  const { data: progress, isLoading: progressLoading } = useGroupProgress(activeGroupId || 0);

  // Fetch recent activities for selected group - only if activeGroupId is valid
  const { data: activitiesData, isLoading: activitiesLoading } = useRecentActivities(
    activeGroupId || 0,
    { page: 0, size: 10 }
  );

  const activities = activitiesData?.content || [];

  const isLoading = profileLoading || overviewLoading || groupsLoading;

  const getCompletionPercent = () => {
    if (!progress) return { todo: 0, inProgress: 0, done: 0 };
    const total = progress.todoCount + progress.inProgressCount + progress.doneCount;
    if (total === 0) return { todo: 0, inProgress: 0, done: 0 };
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
              className="lecturer-semester-select"
            >
              <option value="">All Semesters</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.semesterCode} {s.isActive && "(Active)"}
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
        </div>

        {/* Overview Stats */}
        {overview && (
          <div className="lecturer-overview-grid">
            <div className="stat-card lecturer-overview-card">
              <div className="stat-value">{overview.groupCount}</div>
              <div className="stat-label">Groups</div>
            </div>
            <div className="stat-card lecturer-overview-card">
              <div className="stat-value">{overview.studentCount}</div>
              <div className="stat-label">Students</div>
            </div>
            <div className="stat-card lecturer-overview-card">
              <div className="stat-value">{overview.taskCount}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
            <div className="stat-card lecturer-overview-card">
              <div className="stat-value lecturer-stat-completed">
                {overview.completedTaskCount}
              </div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card lecturer-overview-card">
              <div className="stat-value lecturer-stat-commit">
                {overview.githubCommitCount}
              </div>
              <div className="stat-label">Commits</div>
            </div>
            <div className="stat-card lecturer-overview-card">
              <div className="stat-value lecturer-stat-pr">
                {overview.githubPrCount}
              </div>
              <div className="stat-label">PRs</div>
            </div>
          </div>
        )}

        {/* Groups List */}
        <div className="panel panel-mt-16">
          <div className="panel-header">
            <h3>Groups ({groups.length})</h3>
          </div>
          {isLoading ? (
            <div className="lecturer-loading">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="lecturer-loading">
              No groups found for this semester.
            </div>
          ) : (
            <div className="lecturer-groups-row">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`action-button lecturer-group-chip ${activeGroupId === group.id ? "active" : ""}`}
                >
                  {group.groupName}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeGroupId && (
          <div className="lecturer-main-grid panel-mt-16">
            <div className="panel">
              <div className="panel-header">
                <h3>Progress Overview</h3>
                <button
                  className="action-button compact-button"
                  onClick={() => navigate(`/app/groups/${activeGroupId}`)}
                >
                  View Group
                </button>
              </div>

              {progressLoading ? (
                <div className="lecturer-loading">Loading...</div>
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
                        <span className="text-muted-sm">
                        {Math.round(progress.completionRate * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                  <div className="lecturer-loading">
                  No progress data available.
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Recent Activity</h3>
              </div>
              {activitiesLoading ? (
                <div className="lecturer-loading">Loading...</div>
              ) : (
                <ul className="activity-list">
                  {activities.length === 0 ? (
                    <li className="activity-item">
                      <div className="activity-main text-muted">
                        No recent activities.
                      </div>
                    </li>
                  ) : (
                    activities.map((a, index) => (
                      <li
                        key={`${a.activityId ?? a.id ?? index}-${a.occurredAt ?? "na"}`}
                        className="activity-item"
                      >
                        <div className="activity-main">
                          <span
                            className={`lecturer-activity-source ${a.source === "JIRA" ? "jira" : "github"}`}
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
