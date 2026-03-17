import { Link } from "react-router-dom";

export default function Sidebar() {
  const role = localStorage.getItem("role");

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-mark">A</span>
          <div className="logo-text">
            <span className="logo-title">Academic Management Tool</span>
            <span className="logo-subtitle">SAMT</span>
          </div>
        </div>
      </div>

      {role === "ADMIN" && (
        <nav className="sidebar-section">
          <p className="sidebar-section-title">Admin</p>
          <div className="sidebar-nav">
            <Link className="sidebar-link" to="/app/admin/dashboard">
              <span>Dashboard</span>
            </Link>
            <Link className="sidebar-link" to="/app/admin/users">
              <span>User Management</span>
            </Link>
            <Link className="sidebar-link" to="/app/groups">
              <span>Group Management</span>
            </Link>
            <Link className="sidebar-link" to="/app/admin/semesters">
              <span>Semester Management</span>
            </Link>
            <Link className="sidebar-link" to="/app/admin/project-configs">
              <span>Project Configs</span>
            </Link>
            <Link className="sidebar-link" to="/app/admin/sync-jobs">
              <span>Sync Jobs</span>
            </Link>
            <Link className="sidebar-link" to="/app/reports">
              <span>Reports</span>
            </Link>
            <Link className="sidebar-link" to="/app/admin/audit-logs">
              <span>Audit Logs</span>
            </Link>
          </div>
        </nav>
      )}

      {role === "LECTURER" && (
        <nav className="sidebar-section">
          <p className="sidebar-section-title">Lecturer</p>
          <div className="sidebar-nav">
            <Link className="sidebar-link" to="/app/lecturer/groups/list">
              <span>My Groups</span>
            </Link>
            <Link className="sidebar-link" to="/app/lecturer/tasks">
              <span>Tasks</span>
            </Link>
            <Link className="sidebar-link" to="/app/lecturer/github-stats">
              <span>GitHub Stats</span>
            </Link>
            <Link className="sidebar-link" to="/app/reports">
              <span>Reports</span>
            </Link>
          </div>
        </nav>
      )}

      {role === "STUDENT" && (
        <nav className="sidebar-section">
          <p className="sidebar-section-title">Student</p>
          <div className="sidebar-nav">
            <Link className="sidebar-link" to="/app/student/team-board">
              <span>Team Board</span>
            </Link>
            <Link className="sidebar-link" to="/app/student/my-work">
              <span>My Work</span>
            </Link>
            <Link className="sidebar-link" to="/app/student/stats">
              <span>My Stats</span>
            </Link>
            <Link className="sidebar-link" to="/app/groups">
              <span>My Groups</span>
            </Link>
            <Link className="sidebar-link" to="/app/student/permissions">
              <span>Permissions</span>
            </Link>
          </div>
        </nav>
      )}
    </aside>
  );
}