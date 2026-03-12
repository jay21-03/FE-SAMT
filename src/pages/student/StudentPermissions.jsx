import DashboardLayout from "../../layout/DashboardLayout";

const leaderPermissions = [
  "Cấu hình Project (Jira, GitHub) cho nhóm",
  "Thêm/xoá member trong nhóm (khi được giảng viên cho phép)",
  "Promote/Demote member giữa Leader/Member (tuỳ policy)",
  "Trigger đồng bộ dữ liệu (sync) khi Project Config đã VERIFIED",
];

const memberPermissions = [
  "Xem thông tin nhóm và cấu hình Project",
  "Xem task, tiến độ và thống kê GitHub của nhóm",
  "Nộp bài, push code theo quy ước repository",
  "Không thể chỉnh sửa cấu hình tích hợp hoặc vai trò thành viên khác",
];

export default function StudentPermissions() {
  const groupRole = localStorage.getItem("group_role") || "MEMBER";

  return (
    <DashboardLayout>
      <div className="student-dashboard">
        <div className="student-header">
          <div>
            <h1 className="page-title">Group Role & Permissions</h1>
            <p className="page-subtitle">
              Xem bạn đang là Leader hay Member, và những quyền tương ứng trong
              nhóm.
            </p>
          </div>
          <div>
            <span className="status-pill status-active">
              Current GroupRole: {groupRole}
            </span>
          </div>
        </div>

        <div className="admin-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Leader</h3>
            </div>
            <ul className="activity-list">
              {leaderPermissions.map((item) => (
                <li key={item} className="activity-item">
                  <div className="activity-main">{item}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Member</h3>
            </div>
            <ul className="activity-list">
              {memberPermissions.map((item) => (
                <li key={item} className="activity-item">
                  <div className="activity-main">{item}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

