import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../../layout/DashboardLayout";
import DebouncedSearchInput from "../../components/DebouncedSearchInput";
import { useGroup, useUserGroups, useUsers } from "../../hooks/useUserGroups";
import { useProfile } from "../../hooks/useAuth";
import { userGroupApi } from "../../api/userGroupApi";

export default function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const groupIdNumber = Number(groupId);
  const { data: profile } = useProfile();
  const role = profile?.role || profile?.roles?.[0] || null;
  const isAdmin = role === "ADMIN";
  const currentUserId = Number(profile?.id || 0);

  const [memberSearch, setMemberSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Delete Group Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: group, isLoading: groupLoading, refetch } = useGroup(groupIdNumber);
  const { data: membershipsData, isLoading: membershipsLoading } = useUserGroups(currentUserId);
  const canManageMembers = isAdmin || role === "LECTURER";
  const { data: studentsData } = useUsers(
    { role: "STUDENT", page: 0, size: 200 },
    { enabled: canManageMembers, retry: false }
  );

  const hasGroupAccess = useMemo(() => {
    if (isAdmin) return true;
    const groups = membershipsData?.groups || [];
    return groups.some((g) => g.groupId === groupIdNumber);
  }, [groupIdNumber, isAdmin, membershipsData]);

  const students = useMemo(() => studentsData?.content || [], [studentsData]);

  const memberRows = useMemo(() => {
    if (!group?.members?.length) return [];
    return group.members.map((member) => ({
      userId: member.userId,
      fullName: member.fullName,
      email: member.email,
      role: member.role,
    }));
  }, [group]);

  const filteredMembers = useMemo(() => {
    const keyword = memberSearch.trim().toLowerCase();
    if (!keyword) return memberRows;
    return memberRows.filter((member) => 
      member.fullName.toLowerCase().includes(keyword) ||
      (member.email && member.email.toLowerCase().includes(keyword))
    );
  }, [memberRows, memberSearch]);

  const availableStudents = useMemo(() => {
    const memberIds = new Set(memberRows.map((m) => m.userId));
    return students.filter((s) => !memberIds.has(s.id));
  }, [students, memberRows]);

  const clearMessages = () => {
    setActionError(null);
    setActionSuccess(null);
  };

  const refreshData = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["groups"] });
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    clearMessages();
    setActionLoading(true);
    try {
      await userGroupApi.addMember(groupIdNumber, { userId: parseInt(selectedUserId, 10) });
      setActionSuccess("Member added successfully.");
      setShowAddMemberModal(false);
      setSelectedUserId("");
      refreshData();
    } catch (err) {
      setActionError(err?.response?.data?.message || "Unable to add member.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this member from the group?")) return;
    clearMessages();
    setActionLoading(true);
    try {
      await userGroupApi.removeMember(groupIdNumber, userId);
      setActionSuccess("Member removed from group.");
      refreshData();
    } catch (err) {
      setActionError(err?.response?.data?.message || "Unable to remove member.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromote = async (userId) => {
    clearMessages();
    setActionLoading(true);
    try {
      await userGroupApi.promoteToLeader(groupIdNumber, userId);
      setActionSuccess("Member promoted to Leader.");
      refreshData();
    } catch (err) {
      setActionError(err?.response?.data?.message || "Unable to promote to Leader.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemote = async (userId) => {
    clearMessages();
    setActionLoading(true);
    try {
      await userGroupApi.demoteToMember(groupIdNumber, userId);
      setActionSuccess("Leader demoted to Member.");
      refreshData();
    } catch (err) {
      setActionError(err?.response?.data?.message || "Unable to demote to Member.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    clearMessages();
    setActionLoading(true);
    try {
      await userGroupApi.deleteGroup(groupIdNumber);
      setActionSuccess("Group deleted successfully.");
      setTimeout(() => {
        navigate("/app/groups");
      }, 1500);
    } catch (err) {
      setActionError(err?.response?.data?.message || "Unable to delete group. Group may still have members.");
      setShowDeleteModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  if (groupLoading) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel panel-center-lg">
            <p>Loading group information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin && membershipsLoading) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel panel-center-lg">
            <p>Checking access...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasGroupAccess) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel panel-center-lg">
            <h2 className="group-not-found-title">Access Denied</h2>
            <p className="group-not-found-text">You can only view groups assigned to you.</p>
            <button className="primary-button" onClick={() => navigate("/app/groups")}>Back to My Groups</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!group) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel panel-center-lg">
            <h2 className="group-not-found-title">Group Not Found</h2>
            <p className="group-not-found-text">
              Group ID: {groupId} does not exist or has been deleted.
            </p>
            <button className="primary-button" onClick={() => navigate("/app/groups")}>
              Back to List
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        {/* Header */}
        <div className="admin-header-row">
          <div>
            <button className="back-button" onClick={() => navigate("/app/groups")}>
              ← Back
            </button>
            <h1 className="page-title page-title-mt-8">{group.groupName}</h1>
            <p className="page-subtitle">
              Semester: {group.semesterCode} · Lecturer: {group.lecturer?.fullName || "-"}
            </p>
          </div>
        </div>

        {/* Messages */}
        {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
        {actionError && <div className="alert alert-error">{actionError}</div>}

        {/* Group Info */}
        <div className="user-detail-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Group Information</h3>
            </div>
            <div className="user-info-list">
              <div className="user-info-item">
                <span className="info-label">ID</span>
                <span className="info-value">{group.id}</span>
              </div>
              <div className="user-info-item">
                <span className="info-label">Group Name</span>
                <span className="info-value">{group.groupName}</span>
              </div>
              <div className="user-info-item">
                <span className="info-label">Semester</span>
                <span className="info-value">{group.semesterCode}</span>
              </div>
              <div className="user-info-item">
                <span className="info-label">Lecturer</span>
                <span className="info-value">
                  {group.lecturer?.fullName || "-"}
                  {group.lecturer?.email && (
                    <span className="group-lecturer-email">
                      ({group.lecturer.email})
                    </span>
                  )}
                </span>
              </div>
              <div className="user-info-item">
                <span className="info-label">Members</span>
                <span className="info-value">{group.memberCount || memberRows.length}</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Quick Links</h3>
            </div>
            <div className="profile-form group-links-form">
              <Link className="primary-button" to={`/app/groups/${groupIdNumber}/config`}>
                Project Config
              </Link>
              {isAdmin && (
                <button
                  className="action-button danger"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={actionLoading}
                >
                  Delete Group
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Members Panel */}
        <div className="panel panel-mt-16">
          <div className="panel-header">
            <h3>Members ({memberRows.length})</h3>
            {(isAdmin || role === "LECTURER") && (
              <button className="primary-button" onClick={() => setShowAddMemberModal(true)}>
                Add Member
              </button>
            )}
          </div>

          <div className="panel-mb-16">
            <DebouncedSearchInput
              placeholder="Search members..."
              onChange={(value) => setMemberSearch(value)}
            />
          </div>

          {filteredMembers.length === 0 ? (
            <p className="table-empty-cell text-muted">
              No members in this group.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  {(isAdmin || role === "LECTURER") && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.userId}>
                    <td>{member.fullName}</td>
                    <td>{member.email || "-"}</td>
                    <td>
                      <span className={`status-pill ${member.role === "LEADER" ? "status-active" : "status-invited"}`}>
                        {member.role}
                      </span>
                    </td>
                    {(isAdmin || role === "LECTURER") && (
                      <td>
                        <div className="flex-row-8">
                          {member.role === "MEMBER" ? (
                            <button
                              className="primary-button secondary compact-button"
                              onClick={() => handlePromote(member.userId)}
                              disabled={actionLoading}
                            >
                              Promote
                            </button>
                          ) : (
                            <button
                              className="primary-button secondary compact-button"
                              onClick={() => handleDemote(member.userId)}
                              disabled={actionLoading}
                            >
                              Demote
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              className="action-button danger compact-button"
                              onClick={() => handleRemoveMember(member.userId)}
                              disabled={actionLoading}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Member</h2>
              <button className="modal-close" onClick={() => setShowAddMemberModal(false)}>×</button>
            </div>
            <div className="modal-form">
              <label className="modal-field">
                <span>Select Student</span>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={actionLoading}
                >
                  <option value="">-- Select student --</option>
                  {availableStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} ({student.email})
                    </option>
                  ))}
                </select>
              </label>
              {availableStudents.length === 0 && (
                <p className="group-modal-note">
                  No available students to add to the group.
                </p>
              )}
              <div className="modal-actions">
                <button
                  className="primary-button secondary"
                  onClick={() => setShowAddMemberModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={handleAddMember}
                  disabled={actionLoading || !selectedUserId}
                >
                  {actionLoading ? "Adding..." : "Add Member"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Group</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-form">
              <div className="delete-warning">
                <span className="warning-icon">⚠️</span>
                <p>
                  Are you sure you want to delete the group <strong>{group.groupName}</strong>?
                  <br />
                  <span className="text-danger">
                    Group must have no members before it can be deleted.
                  </span>
                </p>
              </div>
              <div className="modal-actions">
                <button
                  className="primary-button secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className="action-button danger"
                  onClick={handleDeleteGroup}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

