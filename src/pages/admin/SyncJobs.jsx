import { useState, useMemo } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import DebouncedSearchInput from "../../components/DebouncedSearchInput";
import { useSyncJobs } from "../../hooks/useSync";

export default function SyncJobs() {
  const [page, setPage] = useState(0);
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [configIdSearch, setConfigIdSearch] = useState("");

  const query = useMemo(() => {
    const q = { page, size: 20 };
    if (jobTypeFilter) q.jobType = jobTypeFilter;
    if (statusFilter) q.status = statusFilter;
    if (configIdSearch) q.projectConfigId = configIdSearch;
    return q;
  }, [page, jobTypeFilter, statusFilter, configIdSearch]);

  const { data, isLoading, isFetching } = useSyncJobs(query);

  const jobs = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const getStatusClass = (status) => {
    switch (status) {
      case "COMPLETED": return "status-active";
      case "FAILED": return "status-locked";
      case "RUNNING": return "status-pending";
      default: return "status-pending";
    }
  };

  const columns = [
    {
      key: "syncJobId",
      header: "Job ID",
      render: (row) => (
        <span style={{ fontFamily: "monospace", fontWeight: 600 }}>#{row.syncJobId}</span>
      ),
    },
    {
      key: "projectConfigId",
      header: "Project Config",
      render: (row) => (
        <span 
          style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}
          title={row.projectConfigId}
        >
          {row.projectConfigId?.substring(0, 8)}...
        </span>
      ),
    },
    {
      key: "jobType",
      header: "Type",
      render: (row) => (
        <span style={{ 
          fontSize: 12, 
          fontWeight: 500,
          padding: "2px 8px",
          borderRadius: 4,
          background: row.jobType === "JIRA_ISSUES" ? "#e6f0ff" : "#f0f0f0",
          color: row.jobType === "JIRA_ISSUES" ? "#0052cc" : "#24292e"
        }}>
          {row.jobType === "JIRA_ISSUES" ? "Jira Issues" : "GitHub Commits"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span className={`status-pill ${getStatusClass(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "records",
      header: "Records",
      render: (row) => (
        <span style={{ fontSize: 12 }}>
          <span style={{ color: "#059669" }}>{row.recordsFetched ?? 0}</span>
          {" / "}
          <span style={{ color: "#0066cc" }}>{row.recordsSaved ?? 0}</span>
        </span>
      ),
    },
    {
      key: "degraded",
      header: "Degraded",
      render: (row) => (
        row.degraded ? (
          <span style={{ color: "#d97706", fontSize: 12 }}>Yes</span>
        ) : (
          <span style={{ color: "#6b7280", fontSize: 12 }}>No</span>
        )
      ),
    },
    {
      key: "startedAt",
      header: "Started",
      render: (row) => (
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {row.startedAt 
            ? new Date(row.startedAt).toLocaleString("en-US", { 
                dateStyle: "short", 
                timeStyle: "short" 
              })
            : "-"
          }
        </span>
      ),
    },
    {
      key: "completedAt",
      header: "Completed",
      render: (row) => (
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {row.completedAt 
            ? new Date(row.completedAt).toLocaleString("en-US", { 
                dateStyle: "short", 
                timeStyle: "short" 
              })
            : row.status === "RUNNING" ? "In progress..." : "-"
          }
        </span>
      ),
    },
    {
      key: "errorMessage",
      header: "Error",
      render: (row) => (
        row.errorMessage ? (
          <span 
            style={{ 
              fontSize: 11, 
              color: "#dc2626", 
              maxWidth: 150, 
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
            title={row.errorMessage}
          >
            {row.errorMessage}
          </span>
        ) : (
          <span style={{ color: "#9ca3af", fontSize: 11 }}>-</span>
        )
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Sync Jobs</h1>
            <p className="page-subtitle">
              Monitor and manage Jira/GitHub synchronization jobs across all projects.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <h3>Filters</h3>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "8px 0" }}>
            <label className="modal-field" style={{ margin: 0, minWidth: 200 }}>
              <span>Project Config ID</span>
              <input
                type="text"
                placeholder="UUID or partial..."
                value={configIdSearch}
                onChange={(e) => {
                  setConfigIdSearch(e.target.value);
                  setPage(0);
                }}
              />
            </label>
            <label className="modal-field" style={{ margin: 0 }}>
              <span>Job Type</span>
              <select
                value={jobTypeFilter}
                onChange={(e) => {
                  setJobTypeFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All Types</option>
                <option value="JIRA_ISSUES">Jira Issues</option>
                <option value="GITHUB_COMMITS">GitHub Commits</option>
              </select>
            </label>
            <label className="modal-field" style={{ margin: 0 }}>
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="RUNNING">Running</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
            </label>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div className="stat-card" style={{ flex: 1, padding: 16 }}>
            <div className="stat-value">{totalElements}</div>
            <div className="stat-label">Total Jobs</div>
          </div>
          <div className="stat-card" style={{ flex: 1, padding: 16 }}>
            <div className="stat-value" style={{ color: "#059669" }}>
              {jobs.filter(j => j.status === "COMPLETED").length}
            </div>
            <div className="stat-label">Completed (this page)</div>
          </div>
          <div className="stat-card" style={{ flex: 1, padding: 16 }}>
            <div className="stat-value" style={{ color: "#dc2626" }}>
              {jobs.filter(j => j.status === "FAILED").length}
            </div>
            <div className="stat-label">Failed (this page)</div>
          </div>
          <div className="stat-card" style={{ flex: 1, padding: 16 }}>
            <div className="stat-value" style={{ color: "#d97706" }}>
              {jobs.filter(j => j.status === "RUNNING").length}
            </div>
            <div className="stat-label">Running (this page)</div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={jobs}
          keyField="syncJobId"
          loading={isLoading || isFetching}
          emptyMessage="No sync jobs found."
          pagination={{
            page,
            totalPages,
            onPageChange: setPage,
          }}
        />

        {/* Legend */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h3>Legend</h3>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", padding: "12px 0", fontSize: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ 
                padding: "2px 8px", 
                borderRadius: 4, 
                background: "#e6f0ff", 
                color: "#0052cc",
                fontSize: 11
              }}>
                Jira Issues
              </span>
              <span style={{ color: "#6b7280" }}>Jira issue synchronization</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ 
                padding: "2px 8px", 
                borderRadius: 4, 
                background: "#f0f0f0", 
                color: "#24292e",
                fontSize: 11
              }}>
                GitHub Commits
              </span>
              <span style={{ color: "#6b7280" }}>GitHub commit synchronization</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#059669" }}>Fetched</span>
              <span style={{ color: "#6b7280" }}>/</span>
              <span style={{ color: "#0066cc" }}>Saved</span>
              <span style={{ color: "#6b7280" }}>Records count</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#d97706" }}>Degraded</span>
              <span style={{ color: "#6b7280" }}>Partial failure with fallback</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
