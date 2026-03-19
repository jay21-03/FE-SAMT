import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../../layout/DashboardLayout";
import { useProfile, useUpdateProfile } from "../../hooks/useAuth";
import { memberIntegrationApi } from "../../api/memberIntegrationApi";
import { queryKeys } from "../../hooks/queryKeys";

export default function UserProfile() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();

  const [overrides, setOverrides] = useState({
    fullName: null,
    email: null,
  });
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // External accounts modal (self-service)
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [externalForm, setExternalForm] = useState({ jiraAccountId: "", githubUsername: "" });
  const [externalErrors, setExternalErrors] = useState({});
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalLookupLoading, setExternalLookupLoading] = useState(false);
  const [externalError, setExternalError] = useState(null);

  const form = useMemo(() => {
    return {
      fullName: overrides.fullName ?? profile?.fullName ?? "",
      email: overrides.email ?? profile?.email ?? "",
    };
  }, [overrides.email, overrides.fullName, profile?.email, profile?.fullName]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setOverrides((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!form.fullName.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }
    if (!form.email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
      });
      setSuccessMessage("Profile updated successfully!");
      setOverrides({ fullName: null, email: null });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const response = err?.response;
      if (response?.status === 409) {
        setErrorMessage("This email is already in use.");
      } else if (response?.status === 400) {
        setErrorMessage(response?.data?.message || "Invalid data.");
      } else {
        setErrorMessage("Failed to update profile. Please try again.");
      }
    }
  };

  const isSaving = updateProfile.isPending;

  const getStatusClass = (status) => {
    return status === "ACTIVE" ? "status-active" : "status-locked";
  };

  const clearExternalMessages = () => {
    setExternalError(null);
    setExternalErrors({});
  };

  const openExternalModal = () => {
    clearExternalMessages();
    setExternalForm({
      jiraAccountId: profile?.jiraAccountId || "",
      githubUsername: profile?.githubUsername || "",
    });
    setShowExternalModal(true);
  };

  const validateExternal = (values) => {
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

  const handleSaveExternal = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    clearExternalMessages();

    const errs = validateExternal(externalForm);
    if (Object.keys(errs).length) {
      setExternalErrors(errs);
      return;
    }

    const memberId = Number(profile?.id || 0);
    if (!memberId) return;

    setExternalLoading(true);
    try {
      await memberIntegrationApi.updateMemberIntegrations(memberId, {
        jiraAccountId: externalForm.jiraAccountId.trim(),
        githubUsername: externalForm.githubUsername.trim() || undefined,
      });
      setShowExternalModal(false);
      setSuccessMessage("External accounts updated successfully.");
      qc.invalidateQueries({ queryKey: queryKeys.authSession });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) setExternalError("Unauthorized. Please log in again.");
      else if (status === 400) setExternalError("Validation error. Please check your input.");
      else if (status === 404) setExternalError("Member not found.");
      else if (status === 502) setExternalError("Jira service unavailable.");
      else setExternalError("Failed to update external accounts. Please try again.");
    } finally {
      setExternalLoading(false);
    }
  };

  const handleGetFromEmail = async () => {
    clearExternalMessages();
    const email = String(profile?.email || "").trim();
    if (!email) {
      setExternalError("Missing email to search on Jira.");
      return;
    }
    setExternalLookupLoading(true);
    try {
      const { accountId } = await memberIntegrationApi.getJiraAccountId(email);
      setExternalForm((prev) => ({ ...prev, jiraAccountId: accountId || "" }));
    } catch (err) {
      const status = err?.response?.status ?? err?.status;
      if (status === 401) setExternalError("Unauthorized. Please log in again.");
      else if (status === 404) setExternalError("No Jira user found with this email.");
      else if (status === 502) setExternalError("Jira service unavailable.");
      else setExternalError("Unable to fetch Jira accountId.");
    } finally {
      setExternalLookupLoading(false);
    }
  };

  const handleSyncJira = async () => {
    clearExternalMessages();
    const memberId = Number(profile?.id || 0);
    if (!memberId) return;
    setExternalLookupLoading(true);
    try {
      const updated = await memberIntegrationApi.syncJira(memberId);
      setExternalForm((prev) => ({ ...prev, jiraAccountId: updated?.jiraAccountId || prev.jiraAccountId }));
      qc.invalidateQueries({ queryKey: queryKeys.authSession });
      setSuccessMessage("Synced successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) setExternalError("Unauthorized. Please log in again.");
      else if (status === 404) setExternalError("User not found on Jira.");
      else if (status === 502) setExternalError("Jira service unavailable.");
      else setExternalError("Unable to sync Jira accountId.");
    } finally {
      setExternalLookupLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel panel-center-lg">
            <p>Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel panel-center-lg">
            <h2 className="text-danger">Failed to load profile</h2>
            <p className="text-muted panel-mb-16">
              Please try again or contact support.
            </p>
            <button className="primary-button" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">
              View and update your personal information.
            </p>
          </div>
        </div>

        {/* Messages */}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

        <div className="user-detail-grid">
          {/* Account Info - Read Only */}
          <div className="panel">
            <div className="panel-header">
              <h3>Account Info</h3>
              <span className={`status-pill ${getStatusClass(profile.status)}`}>
                {profile.status}
              </span>
            </div>
            <div className="user-info-list">
              <div className="user-info-item">
                <span className="info-label">User ID</span>
                <span className="info-value">{profile.id}</span>
              </div>
              <div className="user-info-item">
                <span className="info-label">Role</span>
                <span className="info-value">
                  <span className="badge-role">{profile.role || profile.roles?.[0] || "UNKNOWN"}</span>
                </span>
              </div>
              <div className="user-info-item">
                <span className="info-label">Member Since</span>
                <span className="info-value">
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US") : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* External Accounts - Read Only */}
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
                <span className="info-value">{profile.jiraAccountId || "Not linked"}</span>
              </div>
              <div className="user-info-item">
                <span className="info-label">GitHub Username</span>
                <span className="info-value">{profile.githubUsername || "Not linked"}</span>
              </div>
            </div>
            <p className="text-muted-sm panel-mt-16">You can link your Jira/GitHub accounts here.</p>
          </div>
        </div>

        {/* Editable Profile Form */}
        <div className="panel panel-mt-16">
          <div className="panel-header">
            <h3>Edit Profile</h3>
          </div>
          <div className="profile-form">
            <label>
              <span>Full Name</span>
              <input
                type="text"
                value={form.fullName}
                onChange={handleChange("fullName")}
                placeholder="Your full name"
                disabled={isSaving}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="you@samt.edu.vn"
                disabled={isSaving}
              />
            </label>
            <div className="profile-action-row">
              <button className="primary-button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* External Accounts Modal */}
      {showExternalModal && (
        <div className="modal-overlay" onClick={() => setShowExternalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update External Accounts</h2>
              <button className="modal-close" onClick={() => setShowExternalModal(false)}>
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSaveExternal}>
              {externalError && <div className="alert alert-error">{externalError}</div>}

              <label className="modal-field">
                <span>Jira Account ID</span>
                <input
                  value={externalForm.jiraAccountId}
                  onChange={(e) => setExternalForm((prev) => ({ ...prev, jiraAccountId: e.target.value }))}
                  disabled={externalLoading}
                  placeholder="e.g. 5b10ac8d82e05b22cc7d4ef5"
                />
                {externalErrors.jiraAccountId && <span className="field-error">{externalErrors.jiraAccountId}</span>}
              </label>

              <label className="modal-field">
                <span>GitHub Username</span>
                <input
                  value={externalForm.githubUsername}
                  onChange={(e) => setExternalForm((prev) => ({ ...prev, githubUsername: e.target.value }))}
                  disabled={externalLoading}
                  placeholder="e.g. octocat"
                />
                {externalErrors.githubUsername && <span className="field-error">{externalErrors.githubUsername}</span>}
              </label>

              <div className="flex-row-8 panel-mb-16">
                <button
                  type="button"
                  className="primary-button secondary"
                  onClick={handleGetFromEmail}
                  disabled={externalLoading || externalLookupLoading}
                >
                  {externalLookupLoading ? "Looking up..." : "Get from email"}
                </button>
                <button
                  type="button"
                  className="primary-button secondary"
                  onClick={handleSyncJira}
                  disabled={externalLoading || externalLookupLoading}
                >
                  {externalLookupLoading ? "Syncing..." : "Sync Jira"}
                </button>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="primary-button secondary"
                  onClick={() => setShowExternalModal(false)}
                  disabled={externalLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={externalLoading}>
                  {externalLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

