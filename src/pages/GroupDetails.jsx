import DashboardLayout from "../layout/DashboardLayout";
import DebouncedSearchInput from "../components/DebouncedSearchInput";

export default function GroupDetails() {
  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Group Details</h1>
            <p className="page-subtitle">
              Thành viên, vai trò và cấu hình dự án của nhóm.
            </p>
          </div>
        </div>

        <div className="admin-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Members</h3>
            </div>

            <div className="members-header">
              <DebouncedSearchInput placeholder="Search student to add..." />
              <button className="primary-button">Add Member</button>
            </div>

            <ul className="activity-list">
              <li className="activity-item">
                <div className="activity-main">Nguyễn Văn A</div>
                <div className="activity-meta">Leader</div>
              </li>
            </ul>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Shortcuts</h3>
            </div>
            <div className="profile-form">
              <button className="primary-button">Open Project Config</button>
              <button className="primary-button secondary">View GitHub Repo</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

