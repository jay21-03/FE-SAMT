import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";

export default function GroupList() {
  const columns = [
    { key: "name", header: "Group Name" },
    { key: "semester", header: "Semester" },
    { key: "lecturer", header: "Lecturer" },
    { key: "members", header: "Members" },
    { key: "status", header: "Status" },
    { key: "actions", header: "" },
  ];

  const data = [];

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Groups</h1>
            <p className="page-subtitle">
              Danh sách nhóm đồ án theo học kỳ và giảng viên.
            </p>
          </div>
          <button className="primary-button">Create Group</button>
        </div>

        <DataTable
          columns={columns}
          data={data}
          loading={false}
          emptyMessage="Chưa có nhóm."
        />
      </div>
    </DashboardLayout>
  );
}

