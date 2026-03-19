import { useMemo, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import { useSecurityEvents, useAuditRange, useAuditByActor } from "../../hooks/useIdentityAdmin";
import { useUsers } from "../../hooks/useUserGroups";

export default function AuditLogs() {
  const toIsoDate = (d) => {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toISOString().slice(0, 10);
  };
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);

  // Default to range view so admins can see lifecycle events like SOFT_DELETE.
  const [filterType, setFilterType] = useState("range");
  const [startDate, setStartDate] = useState(toIsoDate(weekAgo));
  const [endDate, setEndDate] = useState(toIsoDate(today));
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
        <span className="auditlogs-time">
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
        <span className="auditlogs-actor">
          {row.actor}
          {row.actorId && (
            <span className="auditlogs-actor-id">#{row.actorId}</span>
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
        <span className="auditlogs-resource">{row.resource}</span>
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
        <span className="auditlogs-ip">
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
        <div className="panel panel-mb-16">
          <div className="panel-header">
            <h3>Filters</h3>
            <button
              className="primary-button secondary compact-button"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
          <div className="auditlogs-filter-grid">
            {/* Filter Type */}
            <label className="modal-field field-reset">
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
                <label className="modal-field field-reset">
                  <span>Start Date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <label className="modal-field field-reset">
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
              <label className="modal-field field-reset">
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
            <p className="auditlogs-warning">
              Please select both start and end dates to view logs.
            </p>
          )}

          {filterType === "actor" && !actorFilter && (
            <p className="auditlogs-warning">
              Please select a user to view their activity logs.
            </p>
          )}
        </div>

        {/* Results Info */}
        <div className="auditlogs-results-row">
          <span className="auditlogs-results-text">
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
          <div className="auditlogs-pagination">
            <button
              className="primary-button secondary compact-button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <span className="auditlogs-results-text">
              Page {page + 1} of {totalPages}
            </span>
            <button
              className="primary-button secondary compact-button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="panel panel-mt-16">
          <div className="panel-header">
            <h3>Action Legend</h3>
          </div>
          <div className="auditlogs-legend-grid">
            <div>
              <strong>Authentication:</strong>
              <div className="auditlogs-legend-text">
                LOGIN_SUCCESS, LOGIN_FAILED, LOGIN_DENIED, LOGOUT
              </div>
            </div>
            <div>
              <strong>Token:</strong>
              <div className="auditlogs-legend-text">
                REFRESH_SUCCESS, REFRESH_REUSE, REFRESH_EXPIRED
              </div>
            </div>
            <div>
              <strong>Account:</strong>
              <div className="auditlogs-legend-text">
                ACCOUNT_LOCKED, ACCOUNT_UNLOCKED, PASSWORD_CHANGE
              </div>
            </div>
            <div>
              <strong>CRUD:</strong>
              <div className="auditlogs-legend-text">
                CREATE, UPDATE, SOFT_DELETE, RESTORE
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
