import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import { useSemesters } from "../../hooks/useUserGroups";
import { userGroupApi } from "../../api/userGroupApi";

export default function SemesterManagement() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useSemesters();

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    semesterCode: "",
    semesterName: "",
    startDate: "",
    endDate: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [editForm, setEditForm] = useState({
    semesterName: "",
    startDate: "",
    endDate: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const refreshData = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["semesters"] });
  };

  // Create Semester
  const handleCreateSemester = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!createForm.semesterCode.trim()) {
      setCreateError("Please enter semester code.");
      return;
    }
    if (!createForm.semesterName.trim()) {
      setCreateError("Please enter semester name.");
      return;
    }
    if (!createForm.startDate) {
      setCreateError("Please select start date.");
      return;
    }
    if (!createForm.endDate) {
      setCreateError("Please select end date.");
      return;
    }
    if (new Date(createForm.startDate) >= new Date(createForm.endDate)) {
      setCreateError("End date must be after start date.");
      return;
    }

    try {
      setCreateLoading(true);
      await userGroupApi.createSemester({
        semesterCode: createForm.semesterCode.trim(),
        semesterName: createForm.semesterName.trim(),
        startDate: createForm.startDate,
        endDate: createForm.endDate,
      });
      setCreateSuccess("Semester created successfully!");
      setCreateForm({ semesterCode: "", semesterName: "", startDate: "", endDate: "" });
      refreshData();

      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      const response = err?.response;
      if (response?.status === 409) {
        setCreateError("Semester code already exists.");
      } else if (response?.status === 400) {
        setCreateError(response?.data?.message || "Invalid data.");
      } else {
        setCreateError("Failed to create semester. Please try again.");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm({ semesterCode: "", semesterName: "", startDate: "", endDate: "" });
    setCreateError(null);
    setCreateSuccess(null);
  };

  // Edit Semester
  const openEditModal = (semester) => {
    setEditingSemester(semester);
    setEditForm({
      semesterName: semester.name,
      startDate: semester.startDate,
      endDate: semester.endDate,
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditSemester = async (e) => {
    e.preventDefault();
    setEditError(null);

    if (!editForm.semesterName.trim()) {
      setEditError("Please enter semester name.");
      return;
    }
    if (new Date(editForm.startDate) >= new Date(editForm.endDate)) {
      setEditError("End date must be after start date.");
      return;
    }

    try {
      setEditLoading(true);
      await userGroupApi.updateSemester(editingSemester.id, {
        semesterName: editForm.semesterName.trim(),
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      });
      setShowEditModal(false);
      setActionMessage({ type: "success", text: "Semester updated successfully!" });
      refreshData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setEditError(err?.response?.data?.message || "Update failed.");
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingSemester(null);
    setEditError(null);
  };

  // Activate Semester
  const handleActivateSemester = async (semesterId) => {
    if (!window.confirm("Are you sure you want to activate this semester? The current active semester will be deactivated.")) {
      return;
    }

    try {
      setActionLoading(true);
      await userGroupApi.activateSemester(semesterId);
      setActionMessage({ type: "success", text: "Semester activated successfully!" });
      refreshData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setActionMessage({ type: "error", text: err?.response?.data?.message || "Unable to activate semester." });
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: "code", header: "Code" },
    { key: "name", header: "Name" },
    { key: "startDate", header: "Start Date" },
    { key: "endDate", header: "End Date" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span className={`status-pill ${row.isActive ? "status-active" : "status-pending"}`}>
          {row.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="primary-button secondary"
            style={{ padding: "4px 10px", fontSize: 12 }}
            onClick={() => openEditModal(row)}
          >
            Edit
          </button>
          {!row.isActive && (
            <button
              className="action-button success"
              style={{ padding: "4px 10px", fontSize: 12 }}
              onClick={() => handleActivateSemester(row.id)}
              disabled={actionLoading}
            >
              Activate
            </button>
          )}
        </div>
      ),
    },
  ];

  const rows = useMemo(() => {
    if (!data) return [];
    return data.map((semester) => ({
      id: semester.id,
      code: semester.semesterCode,
      name: semester.semesterName,
      startDate: semester.startDate,
      endDate: semester.endDate,
      isActive: semester.isActive,
    }));
  }, [data]);

  // Sort: active first, then by startDate descending
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return new Date(b.startDate) - new Date(a.startDate);
    });
  }, [rows]);

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Semester Management</h1>
            <p className="page-subtitle">Manage the list of semesters in the system.</p>
          </div>
          <button className="primary-button" onClick={() => setShowCreateModal(true)}>
            Create Semester
          </button>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className={`alert ${actionMessage.type === "success" ? "alert-success" : "alert-error"}`}>
            {actionMessage.text}
          </div>
        )}

        <DataTable
          columns={columns}
          data={sortedRows}
          loading={isLoading}
          emptyMessage="No semesters found."
        />

        {/* Info Panel */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h3>Guidelines</h3>
          </div>
          <div style={{ padding: "12px 0", color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
            <ul style={{ marginLeft: 20 }}>
              <li><strong>Semester Code:</strong> Unique identifier for the semester (e.g., FA2024, SP2025)</li>
              <li><strong>Activate:</strong> Only one semester can be active at a time. When activating a new semester, the current active semester will be deactivated automatically.</li>
              <li><strong>Groups:</strong> Project groups will be assigned to specific semesters.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Semester</h2>
              <button className="modal-close" onClick={closeCreateModal}>×</button>
            </div>

            {createSuccess ? (
              <div className="modal-success">
                <div className="success-icon">✓</div>
                <p>{createSuccess}</p>
              </div>
            ) : (
              <form className="modal-form" onSubmit={handleCreateSemester}>
                <label className="modal-field">
                  <span>Semester Code</span>
                  <input
                    type="text"
                    value={createForm.semesterCode}
                    onChange={(e) => setCreateForm({ ...createForm, semesterCode: e.target.value })}
                    placeholder="e.g., FA2024, SP2025"
                    disabled={createLoading}
                    required
                  />
                </label>

                <label className="modal-field">
                  <span>Semester Name</span>
                  <input
                    type="text"
                    value={createForm.semesterName}
                    onChange={(e) => setCreateForm({ ...createForm, semesterName: e.target.value })}
                    placeholder="e.g., Fall 2024, Spring 2025"
                    disabled={createLoading}
                    required
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label className="modal-field">
                    <span>Start Date</span>
                    <input
                      type="date"
                      value={createForm.startDate}
                      onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                      disabled={createLoading}
                      required
                    />
                  </label>

                  <label className="modal-field">
                    <span>End Date</span>
                    <input
                      type="date"
                      value={createForm.endDate}
                      onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                      disabled={createLoading}
                      required
                    />
                  </label>
                </div>

                {createError && <div className="modal-error">{createError}</div>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="primary-button secondary"
                    onClick={closeCreateModal}
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={createLoading}
                  >
                    {createLoading ? "Creating..." : "Create Semester"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingSemester && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Semester</h2>
              <button className="modal-close" onClick={closeEditModal}>×</button>
            </div>

            <form className="modal-form" onSubmit={handleEditSemester}>
              <div className="user-info-item" style={{ marginBottom: 16, padding: "12px", background: "#f9fafb", borderRadius: 8 }}>
                <span className="info-label">Semester Code</span>
                <span className="info-value">{editingSemester.code}</span>
              </div>

              <label className="modal-field">
                <span>Semester Name</span>
                <input
                  type="text"
                  value={editForm.semesterName}
                  onChange={(e) => setEditForm({ ...editForm, semesterName: e.target.value })}
                  disabled={editLoading}
                  required
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label className="modal-field">
                  <span>Start Date</span>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    disabled={editLoading}
                    required
                  />
                </label>

                <label className="modal-field">
                  <span>End Date</span>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    disabled={editLoading}
                    required
                  />
                </label>
              </div>

              {editError && <div className="modal-error">{editError}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="primary-button secondary"
                  onClick={closeEditModal}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

