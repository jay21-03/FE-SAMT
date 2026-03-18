import { useState, useMemo } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import { useReports, useGenerateReport, useDownloadReport } from "../../hooks/useReport";
import { useGroups, useUserGroups } from "../../hooks/useUserGroups";
import { useProjectConfigByGroup } from "../../hooks/useProjectConfigs";
import { useProfile } from "../../hooks/useAuth";

export default function Reports() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [useAi, setUseAi] = useState(true);
  const [exportType, setExportType] = useState("DOCX");
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const query = useMemo(() => {
    const q = { page, size: 10 };
    if (statusFilter) q.status = statusFilter;
    return q;
  }, [page, statusFilter]);

  const { data, isLoading, isFetching, refetch } = useReports(query);
  const { data: totalReportsData } = useReports({ page: 0, size: 1 });
  const { data: completedReportsData } = useReports({ page: 0, size: 1, status: "COMPLETED" });
  const { data: processingReportsData } = useReports({ page: 0, size: 1, status: "PROCESSING" });
  const { data: pendingReportsData } = useReports({ page: 0, size: 1, status: "PENDING" });
  const { data: failedReportsData } = useReports({ page: 0, size: 1, status: "FAILED" });
  const { data: profile } = useProfile();
  const currentUserId = Number(profile?.id || 0);
  const currentRole = String(profile?.role || profile?.roles?.[0] || "").toUpperCase();
  const isStudent = currentRole === "STUDENT";
  const isLecturer = currentRole === "LECTURER";
  const isAdmin = currentRole === "ADMIN";

  const { data: groupsData } = useGroups(
    { page: 0, size: 100, lecturerId: isLecturer ? currentUserId : undefined },
    { enabled: isAdmin || isLecturer }
  );
  const { data: userGroupsData } = useUserGroups(currentUserId);
  const { data: configData } = useProjectConfigByGroup(
    selectedGroupId ? Number(selectedGroupId) : 0
  );

  const generateReport = useGenerateReport();
  const downloadReport = useDownloadReport();
  const selectedConfig = configData?.data ?? configData ?? null;

  const reports = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;
  const allGroups = groupsData?.data?.content || groupsData?.content || [];
  const ownGroups = userGroupsData?.groups || [];
  const groups = isStudent ? ownGroups : allGroups;

  const completedCount = completedReportsData?.totalElements ?? 0;
  const processingCount =
    (processingReportsData?.totalElements ?? 0) + (pendingReportsData?.totalElements ?? 0);
  const failedCount = failedReportsData?.totalElements ?? 0;
  const totalReportsCount = totalReportsData?.totalElements ?? 0;

  const handleGenerate = async () => {
    if (!selectedConfig?.id) {
      setErrorMessage("Selected group does not have a project configuration.");
      return;
    }
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await generateReport.mutateAsync({
        projectConfigId: String(selectedConfig.id),
        useAi,
        exportType,
      });
      setSuccessMessage("Report generation started! It will appear in the list shortly.");
      setShowGenerateModal(false);
      setSelectedGroupId("");
      refetch();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Failed to generate report.");
    }
  };

  const handleDownload = async (reportId) => {
    try {
      await downloadReport.mutateAsync(reportId);
    } catch {
      setErrorMessage("Failed to download report.");
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      COMPLETED: "✓",
      FAILED: "✕",
      PROCESSING: "⟳",
      PENDING: "◷",
    };
    return icons[status] || "◷";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return "📄";
    if (fileName.endsWith(".pdf")) return "📕";
    if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) return "📘";
    return "📄";
  };

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        {/* Header */}
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Reports</h1>
            <p className="page-subtitle">Generate and manage SRS documentation for your projects</p>
          </div>
          <button className="primary-button reports-generate-btn" onClick={() => setShowGenerateModal(true)}>
            <span className="reports-generate-icon">+</span> Generate Report
          </button>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="alert alert-success reports-alert-row">
            <span>✓</span> {successMessage}
            <button className="reports-alert-close" onClick={() => setSuccessMessage(null)}>
              ×
            </button>
          </div>
        )}
        {errorMessage && (
          <div className="alert alert-error reports-alert-row">
            <span>!</span> {errorMessage}
            <button className="reports-alert-close" onClick={() => setErrorMessage(null)}>
              ×
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="reports-stats-grid">
          <div className="reports-stat-card reports-stat-card-total">
            <div className="reports-stat-value">{totalReportsCount}</div>
            <div className="reports-stat-label">Total Reports</div>
          </div>
          <div className="reports-stat-card reports-stat-card-completed">
            <div className="reports-stat-value">{completedCount}</div>
            <div className="reports-stat-label">Completed</div>
          </div>
          <div className="reports-stat-card reports-stat-card-processing">
            <div className="reports-stat-value">{processingCount}</div>
            <div className="reports-stat-label">Processing</div>
          </div>
          <div className="reports-stat-card reports-stat-card-failed">
            <div className="reports-stat-value">{failedCount}</div>
            <div className="reports-stat-label">Failed</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="chip-filter-row">
          <span className="chip-filter-label">Filter by Status:</span>
          {["", "COMPLETED", "PROCESSING", "PENDING", "FAILED"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(0);
              }}
              className={`chip-filter-btn ${statusFilter === status ? "active" : ""}`}
            >
              {status || "All"}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            className="primary-button secondary compact-button chip-filter-refresh"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Reports Table */}
        <div className="reports-table-shell">
          {isLoading || isFetching ? (
            <div className="reports-loading-block">
              <div className="reports-loading-icon">⟳</div>
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="reports-empty-block">
              <div className="reports-empty-icon">📋</div>
              <h3 className="reports-empty-title">No reports yet</h3>
              <p className="reports-empty-subtitle">
                Generate your first SRS report to get started
              </p>
            </div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th className="reports-col-report">
                    Report
                  </th>
                  <th className="reports-col-status">
                    Status
                  </th>
                  <th className="reports-col-created">
                    Created
                  </th>
                  <th className="reports-col-actions">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  return (
                    <tr key={report.reportId}>
                      <td>
                        <div className="reports-row-main">
                          <div className="reports-file-icon">
                            {getFileIcon(report.fileName)}
                          </div>
                          <div className="reports-file-meta">
                            <div className="reports-file-name" title={report.fileName}>
                              {report.fileName || "Generating..."}
                            </div>
                            <div className="reports-file-submeta">
                              <span className="reports-type-badge">
                                {report.type || "SRS"}
                              </span>
                              <span className="reports-id" title={report.reportId}>
                                #{report.reportId?.substring(0, 8)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`reports-status-badge reports-status-${report.status?.toLowerCase()}`}>
                          <span className={report.status === "PROCESSING" ? "reports-spin" : ""}>
                            {getStatusIcon(report.status)}
                          </span>
                          {report.status}
                        </span>
                      </td>
                      <td>
                        <div className="reports-created-main">
                          {formatDate(report.createdAt)}
                        </div>
                        {report.createdAt && (
                          <div className="reports-created-sub">
                            {new Date(report.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </td>
                      <td className="reports-actions-cell">
                        {report.status === "COMPLETED" ? (
                          <button
                            className="primary-button compact-button reports-download-btn"
                            onClick={() => handleDownload(report.reportId)}
                            disabled={downloadReport.isPending}
                          >
                            ↓ Download
                          </button>
                        ) : report.status === "PROCESSING" || report.status === "PENDING" ? (
                          <span className="reports-processing-label">
                            Processing...
                          </span>
                        ) : (
                          <button className="reports-failed-pill" disabled>
                            Failed
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="reports-pagination">
              <span className="reports-pagination-text">
                Page {page + 1} of {totalPages} ({totalElements} total reports)
              </span>
              <div className="reports-pagination-actions">
                <button
                  className="primary-button secondary compact-button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  ← Previous
                </button>
                <button
                  className="primary-button secondary compact-button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="reports-info-card">
          <h3 className="reports-info-title">
            About SRS Reports
          </h3>
          <div className="reports-info-grid">
            <div className="reports-info-item">
              <span>📊</span>
              <span>Reports are generated from synced Jira issues and GitHub commits</span>
            </div>
            <div className="reports-info-item">
              <span>🤖</span>
              <span>AI enhancement provides better descriptions and summaries</span>
            </div>
            <div className="reports-info-item">
              <span>📄</span>
              <span>Export formats: DOCX (Word) or PDF</span>
            </div>
            <div className="reports-info-item">
              <span>✓</span>
              <span>Ensure project config is verified before generating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="modal-overlay reports-modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal-content reports-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="reports-modal-header-center">
              <div className="reports-modal-icon">
                📄
              </div>
              <h2 className="reports-modal-title">Generate SRS Report</h2>
              <p className="reports-modal-subtitle">
                Create documentation from your project data
              </p>
            </div>

            <label className="modal-field">
              <span className="reports-field-title">Select Group *</span>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="reports-select"
              >
                <option value="">Choose a group...</option>
                {groups.length === 0 && <option value="" disabled>No assigned groups</option>}
                {groups.map((group) => (
                  <option key={group.groupId} value={group.groupId}>
                    {group.groupName} ({group.semesterCode})
                  </option>
                ))}
              </select>
            </label>

            {selectedGroupId && selectedConfig?.id && (
              <div className={`reports-config-box ${selectedConfig.state === "VERIFIED" ? "verified" : "warning"}`}>
                <div className="reports-config-row">
                  <div>
                    <div className="reports-config-label">
                      Project Configuration
                    </div>
                    <div className="reports-config-id">
                      {String(selectedConfig.id).substring(0, 12)}...
                    </div>
                  </div>
                  <span className={`reports-config-state ${selectedConfig.state === "VERIFIED" ? "verified" : "warning"}`}>
                    {selectedConfig.state}
                  </span>
                </div>
              </div>
            )}

            {selectedGroupId && !selectedConfig?.id && (
              <div className="reports-config-box error">
                ⚠️ This group does not have a project configuration. Please configure it first.
              </div>
            )}

            <div className="reports-modal-grid">
              <label className="modal-field reports-modal-field-reset">
                <span className="reports-field-title">Export Format</span>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="reports-select"
                >
                  <option value="DOCX">📘 DOCX (Word)</option>
                  <option value="PDF">📕 PDF</option>
                </select>
              </label>
              <div className="reports-ai-col">
                <label className={`reports-ai-toggle ${useAi ? "active" : ""}`}>
                  <input
                    type="checkbox"
                    checked={useAi}
                    onChange={(e) => setUseAi(e.target.checked)}
                    className="reports-ai-checkbox"
                  />
                  <span className="reports-ai-label">
                    🤖 Use AI
                  </span>
                </label>
              </div>
            </div>

            <div className="reports-modal-actions">
              <button
                className="primary-button secondary reports-modal-btn"
                onClick={() => {
                  setShowGenerateModal(false);
                  setSelectedGroupId("");
                }}
              >
                Cancel
              </button>
              <button
                className="primary-button reports-modal-btn"
                onClick={handleGenerate}
                disabled={
                  !selectedGroupId ||
                  !selectedConfig?.id ||
                  selectedConfig?.state !== "VERIFIED" ||
                  generateReport.isPending
                }
              >
                {generateReport.isPending ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
