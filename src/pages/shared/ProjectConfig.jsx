import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import {
  useCreateProjectConfig,
  useProjectConfigByGroup,
  useUpdateProjectConfig,
  useVerifyProjectConfig,
} from "../../hooks/useProjectConfigs";

export default function ProjectConfig() {
  const { groupId } = useParams();
  const groupIdNumber = Number(groupId);

  const { data, isLoading } = useProjectConfigByGroup(groupIdNumber);
  const createConfig = useCreateProjectConfig();
  const updateConfig = useUpdateProjectConfig();
  const verifyConfig = useVerifyProjectConfig();

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
    setOverrides((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!groupIdNumber) return;
    if (data?.data?.id) {
      const payload = toTrimmedPayload(overrides);
      if (Object.keys(payload).length === 0) return;
      await updateConfig.mutateAsync({ id: data.data.id, payload });
      return;
    }

    const payload = toTrimmedPayload(form);
    await createConfig.mutateAsync({
      groupId: groupIdNumber,
      ...payload,
    });
  };

  const handleVerify = async () => {
    if (!data?.data?.id) return;
    await verifyConfig.mutateAsync(data.data.id);
  };

  const stateLabel = data?.data?.state ?? "DRAFT";
  const isSaving = createConfig.isPending || updateConfig.isPending;

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Project Configuration</h1>
            <p className="page-subtitle">
              Kết nối Jira và GitHub cho nhóm của bạn.
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
                <span>Current State</span>
                <span className="status-pill status-pending">{stateLabel}</span>
              </div>
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
      </div>
    </DashboardLayout>
  );
}

