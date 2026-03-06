import { Link } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

export default function StudentStats() {
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
            <h1 className="page-title">My Stats</h1>
            <p className="page-subtitle">
              Thống kê đóng góp của bạn trên GitHub cho các dự án học phần.
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

        <div className="panel" style={{ marginTop: 16 }}>
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

