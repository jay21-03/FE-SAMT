import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";

export default function SemesterManagement() {
  const columns = [
    { key: "code", header: "Semester Code" },
    { key: "name", header: "Name" },
    { key: "startDate", header: "Start Date" },
    { key: "endDate", header: "End Date" },
    { key: "status", header: "Status" },
    { key: "actions", header: "" },
  ];

  const data = [];

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Semester Management</h1>
            <p className="page-subtitle">Quản lý danh sách các học kỳ.</p>
          </div>
          <button className="primary-button">New Semester</button>
        </div>

        <DataTable
          columns={columns}
          data={data}
          loading={false}
          emptyMessage="Chưa có học kỳ."
        />
      </div>
    </DashboardLayout>
  );
}

