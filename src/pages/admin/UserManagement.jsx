import { useMemo, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import DebouncedSearchInput from "../../components/DebouncedSearchInput";
import { useUsers } from "../../hooks/useUserGroups";

export default function UserManagement() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useUsers({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search,
    page: 0,
    size: 20,
  });

  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (row) => <span className="badge-role">{row.role}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span className="status-pill status-active">{row.status}</span>
      ),
    },
    { key: "actions", header: "" },
  ];

  const rows = useMemo(() => {
    if (!data?.content) return [];
    return data.content.map((user) => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.roles?.[0] ?? "UNKNOWN",
      status: user.status ?? "UNKNOWN",
    }));
  }, [data]);

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">
              Quản lý tài khoản Admin, Lecturer và Student.
            </p>
          </div>
          <button className="primary-button">Create User</button>
        </div>

        <div className="filter-row">
          <DebouncedSearchInput
            placeholder="Search by name or email..."
            onChange={(value) => setSearch(value)}
          />
          <select
            className="select-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="LOCKED">Locked</option>
            <option value="DELETED">Deleted</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          emptyMessage="Chưa có dữ liệu người dùng."
        />
      </div>
    </DashboardLayout>
  );
}

