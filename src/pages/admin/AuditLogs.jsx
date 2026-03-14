import { useMemo, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import { useSecurityEvents, useAuditRange, useAuditByActor } from "../../hooks/useIdentityAdmin";
import { useUsers } from "../../hooks/useUserGroups";

export default function AuditLogs() {
  const [filterType, setFilterType] = useState("security");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data: usersData } = useUsers({ page: 0, size: 100 });
  const users = usersData?.content || [];

  const baseQuery = { page, size: pageSize };
  const rangeQuery = {
    page,
    size: pageSize,
    startDate: startDate ? `${startDate}T00:00:00` : undefined,
    endDate: endDate ? `${endDate}T23:59:59` : undefined,
  };

  // Security events query
  const { data: securityData, isLoading: securityLoading } = useSecurityEvents(
    filterType === "security" ? baseQuery : undefined
  );

  // Date range query
  const { data: rangeData, isLoading: rangeLoading } = useAuditRange(
    filterType === "range" ? rangeQuery : undefined,
    filterType === "range" && !!startDate && !!endDate
  );

  // Actor filter query (server-side)
  const actorId = actorFilter ? parseInt(actorFilter, 10) : 0;
  const { data: actorData, isLoading: actorLoading } = useAuditByActor(
    filterType === "actor" ? actorId : 0,
    filterType === "actor" ? baseQuery : undefined
  );

  // Determine which data and loading state to use
  const isLoading = 
    filterType === "security" ? securityLoading : 
    filterType === "range" ? rangeLoading : 
    actorLoading;
  
  const data = 
    filterType === "security" ? securityData : 
    filterType === "range" ? rangeData : 
    actorData;

  const columns = [
    {
      key: "time",
      header: "Time",
      render: (row) => (
        <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>
          {new Date(row.time).toLocaleString("en-US", {
            dateStyle: "short",
            timeStyle: "medium",
          })}
        </span>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (row) => (
        <span style={{ fontSize: 13 }}>
          {row.actor}
          {row.actorId && (
            <span style={{ color: "#6b7280", marginLeft: 4 }}>#{row.actorId}</span>
          )}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => {
        const actionColors = {
          LOGIN_SUCCESS: "status-active",
          LOGIN_FAILED: "status-locked",
          LOGIN_DENIED: "status-locked",
          LOGOUT: "status-pending",
          REFRESH_SUCCESS: "status-active",
          REFRESH_REUSE: "status-locked",
          REFRESH_EXPIRED: "status-pending",
          ACCOUNT_LOCKED: "status-locked",
          ACCOUNT_UNLOCKED: "status-active",
          CREATE: "status-active",
          UPDATE: "status-pending",
          SOFT_DELETE: "status-locked",
          RESTORE: "status-active",
        };
        const colorClass = actionColors[row.action] || "status-pending";
        return <span className={`status-pill ${colorClass}`}>{row.action}</span>;
      },
    },
    {
      key: "resource",
      header: "Resource",
      render: (row) => (
        <span style={{ fontSize: 13, fontFamily: "monospace" }}>{row.resource}</span>
      ),
    },
    {
      key: "outcome",
      header: "Outcome",
      render: (row) => {
        const outcomeColors = {
          SUCCESS: "status-active",
          FAILURE: "status-locked",
          DENIED: "status-locked",
        };
        const colorClass = outcomeColors[row.outcome] || "status-pending";
        return <span className={`status-pill ${colorClass}`}>{row.outcome}</span>;
      },
    },
    {
      key: "ip",
      header: "IP Address",
      render: (row) => (
        <span style={{ fontSize: 12, fontFamily: "monospace", color: "#6b7280" }}>
          {row.ip || "-"}
        </span>
      ),
    },
  ];

  const rows = useMemo(() => {
    // Handle both wrapped (data.data.content) and unwrapped (data.content) responses
    const logs = data?.data?.content || data?.content || [];
    if (logs.length === 0) return [];

    return logs.map((log) => ({
      id: log.id,
      time: log.timestamp,
      actor: log.actorEmail ?? "SYSTEM",
      actorId: log.actorId,
      action: log.action,
      resource: `${log.entityType}#${log.entityId}`,
      entityType: log.entityType,
      entityId: log.entityId,
      outcome: log.outcome,
      ip: log.ipAddress,
    }));
  }, [data]);

  const totalPages = data?.data?.totalPages || data?.totalPages || 1;
  const totalElements = data?.data?.totalElements || data?.totalElements || 0;

  const handleClearFilters = () => {
    setFilterType("security");
    setStartDate("");
    setEndDate("");
    setActorFilter("");
    setPage(0);
  };

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Audit Logs</h1>
            <p className="page-subtitle">
              Track system activities and security events.
            </p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <h3>Filters</h3>
            <button
              className="primary-button secondary"
              style={{ padding: "4px 12px", fontSize: 12 }}
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              padding: "12px 0",
            }}
          >
            {/* Filter Type */}
            <label className="modal-field" style={{ margin: 0 }}>
              <span>Log Type</span>
              <select
                className="select-input"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(0);
                }}
              >
                <option value="security">Security Events</option>
                <option value="range">All Events (by Date)</option>
                <option value="actor">By Actor (User)</option>
              </select>
            </label>

            {/* Date Range - only show for range filter */}
            {filterType === "range" && (
              <>
                <label className="modal-field" style={{ margin: 0 }}>
                  <span>Start Date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <label className="modal-field" style={{ margin: 0 }}>
                  <span>End Date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </label>
              </>
            )}

            {/* Actor Filter - only show for actor filter */}
            {filterType === "actor" && (
              <label className="modal-field" style={{ margin: 0 }}>
                <span>Select User</span>
                <select
                  className="select-input"
                  value={actorFilter}
                  onChange={(e) => {
                    setActorFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="">-- Select a user --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} ({user.email})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {filterType === "range" && (!startDate || !endDate) && (
            <p style={{ color: "#f59e0b", fontSize: 13, marginTop: 8 }}>
              Please select both start and end dates to view logs.
            </p>
          )}

          {filterType === "actor" && !actorFilter && (
            <p style={{ color: "#f59e0b", fontSize: 13, marginTop: 8 }}>
              Please select a user to view their activity logs.
            </p>
          )}
        </div>

        {/* Results Info */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span style={{ color: "#6b7280", fontSize: 13 }}>
            {totalElements > 0
              ? `Showing ${page * pageSize + 1}-${Math.min(
                  (page + 1) * pageSize,
                  totalElements
                )} of ${totalElements} logs`
              : "No logs found"}
          </span>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          emptyMessage={
            filterType === "range" && (!startDate || !endDate)
              ? "Please select a date range to view logs."
              : filterType === "actor" && !actorFilter
              ? "Please select a user to view their activity logs."
              : "No audit logs found."
          }
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
            }}
          >
            <button
              className="primary-button secondary"
              style={{ padding: "6px 12px" }}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <span style={{ color: "#6b7280", fontSize: 13 }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              className="primary-button secondary"
              style={{ padding: "6px 12px" }}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h3>Action Legend</h3>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 8,
              padding: "12px 0",
              fontSize: 13,
            }}
          >
            <div>
              <strong>Authentication:</strong>
              <div style={{ color: "#6b7280", marginTop: 4 }}>
                LOGIN_SUCCESS, LOGIN_FAILED, LOGIN_DENIED, LOGOUT
              </div>
            </div>
            <div>
              <strong>Token:</strong>
              <div style={{ color: "#6b7280", marginTop: 4 }}>
                REFRESH_SUCCESS, REFRESH_REUSE, REFRESH_EXPIRED
              </div>
            </div>
            <div>
              <strong>Account:</strong>
              <div style={{ color: "#6b7280", marginTop: 4 }}>
                ACCOUNT_LOCKED, ACCOUNT_UNLOCKED, PASSWORD_CHANGE
              </div>
            </div>
            <div>
              <strong>CRUD:</strong>
              <div style={{ color: "#6b7280", marginTop: 4 }}>
                CREATE, UPDATE, SOFT_DELETE, RESTORE
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
