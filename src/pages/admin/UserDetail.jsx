import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../../layout/DashboardLayout";
import { useAllGroups, useUser, useUserGroups } from "../../hooks/useUserGroups";
import { identityAdminApi } from "../../api/identityAdminApi";

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userIdNum = parseInt(userId, 10);

  const { data: user, isLoading, error, refetch } = useUser(userIdNum);
  const { data: userGroups, isLoading: groupsLoading } = useUserGroups(userIdNum);
  const viewedRole = String(user?.roles?.[0] || user?.role || "").toUpperCase();
  const isLecturerUser = viewedRole === "LECTURER";
  const { data: lecturerGroupsData, isLoading: lecturerGroupsLoading } = useAllGroups(
    {
      lecturerId: userIdNum,
      size: 100,
    },
    {
      enabled: isLecturerUser && Number.isFinite(userIdNum) && userIdNum > 0,
    }
  );

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // External accounts modal
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [externalForm, setExternalForm] = useState({
    jiraAccountId: "",
    githubUsername: "",
  });

  // Lock reason modal
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockReason, setLockReason] = useState("");

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const clearMessages = () => {
    setActionError(null);
    setActionSuccess(null);
  };

  const refreshData = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const handleLockUser = async () => {
    clearMessages();
    setActionLoading(true);
    try {
      await identityAdminApi.lockUser(userIdNum, lockReason || undefined);
      setActionSuccess("Account locked successfully.");
      setShowLockModal(false);
      setLockReason("");
      refreshData();
    } catch (err) {
      setActionError(err?.response?.data?.message || "Unable to lock account.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlockUser = async () => {
    clearMessages();
    setActionLoading(true);
    try {
      await identityAdminApi.unlockUser(userIdNum);
      setActionSuccess("Account unlocked successfully.");
      refreshData();
    } catch (err) {
      setActionError(err?.response?.data?.message || "Unable to unlock account.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    clearMessages();
    setActionLoading(true);
    try {
      await identityAdminApi.deleteUser(userIdNum);
      setActionSuccess("Account deleted successfully.");
      setShowDeleteModal(false);
      setTimeout(() => {
        navigate("/app/admin/users");
      }, 1500);
    } catch (err) {
      setActionError(err?.response?.data?.message || "Unable to delete account.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateExternalAccounts = async (e) => {
    e.preventDefault();
    clearMessages();
    setActionLoading(true);
    try {
      await identityAdminApi.updateExternalAccounts(userIdNum, {
        jiraAccountId: externalForm.jiraAccountId || null,
        githubUsername: externalForm.githubUsername || null,
      });
      setActionSuccess("External accounts updated successfully.");
      setShowExternalModal(false);
      refreshData();
    } catch (err) {
      setActionError(err?.response?.data?.message || "Unable to update external accounts.");
    } finally {
      setActionLoading(false);
    }
  };

  const openExternalModal = () => {
    setExternalForm({
      jiraAccountId: user?.jiraAccountId || "",
      githubUsername: user?.githubUsername || "",
    });
    setShowExternalModal(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel panel-center-lg">
            <p>Loading user information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel panel-center-lg">
            <h2 className="text-danger">User Not Found</h2>
            <p className="text-muted panel-mb-16">
              User ID: {userId} does not exist or has been deleted.
            </p>
            <button className="primary-button" onClick={() => navigate("/app/admin/users")}>
              Back to List
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusClass = user.status === "ACTIVE" ? "status-active" : "status-locked";
  const displayedGroups = isLecturerUser
    ? (lecturerGroupsData?.content || []).map((group) => ({
        groupId: group.id,
        groupName: group.groupName,
        semesterCode: group.semesterCode,
        role: "LECTURER",
        lecturerName: group.lecturerName,
      }))
    : (userGroups?.groups || []);
  const isGroupsLoading = isLecturerUser ? lecturerGroupsLoading : groupsLoading;

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        {/* Header */}
        <div className="admin-header-row">
          <div>
            <button
              className="back-button"
              onClick={() => navigate("/app/admin/users")}
            >
              ← Back
            </button>
            <h1 className="page-title page-title-mt-8">User Details</h1>
            <p className="page-subtitle">View and manage account information.</p>
          </div>
        </div>

        {/* Messages */}
        {actionSuccess && (
          <div className="alert alert-success">{actionSuccess}</div>
        )}
        {actionError && (
          <div className="alert alert-error">{actionError}</div>
        )}

        {/* User Info Panel */}
        <div className="user-detail-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Basic Information</h3>
              <span className={`status-pill ${statusClass}`}>{user.status}</span>
            </div>
            <div className="user-info-list">
              <div className="user-info-item">
                <span className="info-label">ID</span>
                <span className="info-value">{user.id}</span>
              </div>
              <div className="user-info-item">
                <span className="info-label">Full Name</span>
                <span className="info-value">{user.fullName}</span>
              </div>
              <div className="user-info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{user.email}</span>
              </div>
              <div className="user-info-item">
                <span className="info-label">Role</span>
                <span className="info-value">
                  <span className="badge-role">{user.roles?.[0] || user.role || "UNKNOWN"}</span>
                </span>
              </div>
              <div className="user-info-item">
                <span className="info-label">Created At</span>
                <span className="info-value">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US") : "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>External Accounts</h3>
              <button className="primary-button secondary" onClick={openExternalModal}>
                Update
              </button>
            </div>
            <div className="user-info-list">
              <div className="user-info-item">
                <span className="info-label">Jira Account ID</span>
                <span className="info-value">{user.jiraAccountId || "-"}</span>
              </div>
              <div className="user-info-item">
                <span className="info-label">GitHub Username</span>
                <span className="info-value">{user.githubUsername || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Groups */}
        <div className="panel panel-mt-16">
          <div className="panel-header">
            <h3>Groups</h3>
          </div>
          {isGroupsLoading ? (
            <p className="table-empty-cell text-muted">Loading...</p>
          ) : displayedGroups.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Semester</th>
                  <th>Role</th>
                  <th>Lecturer</th>
                </tr>
              </thead>
              <tbody>
                {displayedGroups.map((group) => (
                  <tr key={group.groupId}>
                    <td>{group.groupName}</td>
                    <td>{group.semesterCode}</td>
                    <td>
                      <span className={`status-pill ${group.role === "LEADER" ? "status-active" : "status-invited"}`}>
                        {group.role}
                      </span>
                    </td>
                    <td>{group.lecturerName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="table-empty-cell text-muted">
              {isLecturerUser ? "No groups assigned to this lecturer." : "No groups joined."}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="panel panel-mt-16">
          <div className="panel-header">
            <h3>Actions</h3>
          </div>
          <div className="action-buttons">
            {user.status === "ACTIVE" ? (
              <button
                className="action-button warning"
                onClick={() => setShowLockModal(true)}
                disabled={actionLoading}
              >
                Lock Account
              </button>
            ) : (
              <button
                className="action-button success"
                onClick={handleUnlockUser}
                disabled={actionLoading}
              >
                Unlock Account
              </button>
            )}
            <button
              className="action-button danger"
              onClick={() => setShowDeleteModal(true)}
              disabled={actionLoading}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Lock Modal */}
      {showLockModal && (
        <div className="modal-overlay" onClick={() => setShowLockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lock Account</h2>
              <button className="modal-close" onClick={() => setShowLockModal(false)}>×</button>
            </div>
            <div className="modal-form">
              <p className="text-muted panel-mb-16">
                Are you sure you want to lock the account <strong>{user.email}</strong>?
              </p>
              <label className="modal-field">
                <span>Reason (optional)</span>
                <input
                  type="text"
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Enter reason for locking..."
                />
              </label>
              <div className="modal-actions">
                <button
                  className="primary-button secondary"
                  onClick={() => setShowLockModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className="action-button warning"
                  onClick={handleLockUser}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Lock Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Account</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-form">
              <div className="delete-warning">
                <span className="warning-icon">⚠️</span>
                <p>
                  Are you sure you want to delete the account <strong>{user.email}</strong>?
                  <br />
                  <span className="text-danger">This action cannot be undone.</span>
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
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* External Accounts Modal */}
      {showExternalModal && (
        <div className="modal-overlay" onClick={() => setShowExternalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update External Accounts</h2>
              <button className="modal-close" onClick={() => setShowExternalModal(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleUpdateExternalAccounts}>
              <label className="modal-field">
                <span>Jira Account ID</span>
                <input
                  type="text"
                  value={externalForm.jiraAccountId}
                  onChange={(e) => setExternalForm({ ...externalForm, jiraAccountId: e.target.value })}
                  placeholder="Enter Jira Account ID..."
                />
              </label>
              <label className="modal-field">
                <span>GitHub Username</span>
                <input
                  type="text"
                  value={externalForm.githubUsername}
                  onChange={(e) => setExternalForm({ ...externalForm, githubUsername: e.target.value })}
                  placeholder="Enter GitHub username..."
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="primary-button secondary"
                  onClick={() => setShowExternalModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
