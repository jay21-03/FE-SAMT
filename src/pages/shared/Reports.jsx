import { useState, useMemo } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import { useReports, useGenerateReport, useDownloadReport } from "../../hooks/useReport";
import { useGroups } from "../../hooks/useUserGroups";
import { useProjectConfigByGroup } from "../../hooks/useProjectConfigs";

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
  const { data: groupsData } = useGroups({ page: 0, size: 100 });
  const { data: configData } = useProjectConfigByGroup(
    selectedGroupId ? Number(selectedGroupId) : 0
  );

  const generateReport = useGenerateReport();
  const downloadReport = useDownloadReport();

  const reports = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;
  const groups = groupsData?.data?.content || groupsData?.content || [];

  const completedCount = reports.filter((r) => r.status === "COMPLETED").length;
  const processingCount = reports.filter(
    (r) => r.status === "PROCESSING" || r.status === "PENDING"
  ).length;
  const failedCount = reports.filter((r) => r.status === "FAILED").length;

  const handleGenerate = async () => {
    if (!configData?.data?.id) {
      setErrorMessage("Selected group does not have a project configuration.");
      return;
    }
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await generateReport.mutateAsync({
        projectConfigId: configData.data.id,
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

  const getStatusStyle = (status) => {
    const styles = {
      COMPLETED: { bg: "#dcfce7", color: "#166534", icon: "✓" },
      FAILED: { bg: "#fee2e2", color: "#991b1b", icon: "✕" },
      PROCESSING: { bg: "#fef3c7", color: "#92400e", icon: "⟳" },
      PENDING: { bg: "#e0e7ff", color: "#3730a3", icon: "◷" },
    };
    return styles[status] || styles.PENDING;
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
          <button
            className="primary-button"
            onClick={() => setShowGenerateModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <span style={{ fontSize: 18 }}>+</span> Generate Report
          </button>
        </div>

        {/* Messages */}
        {successMessage && (
          <div
            style={{
              padding: "12px 16px",
              background: "#dcfce7",
              border: "1px solid #86efac",
              borderRadius: 8,
              color: "#166534",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>✓</span> {successMessage}
            <button
              onClick={() => setSuccessMessage(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        )}
        {errorMessage && (
          <div
            style={{
              padding: "12px 16px",
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              color: "#991b1b",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>!</span> {errorMessage}
            <button
              onClick={() => setErrorMessage(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 12,
              padding: 20,
              color: "white",
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 700 }}>{totalElements}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Total Reports</div>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
              borderRadius: 12,
              padding: 20,
              color: "white",
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 700 }}>{completedCount}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Completed</div>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              borderRadius: 12,
              padding: 20,
              color: "white",
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 700 }}>{processingCount}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Processing</div>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              borderRadius: 12,
              padding: 20,
              color: "white",
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 700 }}>{failedCount}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Failed</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
            padding: "12px 16px",
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        >
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Filter by Status:</span>
          {["", "COMPLETED", "PROCESSING", "PENDING", "FAILED"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(0);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                background: statusFilter === status ? "#3b82f6" : "#e2e8f0",
                color: statusFilter === status ? "white" : "#475569",
                transition: "all 0.2s",
              }}
            >
              {status || "All"}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            style={{
              marginLeft: "auto",
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              background: "white",
              cursor: "pointer",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Reports Table */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            overflow: "auto",
          }}
        >
          {isLoading || isFetching ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⟳</div>
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <h3 style={{ margin: "0 0 8px", color: "#334155" }}>No reports yet</h3>
              <p style={{ color: "#64748b", margin: 0 }}>
                Generate your first SRS report to get started
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", minWidth: 800, borderCollapse: "collapse", tableLayout: "fixed" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th
                    style={{
                      padding: "14px 20px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "1px solid #e2e8f0",
                      width: "45%",
                    }}
                  >
                    Report
                  </th>
                  <th
                    style={{
                      padding: "14px 20px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "1px solid #e2e8f0",
                      width: "15%",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "14px 20px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "1px solid #e2e8f0",
                      width: "20%",
                    }}
                  >
                    Created
                  </th>
                  <th
                    style={{
                      padding: "14px 20px",
                      textAlign: "right",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "1px solid #e2e8f0",
                      width: "20%",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, idx) => {
                  const statusStyle = getStatusStyle(report.status);
                  return (
                    <tr
                      key={report.reportId}
                      style={{
                        background: idx % 2 === 0 ? "white" : "#fafbfc",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#fafbfc")
                      }
                    >
                      <td style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              minWidth: 44,
                              borderRadius: 10,
                              background: "#f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 22,
                            }}
                          >
                            {getFileIcon(report.fileName)}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "#1e293b",
                                fontSize: 14,
                                marginBottom: 4,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={report.fileName}
                            >
                              {report.fileName || "Generating..."}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                fontSize: 12,
                                color: "#64748b",
                              }}
                            >
                              <span
                                style={{
                                  padding: "3px 8px",
                                  background: "#e0f2fe",
                                  color: "#0369a1",
                                  borderRadius: 4,
                                  fontWeight: 500,
                                  fontSize: 11,
                                }}
                              >
                                {report.type || "SRS"}
                              </span>
                              <span
                                style={{ fontFamily: "monospace", fontSize: 11, color: "#94a3b8" }}
                                title={report.reportId}
                              >
                                #{report.reportId?.substring(0, 8)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 14px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              animation:
                                report.status === "PROCESSING" ? "spin 1s linear infinite" : "none",
                            }}
                          >
                            {statusStyle.icon}
                          </span>
                          {report.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>
                          {formatDate(report.createdAt)}
                        </div>
                        {report.createdAt && (
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                            {new Date(report.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                          borderBottom: "1px solid #f1f5f9",
                          textAlign: "right",
                        }}
                      >
                        {report.status === "COMPLETED" ? (
                          <button
                            onClick={() => handleDownload(report.reportId)}
                            disabled={downloadReport.isPending}
                            style={{
                              padding: "10px 20px",
                              borderRadius: 8,
                              border: "none",
                              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                              color: "white",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              transition: "transform 0.2s, box-shadow 0.2s",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-1px)";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.4)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            ↓ Download
                          </button>
                        ) : report.status === "PROCESSING" || report.status === "PENDING" ? (
                          <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 500 }}>
                            Processing...
                          </span>
                        ) : (
                          <button
                            style={{
                              padding: "8px 16px",
                              borderRadius: 6,
                              border: "1px solid #fca5a5",
                              background: "#fef2f2",
                              color: "#dc2626",
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: "default",
                            }}
                          >
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderTop: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}
            >
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                Page {page + 1} of {totalPages} ({totalElements} total reports)
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: page === 0 ? "#f1f5f9" : "white",
                    cursor: page === 0 ? "not-allowed" : "pointer",
                    color: page === 0 ? "#94a3b8" : "#334155",
                    fontSize: 13,
                    fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: page >= totalPages - 1 ? "#f1f5f9" : "white",
                    cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                    color: page >= totalPages - 1 ? "#94a3b8" : "#334155",
                    fontSize: 13,
                    fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div
          style={{
            marginTop: 24,
            padding: 20,
            background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
            borderRadius: 12,
            border: "1px solid #bae6fd",
          }}
        >
          <h3 style={{ margin: "0 0 12px", color: "#0369a1", fontSize: 16 }}>
            About SRS Reports
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              fontSize: 13,
              color: "#0c4a6e",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <span>📊</span>
              <span>Reports are generated from synced Jira issues and GitHub commits</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span>🤖</span>
              <span>AI enhancement provides better descriptions and summaries</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span>📄</span>
              <span>Export formats: DOCX (Word) or PDF</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span>✓</span>
              <span>Ensure project config is verified before generating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowGenerateModal(false)}
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480, borderRadius: 16 }}
          >
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: 28,
                }}
              >
                📄
              </div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Generate SRS Report</h2>
              <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
                Create documentation from your project data
              </p>
            </div>

            <label className="modal-field">
              <span style={{ fontWeight: 500 }}>Select Group *</span>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                style={{ padding: "10px 12px", borderRadius: 8 }}
              >
                <option value="">Choose a group...</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.groupName} ({group.semesterCode})
                  </option>
                ))}
              </select>
            </label>

            {selectedGroupId && configData?.data?.id && (
              <div
                style={{
                  padding: 16,
                  background: configData.data.state === "VERIFIED" ? "#f0fdf4" : "#fefce8",
                  borderRadius: 10,
                  marginBottom: 16,
                  border: `1px solid ${
                    configData.data.state === "VERIFIED" ? "#86efac" : "#fde047"
                  }`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                      Project Configuration
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 13 }}>
                      {String(configData.data.id).substring(0, 12)}...
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: configData.data.state === "VERIFIED" ? "#dcfce7" : "#fef9c3",
                      color: configData.data.state === "VERIFIED" ? "#166534" : "#854d0e",
                    }}
                  >
                    {configData.data.state}
                  </span>
                </div>
              </div>
            )}

            {selectedGroupId && !configData?.data?.id && (
              <div
                style={{
                  padding: 16,
                  background: "#fef2f2",
                  borderRadius: 10,
                  marginBottom: 16,
                  border: "1px solid #fca5a5",
                  color: "#991b1b",
                  fontSize: 13,
                }}
              >
                ⚠️ This group does not have a project configuration. Please configure it first.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <label className="modal-field" style={{ margin: 0 }}>
                <span style={{ fontWeight: 500 }}>Export Format</span>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  style={{ padding: "10px 12px", borderRadius: 8 }}
                >
                  <option value="DOCX">📘 DOCX (Word)</option>
                  <option value="PDF">📕 PDF</option>
                </select>
              </label>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: useAi ? "#ede9fe" : "#f1f5f9",
                    borderRadius: 8,
                    cursor: "pointer",
                    border: useAi ? "1px solid #c4b5fd" : "1px solid #e2e8f0",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={useAi}
                    onChange={(e) => setUseAi(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "#7c3aed" }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 500, color: useAi ? "#5b21b6" : "#64748b" }}>
                    🤖 Use AI
                  </span>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                className="secondary-button"
                onClick={() => {
                  setShowGenerateModal(false);
                  setSelectedGroupId("");
                }}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8 }}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                onClick={handleGenerate}
                disabled={
                  !selectedGroupId ||
                  !configData?.data?.id ||
                  configData?.data?.state !== "VERIFIED" ||
                  generateReport.isPending
                }
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 8,
                  background:
                    !selectedGroupId ||
                    !configData?.data?.id ||
                    configData?.data?.state !== "VERIFIED"
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                }}
              >
                {generateReport.isPending ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </DashboardLayout>
  );
}
