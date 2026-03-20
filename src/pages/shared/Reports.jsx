import { useState, useMemo } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import {
  useReports,
  useGenerateReport,
  useGenerateCommitAnalysisReport,
  useGenerateWorkDistributionReport,
  useDownloadReport,
  useRecentActivities,
} from "../../hooks/useReport";
import { useGroup, useGroups, useUserGroups } from "../../hooks/useUserGroups";
import { useProjectConfigByGroup } from "../../hooks/useProjectConfigs";
import { useProfile } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { isStudentLeader } from "../../utils/access";

export default function Reports() {
  const [page, setPage] = useState(0);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [reportType, setReportType] = useState("SRS");
  const [useAi, setUseAi] = useState(true);
  const [exportType, setExportType] = useState("DOCX");
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const query = useMemo(() => {
    const q = { page, size: 10 };
    return q;
  }, [page]);

  const { data, isLoading, isFetching, refetch } = useReports(query);
  const { data: totalReportsData } = useReports({ page: 0, size: 1 });
  const { data: completedReportsData } = useReports({ page: 0, size: 1, status: "COMPLETED" });
  const { data: profile } = useProfile();
  const currentUserId = Number(profile?.id || 0);
  const currentRole = String(profile?.role || profile?.roles?.[0] || "").toUpperCase();
  const isStudent = currentRole === "STUDENT";
  const isLecturer = currentRole === "LECTURER";
  const isAdmin = currentRole === "ADMIN";
  const { data: membershipsData } = useUserGroups(currentUserId);
  const canStudentAccessReports = !isStudent || isStudentLeader(membershipsData);
  const canGenerateAnalytics = isLecturer;
  const selectedGroupNumber = selectedGroupId ? Number(selectedGroupId) : 0;

  if (!canStudentAccessReports) {
    return <Navigate to="/app/student/my-work" replace />;
  }

  const { data: groupsData } = useGroups(
    { page: 0, size: 100, lecturerId: isLecturer ? currentUserId : undefined },
    { enabled: isAdmin || isLecturer }
  );
  const { data: userGroupsData } = useUserGroups(currentUserId);
  const { data: configData } = useProjectConfigByGroup(
    selectedGroupNumber
  );
  const { data: groupData } = useGroup(selectedGroupNumber);
  const { data: recentActivitiesData } = useRecentActivities(
    selectedGroupNumber,
    { page: 0, size: 100 },
  );

  const generateReport = useGenerateReport();
  const generateWorkDistributionReport = useGenerateWorkDistributionReport();
  const generateCommitAnalysisReport = useGenerateCommitAnalysisReport();
  const downloadReport = useDownloadReport();
  const selectedConfig = configData?.data?.data ?? configData?.data ?? configData ?? null;

  const reports = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;
  const allGroups = groupsData?.data?.content || groupsData?.content || [];
  const ownGroups = userGroupsData?.groups || [];
  const groups = useMemo(() => {
    const source = isStudent ? ownGroups : allGroups;
    if (!Array.isArray(source)) return [];
    return source.map((g) => ({
      ...g,
      groupId: g.groupId ?? g.id,
    }));
  }, [allGroups, isStudent, ownGroups]);

  const completedCount = completedReportsData?.totalElements ?? 0;
  const totalReportsCount = totalReportsData?.totalElements ?? 0;

  const normalizeIssueStatus = (rawStatus) => {
    const s = String(rawStatus || "").toUpperCase();
    if (s.includes("DONE") || s.includes("APPROVED") || s.includes("CLOSED")) return "DONE";
    if (s.includes("IN_PROGRESS") || s.includes("IN DESIGN") || s.includes("IN_DESIGN")) return "IN_PROGRESS";
    return "TODO";
  };

  const toKey = (value) => String(value || "").trim().toLowerCase();

  const isJiraActivity = (activity) => {
    const source = String(activity?.source || "").toUpperCase();
    if (source) return source === "JIRA";
    const type = String(activity?.type || "").toUpperCase();
    const title = String(activity?.title || "").toUpperCase();
    return type.includes("JIRA") || title.includes("JIRA-");
  };

  const isGithubActivity = (activity) => {
    const source = String(activity?.source || "").toUpperCase();
    if (source) return source === "GITHUB";
    const type = String(activity?.type || "").toUpperCase();
    const title = String(activity?.title || "").toUpperCase();
    return type.includes("COMMIT") || type.includes("PULL") || title.includes("COMMIT");
  };

  const toIsoDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const buildAnalyticsPayload = () => {
    const members = Array.isArray(groupData?.members)
      ? groupData.members.map((m) => ({
          id: String(m.userId),
          name: m.fullName,
          email: m.email || "",
          githubUsername: m.githubUsername || "",
        }))
      : [];

    if (members.length === 0) {
      throw new Error("No group members found for analytics report.");
    }

    const memberLookup = new Map();
    (groupData?.members || []).forEach((member) => {
      const memberId = String(member?.userId || "").trim();
      if (!memberId) return;
      [
        member?.fullName,
        member?.email,
        member?.jiraAccountId,
        member?.githubUsername,
      ]
        .map(toKey)
        .filter(Boolean)
        .forEach((key) => memberLookup.set(key, memberId));
    });

    const memberIdByName = new Map(members.map((m) => [toKey(m.name), m.id]));
    const fallbackMemberId = members[0]?.id;
    const activities = recentActivitiesData?.content || [];

    const jiraIssues = activities
      .filter((activity) => isJiraActivity(activity))
      .map((activity, idx) => {
        const authorKey = toKey(activity?.author);
        const assigneeId =
          memberLookup.get(authorKey) || memberIdByName.get(authorKey) || fallbackMemberId;
        const createdAt = toIsoDate(activity?.occurredAt);
        const status = normalizeIssueStatus(activity?.status || activity?.type || activity?.title);
        return {
          id: String(activity?.externalId || activity?.activityId || `jira-${idx + 1}`),
          assigneeId: String(assigneeId || ""),
          status,
          createdAt,
          completedAt: status === "DONE" ? createdAt : null,
          dueDate: null,
        };
      })
      .filter((issue) => issue.assigneeId && issue.createdAt);

    const gitCommits = activities
      .filter((activity) => isGithubActivity(activity))
      .map((activity) => {
        const authorKey = toKey(activity?.author);
        const authorId =
          memberLookup.get(authorKey) || memberIdByName.get(authorKey) || fallbackMemberId;
        return {
          authorId: String(authorId || ""),
          message: String(activity?.title || activity?.type || "Git commit"),
          linesAdded: 0,
          linesDeleted: 0,
          timestamp: toIsoDate(activity?.occurredAt),
        };
      })
      .filter((commit) => commit.authorId && commit.timestamp);

    if (reportType === "WORK_DISTRIBUTION" && jiraIssues.length === 0) {
      throw new Error("No Jira activities found for this group. Please sync Jira data and try again.");
    }

    if (reportType === "COMMIT_ANALYSIS" && gitCommits.length === 0) {
      throw new Error("No GitHub commit activities found for this group. Please sync GitHub data and try again.");
    }

    return {
      projectConfigId: String(selectedConfig.id),
      groupId: String(selectedGroupNumber),
      timeRange: { from: "", to: "" },
      members,
      jiraIssues,
      gitCommits,
    };
  };

  const handleGenerate = async () => {
    if (!selectedConfig?.id) {
      setErrorMessage("Selected group does not have a project configuration.");
      return;
    }
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      if (reportType === "COMMIT_ANALYSIS") {
        const payload = buildAnalyticsPayload();
        await generateCommitAnalysisReport.mutateAsync(payload);
      } else if (reportType === "WORK_DISTRIBUTION") {
        const payload = buildAnalyticsPayload();
        await generateWorkDistributionReport.mutateAsync(payload);
      } else {
        await generateReport.mutateAsync({
          projectConfigId: String(selectedConfig.id),
          useAi,
          exportType,
        });
      }
      setSuccessMessage("Report generation started! It will appear in the list shortly.");
      setShowGenerateModal(false);
      setSelectedGroupId("");
      setReportType("SRS");
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

  const parseCreatedAt = (value) => {
    if (!value) return null;
    const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(value);
    const normalized = hasTimezone ? value : `${value}Z`;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = parseCreatedAt(dateStr);
    if (!date) return "-";
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
        </div>

        {/* Filter Bar */}
        <div className="chip-filter-row">
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
                      <td className="reports-report-cell">
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
                      <td className="reports-status-cell">
                        <span className={`reports-status-badge reports-status-${report.status?.toLowerCase()}`}>
                          <span className={report.status === "PROCESSING" ? "reports-spin" : ""}>
                            {getStatusIcon(report.status)}
                          </span>
                          {report.status}
                        </span>
                      </td>
                      <td className="reports-created-cell">
                        <div className="reports-created-main">
                          {formatDate(report.createdAt)}
                        </div>
                        {report.createdAt && (
                          <div className="reports-created-sub">
                            {parseCreatedAt(report.createdAt)?.toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }) || "-"}
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
              <h2 className="reports-modal-title">Generate Report</h2>
              <p className="reports-modal-subtitle">
                Create report from your project data
              </p>
            </div>

            <label className="modal-field">
              <span className="reports-field-title">Report Type</span>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="reports-select"
              >
                <option value="SRS">SRS</option>
                {canGenerateAnalytics && <option value="WORK_DISTRIBUTION">Jira Work Distribution (Excel)</option>}
                {canGenerateAnalytics && <option value="COMMIT_ANALYSIS">Commit Analysis (Excel)</option>}
              </select>
            </label>

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

            {reportType === "SRS" && (
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
            )}

            <div className="reports-modal-actions">
              <button
                className="primary-button secondary reports-modal-btn"
                onClick={() => {
                  setShowGenerateModal(false);
                  setSelectedGroupId("");
                  setReportType("SRS");
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
                  generateReport.isPending ||
                  generateWorkDistributionReport.isPending ||
                  generateCommitAnalysisReport.isPending
                }
              >
                {generateReport.isPending || generateWorkDistributionReport.isPending || generateCommitAnalysisReport.isPending
                  ? "Generating..."
                  : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
