import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import {
  useCreateProjectConfig,
  useProjectConfigByGroup,
  useUpdateProjectConfig,
  useVerifyProjectConfig,
} from "../../hooks/useProjectConfigs";
import { useGroup } from "../../hooks/useUserGroups";
import { useSyncJira, useSyncGithub, useSyncAll, useSyncJobs } from "../../hooks/useSync";

export default function ProjectConfig() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const parsedGroupId = Number(groupId);
  const hasValidGroupId = Number.isInteger(parsedGroupId) && parsedGroupId > 0;
  const groupIdNumber = hasValidGroupId ? parsedGroupId : 0;
  const role = localStorage.getItem("role");

  const { data, isLoading } = useProjectConfigByGroup(groupIdNumber, { enabled: hasValidGroupId });
  const { data: group } = useGroup(groupIdNumber);
  const createConfig = useCreateProjectConfig();
  const updateConfig = useUpdateProjectConfig();
  const verifyConfig = useVerifyProjectConfig();

  // Sync hooks
  const syncJira = useSyncJira();
  const syncGithub = useSyncGithub();
  const syncAll = useSyncAll();

  // Get project config ID for sync
  const projectConfigId = data?.data?.id;

  // Fetch sync jobs for this project config
  const { data: syncJobsData, refetch: refetchSyncJobs } = useSyncJobs(
    projectConfigId ? { projectConfigId, page: 0, size: 5 } : undefined
  );

  // Sync state
  const [syncMessage, setSyncMessage] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const [overrides, setOverrides] = useState({
    jiraHostUrl: null,
    jiraEmail: null,
    jiraApiToken: null,
    githubRepoUrl: null,
    githubToken: null,
  });

  const form = useMemo(() => {
    return {
      jiraHostUrl: overrides.jiraHostUrl ?? data?.data?.jiraHostUrl ?? "",
      jiraEmail: overrides.jiraEmail ?? data?.data?.jiraEmail ?? "",
      jiraApiToken: overrides.jiraApiToken ?? data?.data?.jiraApiToken ?? "",
      githubRepoUrl: overrides.githubRepoUrl ?? data?.data?.githubRepoUrl ?? "",
      githubToken: overrides.githubToken ?? data?.data?.githubToken ?? "",
    };
  }, [
    data?.data?.githubRepoUrl,
    data?.data?.githubToken,
    data?.data?.jiraEmail,
    data?.data?.jiraApiToken,
    data?.data?.jiraHostUrl,
    overrides.githubRepoUrl,
    overrides.githubToken,
    overrides.jiraEmail,
    overrides.jiraApiToken,
    overrides.jiraHostUrl,
  ]);

  const toTrimmedPayload = (values) => {
    return Object.fromEntries(
      Object.entries(values)
        .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
        .filter(([, value]) => value !== "" && value !== null && value !== undefined),
    );
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setValidationError(null);
    setSaveError(null);
    setOverrides((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!hasValidGroupId) return;
    setValidationError(null);
    setSaveError(null);

    if (data?.data?.id) {
      const payload = toTrimmedPayload(overrides);
      if (Object.keys(payload).length === 0) {
        setValidationError("Please update at least one field before saving.");
        return;
      }
      try {
        await updateConfig.mutateAsync({ id: data.data.id, payload });
      } catch (err) {
        setSaveError(err?.response?.data?.message || "Unable to save configuration. Please try again.");
      }
      return;
    }

    const payload = toTrimmedPayload(form);
    if (Object.keys(payload).length === 0) {
      setValidationError("Please enter at least one field before saving.");
      return;
    }

    try {
      await createConfig.mutateAsync({
        groupId: groupIdNumber,
        ...payload,
      });
    } catch (err) {
      setSaveError(err?.response?.data?.message || "Unable to save configuration. Please try again.");
    }
  };

  const handleVerify = async () => {
    if (!data?.data?.id) return;
    await verifyConfig.mutateAsync(data.data.id);
  };

  // Sync handlers
  const handleSyncJira = async () => {
    if (!projectConfigId) return;
    setSyncMessage(null);
    setSyncError(null);
    try {
      const result = await syncJira.mutateAsync(projectConfigId);
      setSyncMessage(`Jira sync completed! ${result.recordsFetched} records fetched, ${result.recordsSaved} saved.`);
      refetchSyncJobs();
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err) {
      setSyncError(err?.response?.data?.message || "Jira sync failed. Please check your configuration.");
    }
  };

  const handleSyncGithub = async () => {
    if (!projectConfigId) return;
    setSyncMessage(null);
    setSyncError(null);
    try {
      const result = await syncGithub.mutateAsync(projectConfigId);
      setSyncMessage(`GitHub sync completed! ${result.recordsFetched} commits fetched, ${result.recordsSaved} saved.`);
      refetchSyncJobs();
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err) {
      setSyncError(err?.response?.data?.message || "GitHub sync failed. Please check your configuration.");
    }
  };

  const handleSyncAll = async () => {
    if (!projectConfigId) return;
    setSyncMessage(null);
    setSyncError(null);
    try {
      const result = await syncAll.mutateAsync(projectConfigId);
      const jiraInfo = `Jira: ${result.jira.recordsFetched}/${result.jira.recordsSaved}`;
      const githubInfo = `GitHub: ${result.github.recordsFetched}/${result.github.recordsSaved}`;
      setSyncMessage(`Full sync completed in ${result.durationMs}ms! ${jiraInfo}, ${githubInfo}`);
      refetchSyncJobs();
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err) {
      setSyncError(err?.response?.data?.message || "Sync failed. Please check your configuration.");
    }
  };

  const isSyncing = syncJira.isPending || syncGithub.isPending || syncAll.isPending;

  const stateLabel = data?.data?.state ?? "DRAFT";
  const isSaving = createConfig.isPending || updateConfig.isPending;
  
  const getStateClass = (state) => {
    switch (state) {
      case "VERIFIED": return "status-active";
      case "INVALID": return "status-locked";
      default: return "status-pending";
    }
  };

  const handleBack = () => {
    if (!hasValidGroupId) {
      navigate("/app/groups");
      return;
    }

    if (role === "ADMIN") {
      navigate("/app/admin/project-configs");
    } else {
      navigate(`/app/groups/${groupIdNumber}`);
    }
  };

  if (!hasValidGroupId) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel" style={{ padding: 40, textAlign: "center" }}>
            <h2 style={{ color: "#dc2626", marginBottom: 12 }}>Invalid Group</h2>
            <p style={{ color: "#6b7280", marginBottom: 20 }}>
              Missing or invalid group id in URL.
            </p>
            <button className="primary-button" onClick={() => navigate("/app/groups")}>Back to Groups</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <button className="back-button" onClick={handleBack}>
              ← Back
            </button>
            <h1 className="page-title" style={{ marginTop: 8 }}>
              Project Configuration
              {group && <span style={{ fontWeight: 400, color: "#6b7280" }}> - {group.groupName}</span>}
            </h1>
            <p className="page-subtitle">
              {group 
                ? `Semester: ${group.semesterCode} · Lecturer: ${group.lecturer?.fullName || "-"}`
                : "Connect Jira and GitHub for your group."
              }
            </p>
          </div>
        </div>

        <div className="admin-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Jira Settings</h3>
            </div>
            <div className="profile-form">
              <label>
                <span>Jira Host URL</span>
                <input
                  type="text"
                  value={form.jiraHostUrl}
                  onChange={handleChange("jiraHostUrl")}
                  placeholder="https://your-domain.atlassian.net"
                  disabled={isLoading}
                />
              </label>
              <label>
                <span>Jira Email</span>
                <input
                  type="email"
                  value={form.jiraEmail}
                  onChange={handleChange("jiraEmail")}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </label>
              <label>
                <span>Jira API Token</span>
                <input
                  type="password"
                  value={form.jiraApiToken}
                  onChange={handleChange("jiraApiToken")}
                  placeholder="jira_***"
                  disabled={isLoading}
                />
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>GitHub Settings</h3>
            </div>
            <div className="profile-form">
              <label>
                <span>GitHub Repo URL</span>
                <input
                  type="text"
                  value={form.githubRepoUrl}
                  onChange={handleChange("githubRepoUrl")}
                  placeholder="https://github.com/org/repo"
                  disabled={isLoading}
                />
              </label>
              <label>
                <span>GitHub Token</span>
                <input
                  type="password"
                  value={form.githubToken}
                  onChange={handleChange("githubToken")}
                  placeholder="ghp_***"
                  disabled={isLoading}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="admin-system-row" style={{ marginTop: 16 }}>
          <div className="panel">
            <div className="panel-header">
              <h3>Verification</h3>
            </div>
            <div className="profile-form">
              <div className="system-status-item">
                <span>Status</span>
                <span className={`status-pill ${getStateClass(stateLabel)}`}>{stateLabel}</span>
              </div>
              {validationError && <div className="alert alert-error">{validationError}</div>}
              {saveError && <div className="alert alert-error">{saveError}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="primary-button" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Config"}
                </button>
                <button
                  className="primary-button secondary"
                  onClick={handleVerify}
                  disabled={!data?.data?.id || verifyConfig.isPending}
                >
                  {verifyConfig.isPending ? "Verifying..." : "Verify Connection"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Panel - Only show if config is verified */}
        {stateLabel === "VERIFIED" && (
          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel-header">
              <h3>Data Synchronization</h3>
            </div>
            
            {/* Sync Messages */}
            {syncMessage && <div className="alert alert-success">{syncMessage}</div>}
            {syncError && <div className="alert alert-error">{syncError}</div>}

            <div className="profile-form">
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>
                Sync data from Jira and GitHub to keep your project metrics up-to-date.
              </p>
              
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="action-button"
                  onClick={handleSyncJira}
                  disabled={isSyncing}
                  style={{ background: "#0052cc", color: "white" }}
                >
                  {syncJira.isPending ? "Syncing Jira..." : "Sync Jira Issues"}
                </button>
                <button
                  className="action-button"
                  onClick={handleSyncGithub}
                  disabled={isSyncing}
                  style={{ background: "#24292e", color: "white" }}
                >
                  {syncGithub.isPending ? "Syncing GitHub..." : "Sync GitHub Commits"}
                </button>
                <button
                  className="primary-button"
                  onClick={handleSyncAll}
                  disabled={isSyncing}
                >
                  {syncAll.isPending ? "Syncing All..." : "Sync All"}
                </button>
              </div>
            </div>

            {/* Recent Sync Jobs */}
            {syncJobsData?.content?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#374151" }}>
                  Recent Sync Jobs
                </h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Records</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncJobsData.content.map((job) => (
                      <tr key={job.syncJobId}>
                        <td>
                          <span style={{ 
                            fontSize: 12, 
                            fontWeight: 500,
                            color: job.jobType === "JIRA_ISSUES" ? "#0052cc" : "#24292e"
                          }}>
                            {job.jobType === "JIRA_ISSUES" ? "Jira" : "GitHub"}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${
                            job.status === "COMPLETED" ? "status-active" :
                            job.status === "FAILED" ? "status-locked" :
                            job.status === "RUNNING" ? "status-pending" : "status-pending"
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "#6b7280" }}>
                          {job.recordsFetched ?? 0} / {job.recordsSaved ?? 0}
                        </td>
                        <td style={{ fontSize: 12, color: "#6b7280" }}>
                          {job.completedAt 
                            ? new Date(job.completedAt).toLocaleString("en-US", { 
                                dateStyle: "short", 
                                timeStyle: "short" 
                              })
                            : "-"
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Info Panel for non-verified configs */}
        {stateLabel !== "VERIFIED" && (
          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel-header">
              <h3>Data Synchronization</h3>
            </div>
            <div style={{ padding: "16px 0", color: "#6b7280", fontSize: 14 }}>
              <p style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                Configuration must be <strong>VERIFIED</strong> before you can sync data.
              </p>
              <p style={{ marginTop: 8 }}>
                Please save your configuration and click "Verify Connection" to test the credentials.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

