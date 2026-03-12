import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import DebouncedSearchInput from "../../components/DebouncedSearchInput";
import { useGroup, useGroupMembers } from "../../hooks/useUserGroups";

export default function GroupDetails() {
  const { groupId } = useParams();
  const groupIdNumber = Number(groupId);
  const [memberSearch, setMemberSearch] = useState("");

  const { data: group, isLoading: groupLoading } = useGroup(groupIdNumber);
  const { data: members, isLoading: membersLoading } = useGroupMembers(groupIdNumber);

  const memberRows = useMemo(() => {
    if (group?.members?.length) {
      return group.members.map((member) => ({
        userId: member.userId,
        fullName: member.fullName,
        role: member.role,
      }));
    }
    if (!members) return [];
    return members.map((member) => ({
      userId: member.userId,
      fullName: `User ${member.userId}`,
      role: member.groupRole,
    }));
  }, [group, members]);

  const filteredMembers = useMemo(() => {
    const keyword = memberSearch.trim().toLowerCase();
    if (!keyword) return memberRows;
    return memberRows.filter((member) => member.fullName.toLowerCase().includes(keyword));
  }, [memberRows, memberSearch]);

  const groupTitle = group?.groupName ?? "Group Details";
  const groupSubtitle = group
    ? `Semester ${group.semesterCode} · ${group.lecturer?.fullName ?? ""}`
    : "Thành viên, vai trò và cấu hình dự án của nhóm.";

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">{groupTitle}</h1>
            <p className="page-subtitle">{groupSubtitle}</p>
          </div>
        </div>

        <div className="admin-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Members</h3>
            </div>

            <div className="members-header">
              <DebouncedSearchInput
                placeholder="Search members..."
                onChange={(value) => setMemberSearch(value)}
              />
              <button className="primary-button">Add Member</button>
            </div>

            <ul className="activity-list">
              {groupLoading || membersLoading ? (
                <li className="activity-item">
                  <div className="activity-main">Loading...</div>
                </li>
              ) : filteredMembers.length === 0 ? (
                <li className="activity-item">
                  <div className="activity-main">Chưa có thành viên.</div>
                </li>
              ) : (
                filteredMembers.map((member) => (
                  <li key={member.userId} className="activity-item">
                    <div className="activity-main">{member.fullName}</div>
                    <div className="activity-meta">{member.role}</div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Shortcuts</h3>
            </div>
            <div className="profile-form">
              <Link className="primary-button" to={`/app/groups/${groupIdNumber}/config`}>
                Open Project Config
              </Link>
              <button className="primary-button secondary">View GitHub Repo</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

