import DashboardLayout from "../layout/DashboardLayout";

export default function ProjectConfig() {
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
                <input type="text" placeholder="https://your-domain.atlassian.net" />
              </label>
              <label>
                <span>Jira API Token</span>
                <input type="password" placeholder="jira_***" />
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
                <input type="text" placeholder="https://github.com/org/repo" />
              </label>
              <label>
                <span>GitHub Token</span>
                <input type="password" placeholder="ghp_***" />
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
                <span className="status-pill status-pending">DRAFT</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="primary-button">Save Config</button>
                <button className="primary-button secondary">Verify Connection</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

