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
  const { data: completedJobsData } = useSyncJobs({ page: 0, size: 1, status: "COMPLETED" });
  const { data: failedJobsData } = useSyncJobs({ page: 0, size: 1, status: "FAILED" });
  const { data: runningJobsData } = useSyncJobs({ page: 0, size: 1, status: "RUNNING" });

  const jobs = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;
  const completedTotal = completedJobsData?.totalElements ?? 0;
  const failedTotal = failedJobsData?.totalElements ?? 0;
  const runningTotal = runningJobsData?.totalElements ?? 0;

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
        <span className="syncjobs-job-id">#{row.syncJobId}</span>
      ),
    },
    {
      key: "projectConfigId",
      header: "Project Config",
      render: (row) => (
        <span className="syncjobs-config-id" title={row.projectConfigId}>
          {row.projectConfigId?.substring(0, 8)}...
        </span>
      ),
    },
    {
      key: "jobType",
      header: "Type",
      render: (row) => (
        <span className={`syncjobs-type-badge ${row.jobType === "JIRA_ISSUES" ? "jira" : "github"}`}>
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
        <span className="syncjobs-records">
          <span className="syncjobs-fetched">{row.recordsFetched ?? 0}</span>
          {" / "}
          <span className="syncjobs-saved">{row.recordsSaved ?? 0}</span>
        </span>
      ),
    },
    {
      key: "degraded",
      header: "Degraded",
      render: (row) => (
        row.degraded ? (
          <span className="syncjobs-degraded-yes">Yes</span>
        ) : (
          <span className="syncjobs-degraded-no">No</span>
        )
      ),
    },
    {
      key: "startedAt",
      header: "Started",
      render: (row) => (
        <span className="syncjobs-time">
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
        <span className="syncjobs-time">
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
          <span className="syncjobs-error" title={row.errorMessage}>
            {row.errorMessage}
          </span>
        ) : (
          <span className="syncjobs-error-empty">-</span>
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
        <div className="panel panel-mb-16">
          <div className="panel-header">
            <h3>Filters</h3>
          </div>
          <div className="syncjobs-filters-row">
            <label className="modal-field syncjobs-filter-config">
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
            <label className="modal-field field-reset">
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
            <label className="modal-field field-reset">
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
        <div className="syncjobs-stats-row">
          <div className="stat-card syncjobs-stat-card">
            <div className="stat-value">{totalElements}</div>
            <div className="stat-label">Total Jobs</div>
          </div>
          <div className="stat-card syncjobs-stat-card">
            <div className="stat-value syncjobs-fetched">
              {completedTotal}
            </div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card syncjobs-stat-card">
            <div className="stat-value syncjobs-failed">
              {failedTotal}
            </div>
            <div className="stat-label">Failed</div>
          </div>
          <div className="stat-card syncjobs-stat-card">
            <div className="stat-value syncjobs-running">
              {runningTotal}
            </div>
            <div className="stat-label">Running</div>
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
        <div className="panel panel-mt-16">
          <div className="panel-header">
            <h3>Legend</h3>
          </div>
          <div className="syncjobs-legend-row">
            <div className="syncjobs-legend-item">
              <span className="syncjobs-type-badge jira">
                Jira Issues
              </span>
              <span className="text-muted">Jira issue synchronization</span>
            </div>
            <div className="syncjobs-legend-item">
              <span className="syncjobs-type-badge github">
                GitHub Commits
              </span>
              <span className="text-muted">GitHub commit synchronization</span>
            </div>
            <div className="syncjobs-legend-item">
              <span className="syncjobs-fetched">Fetched</span>
              <span className="text-muted">/</span>
              <span className="syncjobs-saved">Saved</span>
              <span className="text-muted">Records count</span>
            </div>
            <div className="syncjobs-legend-item">
              <span className="syncjobs-running">Degraded</span>
              <span className="text-muted">Partial failure with fallback</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
