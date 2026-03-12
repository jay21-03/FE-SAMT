import { useMemo, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import { useProfile, useUpdateProfile } from "../../hooks/useAuth";

export default function UserProfile() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [overrides, setOverrides] = useState({
    fullName: null,
    email: null,
  });

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
    await updateProfile.mutateAsync({
      fullName: form.fullName,
      email: form.email,
    });
  };

  const isSaving = updateProfile.isPending;

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
                <input
                  type="text"
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  placeholder="Your full name"
                  disabled={isLoading}
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="you@samt.edu.vn"
                  disabled={isLoading}
                />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="primary-button" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>External Accounts</h3>
            </div>
            <div className="profile-form">
              <label>
                <span>Jira ID</span>
                <input type="text" value={profile?.jiraAccountId ?? ""} disabled />
              </label>
              <label>
                <span>GitHub Username</span>
                <input type="text" value={profile?.githubUsername ?? ""} disabled />
              </label>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

