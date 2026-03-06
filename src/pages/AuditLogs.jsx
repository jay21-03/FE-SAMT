import DashboardLayout from "../layout/DashboardLayout";
import DataTable from "../components/DataTable";

export default function AuditLogs() {
  const columns = [
    { key: "time", header: "Time" },
    { key: "actor", header: "Actor" },
    { key: "action", header: "Action" },
    { key: "resource", header: "Resource" },
    { key: "detail", header: "Detail" },
  ];

  const data = [];

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Audit Logs</h1>
            <p className="page-subtitle">
              Theo dõi lịch sử thao tác trên hệ thống.
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data}
          loading={false}
          emptyMessage="Chưa có log."
        />
      </div>
    </DashboardLayout>
  );
}

