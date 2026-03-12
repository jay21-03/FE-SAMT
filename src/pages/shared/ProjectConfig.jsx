import { useEffect, useState } from "react";
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

  const [form, setForm] = useState({
    jiraHostUrl: "",
    jiraApiToken: "",
    githubRepoUrl: "",
    githubToken: "",
  });

  useEffect(() => {
    if (!data?.data) return;
    setForm({
      jiraHostUrl: data.data.jiraHostUrl ?? "",
      jiraApiToken: data.data.jiraApiToken ?? "",
      githubRepoUrl: data.data.githubRepoUrl ?? "",
      githubToken: data.data.githubToken ?? "",
    });
  }, [data]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!groupIdNumber) return;
    if (data?.data?.id) {
      await updateConfig.mutateAsync({ id: data.data.id, payload: form });
      return;
    }

    await createConfig.mutateAsync({
      groupId: groupIdNumber,
      ...form,
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

