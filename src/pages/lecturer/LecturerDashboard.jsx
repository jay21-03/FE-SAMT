import { Link } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";

export default function LecturerDashboard() {
  const group = {
    name: "Group: Team Alpha",
    code: "CSE Capstone 2026",
    members: 5,
  };

  const activities = [
    {
      text: "Task 'API Integration' updated",
      meta: "by John - Fix bug in module",
      time: "15 min ago",
    },
    {
      text: "Commit pushed to GitHub repository",
      meta: "Branch: feature/auth-refactor",
      time: "22 min ago",
    },
    {
      text: "New issue created in Jira",
      meta: "SAMT-152 Improve progress chart",
      time: "35 min ago",
    },
  ];

  return (
    <DashboardLayout>
      <div className="lecturer-dashboard">
        <div className="lecturer-header">
          <div>
            <h1 className="page-title">{group.name}</h1>
            <p className="page-subtitle">{group.code}</p>
          </div>
          <div className="lecturer-header-meta">
            <span className="status-pill status-active">
              {group.members} members
            </span>
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

        <div className="lecturer-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Progress Overview</h3>
            </div>

            <div className="progress-overview">
              <div className="progress-pie-legend">
                <div className="progress-pie">
                  <div className="pie-segment pie-todo" />
                  <div className="pie-segment pie-inprogress" />
                  <div className="pie-segment pie-done" />
                </div>
                <ul className="progress-legend">
                  <li>
                    <span className="legend-dot legend-todo" />
                    To Do &mdash; 29%
                  </li>
                  <li>
                    <span className="legend-dot legend-inprogress" />
                    In Progress &mdash; 51%
                  </li>
                  <li>
                    <span className="legend-dot legend-done" />
                    Done &mdash; 20%
                  </li>
                </ul>
              </div>

              <div className="progress-bars-grid">
                <div className="progress-metric">
                  <div className="metric-label">Commits</div>
                  <div className="metric-bar">
                    <div
                      className="metric-bar-fill metric-commits"
                      style={{ width: "72%" }}
                    />
                  </div>
                </div>
                <div className="progress-metric">
                  <div className="metric-label">Issues</div>
                  <div className="metric-bar">
                    <div
                      className="metric-bar-fill metric-issues"
                      style={{ width: "48%" }}
                    />
                  </div>
                </div>
                <div className="progress-metric">
                  <div className="metric-label">Code Changes</div>
                  <div className="metric-bar">
                    <div
                      className="metric-bar-fill metric-code"
                      style={{ width: "64%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Recent Activity</h3>
            </div>
            <ul className="activity-list">
              {activities.map((a) => (
                <li key={a.text} className="activity-item">
                  <div className="activity-main">{a.text}</div>
                  <div className="activity-meta">{a.meta}</div>
                  <div className="activity-time">{a.time}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

