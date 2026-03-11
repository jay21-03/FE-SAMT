import { Link } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";

export default function StudentDashboard() {
  const tasks = [
    { name: "API Integration", status: "In Progress", due: "21 Jan" },
    { name: "Unit Testing", status: "To Do", due: "22 Jan" },
    { name: "Update Documentation", status: "Completed", due: "23 Jan" },
  ];

  const stats = {
    additions: 320,
    commits: 14,
    deletions: 85,
  };

  return (
    <DashboardLayout>
      <div className="student-dashboard">
        <div className="student-header">
          <div>
            <h1 className="page-title">My Tasks</h1>
            <p className="page-subtitle">
              Theo dõi nhiệm vụ, tiến độ và thống kê đóng góp của bạn.
            </p>
          </div>
        </div>

        <div className="tab-row">
          <Link className="tab tab-active" to="/app/student/profile/me">
            My Tasks
          </Link>
          <Link className="tab" to="/app/student/stats">
            My Stats
          </Link>
        </div>

        <div className="tab-row" style={{ marginTop: 12 }}>
          <button className="tab tab-active">All</button>
          <button className="tab">To Do</button>
          <button className="tab">In Progress</button>
          <button className="tab">Completed</button>
        </div>

        <div className="student-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>My Tasks</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.name}>
                    <td>{t.name}</td>
                    <td>
                      <span
                        className={`status-pill status-${t.status
                          .toLowerCase()
                          .replace(" ", "")}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td>{t.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>My Statistics</h3>
            </div>
            <div className="student-stats">
              <div className="stat-row">
                <span>Code Commits</span>
                <span className="stat-number">{stats.commits}</span>
              </div>
              <div className="stat-row">
                <span>Code Additions</span>
                <span className="stat-number">{stats.additions}</span>
              </div>
              <div className="stat-row">
                <span>Code Deletions</span>
                <span className="stat-number">{stats.deletions}</span>
              </div>

              <div className="contribution-summary">
                <h4>Contribution Summary</h4>
                <div className="summary-score">
                  <div className="score-circle">8.5</div>
                  <div className="score-meta">
                    <span className="score-label">Score</span>
                    <span className="score-text">Very Good</span>
                  </div>
                </div>
                <div className="summary-bars">
                  <div className="summary-bar-row">
                    <span>Commits</span>
                    <div className="summary-bar">
                      <div
                        className="summary-bar-fill commits"
                        style={{ width: "70%" }}
                      />
                    </div>
                  </div>
                  <div className="summary-bar-row">
                    <span>Issues</span>
                    <div className="summary-bar">
                      <div
                        className="summary-bar-fill issues"
                        style={{ width: "40%" }}
                      />
                    </div>
                  </div>
                  <div className="summary-bar-row">
                    <span>Reviews</span>
                    <div className="summary-bar">
                      <div
                        className="summary-bar-fill reviews"
                        style={{ width: "55%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

