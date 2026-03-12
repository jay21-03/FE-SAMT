import { useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import StatCard from "../../components/StatCard";

const STATUS_OPTIONS = ["Active", "Invited", "Pending"];

export default function AdminDashboard() {
  const [recentUsers, setRecentUsers] = useState([
    { name: "Jade Deo", role: "Admin", status: "Active" },
    { name: "Nora Milan", role: "Lecturer", status: "Active" },
    { name: "Abel Adrian", role: "Student", status: "Invited" },
    { name: "Deb Adrian", role: "Student", status: "Pending" },
  ]);

  const activeGroups = [
    { name: "Beta Thesis", lecturer: "John Deo", progress: 78 },
    { name: "Alpha Research", lecturer: "Anna Stone", progress: 52 },
    { name: "Gamma Labs", lecturer: "Josh Pratt", progress: 91 },
  ];

  const handleStatusChange = (name, nextStatus) => {
    setRecentUsers((prev) =>
      prev.map((u) => (u.name === name ? { ...u, status: nextStatus } : u)),
    );
  };

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">
              Tổng quan người dùng, nhóm và trạng thái hệ thống.
            </p>
          </div>
        </div>

        <section className="admin-stats-row">
          <StatCard title="Total Users" value="120" />
          <StatCard title="Total Groups" value="25" />
          <StatCard title="Active Projects" value="18" />
          <StatCard title="Pending Requests" value="3" />
        </section>

        <section className="admin-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Recent Users</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.name}>
                    <td>{u.name}</td>
                    <td>{u.role}</td>
                    <td>
                      <select
                        className={`status-select status-${u.status.toLowerCase()}`}
                        value={u.status}
                        onChange={(e) =>
                          handleStatusChange(u.name, e.target.value)
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Active Groups</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Group Name</th>
                  <th>Lecturer</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {activeGroups.map((g) => (
                  <tr key={g.name}>
                    <td>{g.name}</td>
                    <td>{g.lecturer}</td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${g.progress}%` }}
                          />
                        </div>
                        <span className="progress-label">{g.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-system-row">
          <div className="panel">
            <div className="panel-header">
              <h3>System Status</h3>
            </div>
            <div className="system-status-grid">
              <div className="system-status-item">
                <span>Jira API</span>
                <span className="status-pill status-active">Connected</span>
              </div>
              <div className="system-status-item">
                <span>GitHub API</span>
                <span className="status-pill status-active">Connected</span>
              </div>
              <div className="system-status-item">
                <span>Server Status</span>
                <span className="status-pill status-active">Online</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

