import { useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import { useProfile } from "../../hooks/useAuth";
import { useUserGroups } from "../../hooks/useUserGroups";
import { getAccessTokenUserId } from "../../utils/authToken";

const leaderPermissions = [
  "Cấu hình Project (Jira, GitHub) cho nhóm",
  "Lưu, verify và trigger sync khi cấu hình Project hợp lệ",
  "Điều phối công việc nội bộ của nhóm theo vai trò leader",
  "Trigger đồng bộ dữ liệu (sync) khi Project Config đã VERIFIED",
];

const memberPermissions = [
  "Xem thông tin nhóm và cấu hình Project",
  "Xem task, tiến độ và thống kê GitHub của nhóm",
  "Nộp bài, push code theo quy ước repository",
  "Không thể chỉnh sửa cấu hình tích hợp (chỉ ADMIN hoặc LEADER)",
  "Không thể thêm/xoá hoặc đổi vai trò thành viên nhóm",
];

export default function StudentPermissions() {
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const { data: profile, isLoading: profileLoading } = useProfile();
  const userId = getAccessTokenUserId() || profile?.id || 0;
  const { data: membershipsData, isLoading: membershipsLoading } = useUserGroups(userId);

  const memberships = membershipsData?.groups || [];
  const currentMembership = selectedGroupId
    ? memberships.find((item) => item.groupId === Number(selectedGroupId))
    : memberships[0];
  const currentRole = currentMembership?.role || "MEMBER";
  const isLeader = currentRole === "LEADER";
  const isLoading = profileLoading || membershipsLoading;

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
            <span className={`status-pill ${isLeader ? "status-active" : "status-pending"}`}>
              Current GroupRole: {currentRole}
            </span>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h3>Current Group</h3>
          </div>
          {isLoading ? (
            <div style={{ color: "#6b7280", fontSize: 13 }}>Loading your groups...</div>
          ) : memberships.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: 13 }}>
              Bạn chưa thuộc nhóm nào trong học kỳ hiện tại.
            </div>
          ) : (
            <label className="modal-field" style={{ maxWidth: 420 }}>
              <span>Group</span>
              <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
                {memberships.map((item) => (
                  <option key={item.groupId} value={item.groupId}>
                    {item.groupName} ({item.semesterCode}) · {item.role}
                  </option>
                ))}
              </select>
            </label>
          )}
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

