import { useMemo } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import StatCard from "../../components/StatCard";
import { useGroups, useUsers } from "../../hooks/useUserGroups";

export default function AdminDashboard() {
  const { data: usersData, isLoading: usersLoading } = useUsers({ page: 0, size: 5 });
  const { data: groupsData, isLoading: groupsLoading } = useGroups({ page: 0, size: 5 });

  const recentUsers = useMemo(() => {
    if (!usersData?.content) return [];
    return usersData.content.map((user) => ({
      id: user.id,
      name: user.fullName,
      role: user.roles?.[0] ?? "UNKNOWN",
      status: user.status ?? "UNKNOWN",
    }));
  }, [usersData]);

  const activeGroups = useMemo(() => {
    if (!groupsData?.content) return [];
    return groupsData.content.map((group) => ({
      id: group.id,
      name: group.groupName,
      lecturer: group.lecturerName,
      members: group.memberCount,
    }));
  }, [groupsData]);

  const totalUsers = usersData?.totalElements ?? 0;
  const totalGroups = groupsData?.totalElements ?? 0;

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">
              Overview of users, groups, and system status.
            </p>
          </div>
        </div>

        <section className="admin-stats-row">
          <StatCard title="Total Users" value={String(totalUsers)} />
          <StatCard title="Total Groups" value={String(totalGroups)} />
          <StatCard title="Active Projects" value={String(totalGroups)} />
          <StatCard title="Pending Requests" value="0" />
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
                {usersLoading ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: 16 }}>
                      Loading...
                    </td>
                  </tr>
                ) : recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: 16 }}>
                      No data
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.role}</td>
                      <td>{u.status}</td>
                    </tr>
                  ))
                )}
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
                  <th>Members</th>
                </tr>
              </thead>
              <tbody>
                {groupsLoading ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: 16 }}>
                      Loading...
                    </td>
                  </tr>
                ) : activeGroups.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: 16 }}>
                      No data
                    </td>
                  </tr>
                ) : (
                  activeGroups.map((g) => (
                    <tr key={g.id}>
                      <td>{g.name}</td>
                      <td>{g.lecturer}</td>
                      <td>{g.members}</td>
                    </tr>
                  ))
                )}
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
                <span className="status-pill status-pending">Unknown</span>
              </div>
              <div className="system-status-item">
                <span>GitHub API</span>
                <span className="status-pill status-pending">Unknown</span>
              </div>
              <div className="system-status-item">
                <span>Server Status</span>
                <span className="status-pill status-pending">Unknown</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

