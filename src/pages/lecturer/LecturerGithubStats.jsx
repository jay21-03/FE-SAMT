import { Link } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";

export default function LecturerGithubStats() {
  return (
    <DashboardLayout>
      <div className="lecturer-dashboard">
        <div className="lecturer-header">
          <div>
            <h1 className="page-title">GitHub Stats</h1>
            <p className="page-subtitle">
              Theo dõi commit, pull request và issues của các nhóm trên GitHub.
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

        <div className="admin-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Commits by Group</h3>
            </div>
            <div className="progress-overview">
              <div className="progress-bars-grid">
                <div className="progress-metric">
                  <div className="metric-label">No data</div>
                  <div className="metric-bar">
                    <div className="metric-bar-fill metric-commits" style={{ width: "0%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Issues & Pull Requests</h3>
            </div>
            <div className="student-stats">
              <div className="stat-row">
                <span>Open Issues</span>
                <span className="stat-number">0</span>
              </div>
              <div className="stat-row">
                <span>Closed Issues</span>
                <span className="stat-number">0</span>
              </div>
              <div className="stat-row">
                <span>Open PRs</span>
                <span className="stat-number">0</span>
              </div>
              <div className="stat-row">
                <span>Merged PRs</span>
                <span className="stat-number">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

