import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../../layout/DashboardLayout";
import DebouncedSearchInput from "../../components/DebouncedSearchInput";
import { useGroup, useUserGroups } from "../../hooks/useUserGroups";
import { useProfile } from "../../hooks/useAuth";
import { userGroupApi } from "../../api/userGroupApi";
import { memberIntegrationApi } from "../../api/memberIntegrationApi";
import { canLecturerAccessGroup, canMemberAccessGroup, groupsHomePath, normalizeRole } from "../../utils/access";

export default function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const groupIdNumber = Number(groupId);
  const { data: profile } = useProfile();
  const role = normalizeRole(profile?.role || profile?.roles?.[0]);
  const isAdmin = role === "ADMIN";
  const currentUserId = Number(profile?.id || 0);
  const groupsHome = groupsHomePath(role);

  const [memberSearch, setMemberSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Integrations modal
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [integrationMember, setIntegrationMember] = useState(null);
  const [integrationForm, setIntegrationForm] = useState({ jiraAccountId: "", githubUsername: "" });
  const [integrationErrors, setIntegrationErrors] = useState({});
  const [integrationLoading, setIntegrationLoading] = useState(false);
  const [integrationLookupLoading, setIntegrationLookupLoading] = useState(false);
  const [integrationError, setIntegrationError] = useState(null);
  const [syncLoadingByUserId, setSyncLoadingByUserId] = useState({});

  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [memberIdInput, setMemberIdInput] = useState("");

  // Delete Group Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: group, isLoading: groupLoading, refetch } = useGroup(groupIdNumber);
  const { data: membershipsData, isLoading: membershipsLoading } = useUserGroups(currentUserId);
  const canManageMembers = isAdmin || role === "LECTURER";

  const hasGroupAccess = useMemo(() => {
    if (isAdmin) return true;
    if (role === "LECTURER") return canLecturerAccessGroup(group, currentUserId);
    return canMemberAccessGroup(membershipsData, groupIdNumber);
  }, [currentUserId, group, groupIdNumber, isAdmin, membershipsData, role]);

  const memberRows = useMemo(() => {
    if (!group?.members?.length) return [];
    return group.members.map((member) => ({
      userId: member.userId,
      fullName: member.fullName,
      email: member.email,
      role: member.role,
      jiraAccountId: member.jiraAccountId,
      githubUsername: member.githubUsername,
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

  const clearMessages = () => {
    setActionError(null);
    setActionSuccess(null);
  };

  const clearIntegrationMessages = () => {
    setIntegrationError(null);
    setIntegrationErrors({});
  };

  const refreshData = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["groups"] });
  };

  const canEditIntegrationsForUserId = (userId) => {
    if (!userId) return false;
    if (isAdmin || role === "LECTURER") return true;
    return Number(userId) === Number(currentUserId);
  };

  const openIntegrationModal = (member) => {
    clearMessages();
    clearIntegrationMessages();
    setIntegrationMember(member);
    setIntegrationForm({
      jiraAccountId: member?.jiraAccountId || "",
      githubUsername: member?.githubUsername || "",
    });
    setShowIntegrationModal(true);
  };

  const validateIntegrations = (values) => {
    const next = {};
    const jira = String(values?.jiraAccountId || "").trim();
    const github = String(values?.githubUsername || "").trim();

    if (!jira) {
      next.jiraAccountId = "Jira accountId is required.";
    } else if (jira.length < 5) {
      next.jiraAccountId = "Jira accountId must be at least 5 characters.";
    }

    if (github) {
      const re = /^[a-zA-Z0-9-]{1,39}$/;
      if (!re.test(github)) {
        next.githubUsername = "GitHub username is invalid (^[a-zA-Z0-9-]{1,39}$).";
      }
    }
    return next;
  };

  const handleSaveIntegrations = async (e) => {
    e.preventDefault();
    clearMessages();
    clearIntegrationMessages();

    const errs = validateIntegrations(integrationForm);
    if (Object.keys(errs).length) {
      setIntegrationErrors(errs);
      return;
    }
    if (!integrationMember?.userId) return;

    setIntegrationLoading(true);
    try {
      await memberIntegrationApi.updateMemberIntegrations(Number(integrationMember.userId), {
        jiraAccountId: integrationForm.jiraAccountId.trim(),
        githubUsername: integrationForm.githubUsername.trim() || undefined,
      });
      setActionSuccess("Integration info updated successfully.");
      setShowIntegrationModal(false);
      setIntegrationMember(null);
      refreshData();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 400) setIntegrationError("Validation error. Please check your input.");
      else if (status === 404) setIntegrationError("Member not found.");
      else setIntegrationError("Unable to update integration info.");
    } finally {
      setIntegrationLoading(false);
    }
  };

  const handleGetJiraFromEmail = async () => {
    clearIntegrationMessages();
    const email = integrationMember?.email;
    if (!email) {
      setIntegrationError("This member has no email to search on Jira.");
      return;
    }
    setIntegrationLookupLoading(true);
    try {
      const { accountId } = await memberIntegrationApi.getJiraAccountId(String(email));
      setIntegrationForm((prev) => ({ ...prev, jiraAccountId: accountId || "" }));
    } catch (err) {
      const status = err?.response?.status ?? err?.status;
      if (status === 404) setIntegrationError("No Jira user found with this email.");
      else if (status === 502) setIntegrationError("Jira service unavailable.");
      else setIntegrationError("Unable to fetch Jira accountId.");
    } finally {
      setIntegrationLookupLoading(false);
    }
  };

  const handleSyncJira = async (member) => {
    if (!member?.userId) return;
    clearMessages();
    const userId = Number(member.userId);
    setSyncLoadingByUserId((prev) => ({ ...prev, [userId]: true }));
    try {
      await memberIntegrationApi.syncJira(userId);
      setActionSuccess("Synced successfully.");
      refreshData();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) setActionError("User not found on Jira.");
      else if (status === 502) setActionError("Jira service unavailable.");
      else setActionError("Unable to sync Jira accountId.");
    } finally {
      setSyncLoadingByUserId((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleAddMember = async () => {
    const raw = String(memberIdInput || selectedUserId || "").trim();
    if (!raw) return;
    const userIdNum = Number.parseInt(raw, 10);
    if (!Number.isFinite(userIdNum) || userIdNum <= 0) {
      setActionError("Invalid member id. Please enter a positive number.");
      return;
    }
    clearMessages();
    setActionLoading(true);
    try {
      await userGroupApi.addMember(groupIdNumber, { userId: userIdNum });
      setActionSuccess("Member added successfully.");
      setShowAddMemberModal(false);
      setSelectedUserId("");
      setMemberIdInput("");
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

  if (!isAdmin && role !== "LECTURER" && membershipsLoading) {
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
            <button className="primary-button" onClick={() => navigate(groupsHome)}>Back to My Groups</button>
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
            <button className="primary-button" onClick={() => navigate(groupsHome)}>
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
            <button className="back-button" onClick={() => navigate(groupsHome)}>
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
                  <th>Jira Account ID</th>
                  <th>GitHub Username</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.userId}>
                    <td>{member.fullName}</td>
                    <td>{member.email || "-"}</td>
                    <td>{member.jiraAccountId || "-"}</td>
                    <td>{member.githubUsername || "-"}</td>
                    <td>
                      <span className={`status-pill ${member.role === "LEADER" ? "status-active" : "status-invited"}`}>
                        {member.role}
                      </span>
                    </td>
                    <td>
                      <div className="flex-row-8">
                        <button
                          className="primary-button secondary compact-button"
                          onClick={() => openIntegrationModal(member)}
                          disabled={actionLoading || !canEditIntegrationsForUserId(member.userId)}
                          title={!canEditIntegrationsForUserId(member.userId) ? "You don't have permission to edit this member." : undefined}
                        >
                          Edit Integration
                        </button>
                        <button
                          className="primary-button secondary compact-button"
                          onClick={() => handleSyncJira(member)}
                          disabled={actionLoading || !canEditIntegrationsForUserId(member.userId) || !!syncLoadingByUserId[Number(member.userId)]}
                          title={!canEditIntegrationsForUserId(member.userId) ? "You don't have permission to sync this member." : undefined}
                        >
                          {syncLoadingByUserId[Number(member.userId)] ? "Syncing..." : "Sync Jira"}
                        </button>

                        {(isAdmin || role === "LECTURER") && (
                          <>
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
                          </>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Integration Modal */}
      {showIntegrationModal && (
        <div className="modal-overlay" onClick={() => setShowIntegrationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Integration</h2>
              <button className="modal-close" onClick={() => setShowIntegrationModal(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSaveIntegrations}>
              {integrationError && <div className="alert alert-error">{integrationError}</div>}
              <div className="group-modal-note panel-mb-16">
                Member: <strong>{integrationMember?.fullName}</strong> {integrationMember?.email ? `(${integrationMember.email})` : ""}
              </div>
              <label className="modal-field">
                <span>Jira Account ID</span>
                <input
                  value={integrationForm.jiraAccountId}
                  onChange={(e) => setIntegrationForm((prev) => ({ ...prev, jiraAccountId: e.target.value }))}
                  disabled={integrationLoading}
                  placeholder="e.g. 5b10ac8d82e05b22cc7d4ef5"
                />
                {integrationErrors.jiraAccountId && <span className="field-error">{integrationErrors.jiraAccountId}</span>}
              </label>

              <label className="modal-field">
                <span>GitHub Username</span>
                <input
                  value={integrationForm.githubUsername}
                  onChange={(e) => setIntegrationForm((prev) => ({ ...prev, githubUsername: e.target.value }))}
                  disabled={integrationLoading}
                  placeholder="e.g. octocat"
                />
                {integrationErrors.githubUsername && <span className="field-error">{integrationErrors.githubUsername}</span>}
              </label>

              <div className="flex-row-8 panel-mb-16">
                <button
                  type="button"
                  className="primary-button secondary"
                  onClick={handleGetJiraFromEmail}
                  disabled={integrationLoading || integrationLookupLoading}
                >
                  {integrationLookupLoading ? "Looking up..." : "Get from email"}
                </button>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="primary-button secondary"
                  onClick={() => setShowIntegrationModal(false)}
                  disabled={integrationLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={integrationLoading}
                >
                  {integrationLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <span>Member ID</span>
                <input
                  value={memberIdInput}
                  onChange={(e) => setMemberIdInput(e.target.value)}
                  placeholder="e.g. 184678"
                  inputMode="numeric"
                  disabled={actionLoading}
                />
                <span className="field-hint">
                  Paste/enter the student id here (recommended). The student list dropdown was removed to avoid empty data when the API disallows listing users.
                </span>
              </label>
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
                  disabled={actionLoading || !(String(memberIdInput).trim() || selectedUserId)}
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

