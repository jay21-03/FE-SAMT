import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import { useProfile, useUpdateProfile } from "../../hooks/useAuth";

export default function UserProfile() {
  const navigate = useNavigate();
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();

  const [overrides, setOverrides] = useState({
    fullName: null,
    email: null,
  });
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard">
          <div className="panel" style={{ padding: 40, textAlign: "center" }}>
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
          <div className="panel" style={{ padding: 40, textAlign: "center" }}>
            <h2 style={{ color: "#dc2626", marginBottom: 16 }}>Failed to load profile</h2>
            <p style={{ color: "#6b7280", marginBottom: 20 }}>
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
            <p style={{ color: "#6b7280", fontSize: 12, marginTop: 12 }}>
              External accounts can only be updated by administrators.
            </p>
          </div>
        </div>

        {/* Editable Profile Form */}
        <div className="panel" style={{ marginTop: 16 }}>
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
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="primary-button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

