import { useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";

export default function UserManagement() {
  const [loading] = useState(false);

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

  const data = [];

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
          <select className="select-input">
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="LOCKED">Locked</option>
            <option value="DELETED">Deleted</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="Chưa có dữ liệu người dùng."
        />
      </div>
    </DashboardLayout>
  );
}

