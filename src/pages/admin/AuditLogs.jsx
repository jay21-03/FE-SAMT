import { useMemo } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import { useSecurityEvents } from "../../hooks/useIdentityAdmin";

export default function AuditLogs() {
  const { data, isLoading } = useSecurityEvents({ page: 0, size: 20 });
  const columns = [
    { key: "time", header: "Time" },
    { key: "actor", header: "Actor" },
    { key: "action", header: "Action" },
    { key: "resource", header: "Resource" },
    { key: "detail", header: "Detail" },
  ];

  const rows = useMemo(() => {
    if (!data?.content) return [];
    return data.content.map((log) => ({
      id: log.id,
      time: log.timestamp,
      actor: log.actorEmail ?? "SYSTEM",
      action: log.action,
      resource: `${log.entityType}#${log.entityId}`,
      detail: log.outcome,
    }));
  }, [data]);

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
          data={rows}
          loading={isLoading}
          emptyMessage="Chưa có log."
        />
      </div>
    </DashboardLayout>
  );
}

