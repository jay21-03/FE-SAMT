import DashboardLayout from "../../layout/DashboardLayout";

export default function UserProfile() {
  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">User Profile</h1>
            <p className="page-subtitle">
              Cập nhật thông tin cá nhân và tài khoản tích hợp.
            </p>
          </div>
        </div>

        <div className="admin-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Basic Info</h3>
            </div>
            <div className="profile-form">
              <label>
                <span>Full Name</span>
                <input type="text" placeholder="Your full name" />
              </label>
              <label>
                <span>Email</span>
                <input type="email" placeholder="you@samt.edu.vn" disabled />
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>External Accounts</h3>
            </div>
            <div className="profile-form">
              <label>
                <span>Jira ID</span>
                <input type="text" placeholder="jira-user" disabled />
              </label>
              <label>
                <span>GitHub Username</span>
                <input type="text" placeholder="github-user" disabled />
              </label>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

