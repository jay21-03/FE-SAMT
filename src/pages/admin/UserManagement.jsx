import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import DebouncedSearchInput from "../../components/DebouncedSearchInput";
import { useAllUsers, useUsers } from "../../hooks/useUserGroups";
import { useAuditRange } from "../../hooks/useIdentityAdmin";
import { identityAdminApi } from "../../api/identityAdminApi";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const pageSize = 20;
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  
  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

  // Restore User State
  const [restoreUserId, setRestoreUserId] = useState("");
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState(null);
  const [restoreSuccess, setRestoreSuccess] = useState(null);

  // Fetch deleted users from audit logs (last 90 days)
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    return {
      startDate: start.toISOString().slice(0, 19),
      endDate: end.toISOString().slice(0, 19),
    };
  };
  const dateRange = getDateRange();
  const { data: auditData, refetch: refetchAudit } = useAuditRange(
    { page: 0, size: 100, ...dateRange },
    activeTab === "deleted"
  );

  const { data, isLoading, refetch } = useUsers({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page,
    size: pageSize,
  });
  const keyword = search.trim().toLowerCase();
  const isSearchMode = keyword.length > 0;

  const { data: allUsersData, isFetching: isSearchingUsers } = useAllUsers(
    {
      status: statusFilter === "ALL" ? undefined : statusFilter,
      size: 100,
    },
    {
      enabled: activeTab === "active" && isSearchMode,
    },
  );

  // Password validation
  const passwordRules = [
    { label: "At least 8 characters", valid: createForm.password.length >= 8 },
    { label: "Has uppercase (A-Z)", valid: /[A-Z]/.test(createForm.password) },
    { label: "Has lowercase (a-z)", valid: /[a-z]/.test(createForm.password) },
    { label: "Has number (0-9)", valid: /[0-9]/.test(createForm.password) },
    { label: "Has special character", valid: /[^A-Za-z0-9]/.test(createForm.password) },
  ];
  const isPasswordValid = passwordRules.every((r) => r.valid);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!createForm.fullName.trim()) {
      setCreateError("Please enter full name.");
      return;
    }
    if (!createForm.email.trim()) {
      setCreateError("Please enter email.");
      return;
    }
    if (!isPasswordValid) {
      setCreateError("Password does not meet requirements.");
      return;
    }

    try {
      setCreateLoading(true);
      const result = await identityAdminApi.createUser({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      setCreateSuccess(`User created successfully: ${result.user?.email || createForm.email}`);
      setCreateForm({ fullName: "", email: "", password: "", role: "STUDENT" });
      
      // Refresh user list
      setPage(0);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      refetch();
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 2000);
    } catch (err) {
      console.error(err);
      const response = err?.response;
      if (response?.status === 409) {
        setCreateError("This email already exists.");
      } else if (response?.status === 400) {
        setCreateError(response?.data?.message || "Invalid data.");
      } else if (response?.status === 403) {
        setCreateError("You do not have permission to create users.");
      } else {
        setCreateError("Failed to create user. Please try again.");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setCreateForm({ fullName: "", email: "", password: "", role: "STUDENT" });
    setCreateError(null);
    setCreateSuccess(null);
  };

  // Get deleted users from audit logs (action = SOFT_DELETE, entityType = User)
  const deletedUsers = useMemo(() => {
    // Handle both wrapped (data.data.content) and unwrapped (data.content) responses
    const logs = auditData?.data?.content || auditData?.content || [];
    return logs
      .filter((log) => {
        const action = String(log?.action || "").toUpperCase();
        const entityType = String(log?.entityType || "").toUpperCase();
        return action === "SOFT_DELETE" && entityType === "USER";
      })
      .map((log) => ({
        id: log.entityId,
        deletedAt: log.timestamp,
        deletedBy: log.actorEmail || "SYSTEM",
      }));
  }, [auditData]);

  // Handle restore user
  const handleRestoreUser = async (userId) => {
    if (!userId) return;
    setRestoreError(null);
    setRestoreSuccess(null);
    setRestoreLoading(true);

    try {
      await identityAdminApi.restoreUser(userId);
      setRestoreSuccess(`User #${userId} restored successfully!`);
      setRestoreUserId("");
      
      // Refresh data
      setPage(0);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      refetch();
      refetchAudit();
      
      setTimeout(() => setRestoreSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      const response = err?.response;
      if (response?.status === 404) {
        setRestoreError(`User #${userId} not found.`);
      } else if (response?.status === 400) {
        setRestoreError(response?.data?.message || "User is not deleted or cannot be restored.");
      } else {
        setRestoreError("Failed to restore user. Please try again.");
      }
    } finally {
      setRestoreLoading(false);
    }
  };

  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "createdAt", header: "Created At" },
    {
      key: "role",
      header: "Role",
      render: (row) => <span className="badge-role">{row.role}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const statusClass = row.status === "ACTIVE" 
          ? "status-active" 
          : row.status === "LOCKED" 
            ? "status-locked" 
            : "status-pending";
        return <span className={`status-pill ${statusClass}`}>{row.status}</span>;
      },
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Link className="primary-button secondary" to={`/app/admin/users/${row.id}`}>
          View
        </Link>
      ),
    },
  ];

  const filteredRows = useMemo(() => {
    const sourceUsers = isSearchMode ? (allUsersData?.content || []) : (data?.content || []);
    if (!sourceUsers.length) return [];

    const mapped = sourceUsers.map((user) => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      createdAt: user.createdAt
        ? new Date(user.createdAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "-",
      role: user.roles?.[0] ?? "UNKNOWN",
      status: user.status ?? "UNKNOWN",
    }));
    if (!keyword) return mapped;
    return mapped.filter((user) =>
      user.name.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword),
    );
  }, [allUsersData, data, isSearchMode, keyword]);

  const rows = useMemo(() => {
    if (!isSearchMode) return filteredRows;
    const start = page * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, isSearchMode, page, pageSize]);

  const totalElements = isSearchMode ? filteredRows.length : (data?.totalElements || 0);
  const totalPages = isSearchMode
    ? Math.max(1, Math.ceil(totalElements / pageSize))
    : Math.max(1, data?.totalPages || 1);
  const loadingRows = isLoading || (isSearchMode && isSearchingUsers);

  const canGoPrev = page > 0;
  const canGoNext = page + 1 < totalPages;

  useEffect(() => {
    if (page > 0 && page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const goToPage = (rawValue) => {
    const parsed = parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) return;
    const nextPage = Math.min(Math.max(parsed, 1), totalPages) - 1;
    setPage(nextPage);
  };

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">
              Manage Admin, Lecturer, and Student accounts.
            </p>
          </div>
          <button className="primary-button" onClick={() => setShowCreateModal(true)}>
            Create User
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active Users ({data?.totalElements || 0})
          </button>
          <button
            className={`tab-button tab-danger ${activeTab === "deleted" ? "active" : ""}`}
            onClick={() => setActiveTab("deleted")}
          >
            Deleted Users ({deletedUsers.length})
          </button>
        </div>

        {/* Messages */}
        {restoreSuccess && <div className="alert alert-success">{restoreSuccess}</div>}
        {restoreError && <div className="alert alert-error">{restoreError}</div>}

        {activeTab === "active" ? (
          <>
            <div className="filter-row">
              <DebouncedSearchInput
                placeholder="Search by name or email..."
                onChange={(value) => {
                  setSearch(value);
                  setPage(0);
                }}
              />
              <select
                className="select-input"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="LOCKED">Locked</option>
              </select>
            </div>

            <DataTable
              columns={columns}
              data={rows}
              loading={loadingRows}
              emptyMessage="No users found."
            />

            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ color: "#6b7280", fontSize: 14 }}>
                Page {Math.min(page + 1, totalPages)} / {totalPages} ({totalElements} users)
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  className="primary-button secondary"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={!canGoPrev || loadingRows}
                >
                  Previous
                </button>

                <label style={{ color: "#6b7280", fontSize: 13 }}>Go to page</label>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={Math.min(page + 1, totalPages)}
                  onChange={(e) => goToPage(e.target.value)}
                  disabled={loadingRows}
                  style={{ width: 80 }}
                  className="select-input"
                />

                <button
                  className="primary-button secondary"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!canGoNext || loadingRows}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Restore by ID */}
            <div className="panel panel-mb-16">
              <div className="panel-header">
                <h3>Restore User by ID</h3>
              </div>
              <div className="flex-row-12-end py-12">
                <label className="modal-field field-flex-1">
                  <span>User ID</span>
                  <input
                    type="number"
                    value={restoreUserId}
                    onChange={(e) => setRestoreUserId(e.target.value)}
                    placeholder="Enter user ID to restore..."
                    disabled={restoreLoading}
                  />
                </label>
                <button
                  className="action-button success compact-button"
                  onClick={() => handleRestoreUser(parseInt(restoreUserId, 10))}
                  disabled={restoreLoading || !restoreUserId}
                >
                  {restoreLoading ? "Restoring..." : "Restore"}
                </button>
              </div>
              <p className="text-muted-sm">
                If you know the User ID, enter it above to restore. Otherwise, find the user in the list below.
              </p>
            </div>

            {/* Deleted Users List */}
            <div className="panel">
              <div className="panel-header">
                <h3>Recently Deleted Users</h3>
              </div>
              {deletedUsers.length === 0 ? (
                <p className="table-empty-cell text-muted">
                  No deleted users found in recent audit logs.
                </p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Deleted At</th>
                      <th>Deleted By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedUsers.map((user) => (
                      <tr key={`deleted-${user.id}-${user.deletedAt}`}>
                        <td className="text-mono-strong">#{user.id}</td>
                        <td>
                          {new Date(user.deletedAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td>{user.deletedBy}</td>
                        <td>
                          <button
                            className="action-button success compact-button"
                            onClick={() => handleRestoreUser(user.id)}
                            disabled={restoreLoading}
                          >
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Info */}
            <div className="panel panel-mt-16">
              <div className="panel-header">
                <h3>About Deleted Users</h3>
              </div>
              <div className="guideline-text">
                <ul className="guideline-list">
                  <li>Deleted users are <strong>soft-deleted</strong> in the database (not permanently removed).</li>
                  <li>The list above shows users deleted from <strong>audit logs</strong>.</li>
                  <li>Use the <strong>Restore</strong> button to reactivate a deleted user account.</li>
                  <li>If you know the User ID, you can restore directly using the input field above.</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New User</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            {createSuccess ? (
              <div className="modal-success">
                <div className="success-icon">✓</div>
                <p>{createSuccess}</p>
              </div>
            ) : (
              <form className="modal-form" onSubmit={handleCreateUser}>
                <label className="modal-field">
                  <span>Full Name</span>
                  <input
                    type="text"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    placeholder="Nguyen Van A"
                    disabled={createLoading}
                    required
                  />
                </label>

                <label className="modal-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="user@samt.edu.vn"
                    disabled={createLoading}
                    required
                  />
                </label>

                <label className="modal-field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="••••••••"
                    disabled={createLoading}
                    required
                  />
                </label>

                {createForm.password && (
                  <div className="password-rules">
                    {passwordRules.map((rule, index) => (
                      <div
                        key={index}
                        className={`password-rule ${rule.valid ? "valid" : "invalid"}`}
                      >
                        <span className="rule-icon">{rule.valid ? "✓" : "✗"}</span>
                        <span>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <label className="modal-field">
                  <span>Role</span>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    disabled={createLoading}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="LECTURER">Lecturer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </label>

                {createError && <div className="modal-error">{createError}</div>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="primary-button secondary"
                    onClick={closeModal}
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={createLoading || !isPasswordValid}
                  >
                    {createLoading ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

