import DashboardLayout from "../layout/DashboardLayout";

export default function SystemConfig() {
  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">System Configuration</h1>
            <p className="page-subtitle">
              Cấu hình tích hợp Jira, GitHub và các tham số hệ thống SAMT.
            </p>
          </div>
        </div>

        <div className="admin-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>API Integrations</h3>
            </div>
            <div className="profile-form">
              <label>
                <span>Jira API Endpoint</span>
                <input type="text" placeholder="https://gateway/api/jira" />
              </label>
              <label>
                <span>GitHub API Endpoint</span>
                <input type="text" placeholder="https://gateway/api/github" />
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Security</h3>
            </div>
            <div className="profile-form">
              <label>
                <span>Access Token TTL (minutes)</span>
                <input type="number" placeholder="15" />
              </label>
              <label>
                <span>Refresh Token TTL (days)</span>
                <input type="number" placeholder="7" />
              </label>
            </div>
          </div>
        </div>

        <div className="admin-system-row" style={{ marginTop: 16 }}>
          <div className="panel">
            <div className="panel-header">
              <h3>Save Configuration</h3>
            </div>
            <div className="profile-form">
              <div className="system-status-item">
                <span>Last updated</span>
                <span>Not saved yet</span>
              </div>
              <button className="primary-button">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

