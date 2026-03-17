import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import DebouncedSearchInput from "../../components/DebouncedSearchInput";
import { useGroups, useSemesters, useUsers } from "../../hooks/useUserGroups";
import { useProfile } from "../../hooks/useAuth";
import { userGroupApi } from "../../api/userGroupApi";

export default function GroupList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const { data: profile } = useProfile();
  const role = profile?.role || profile?.roles?.[0] || null;

  // Create Group Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    groupName: "",
    semesterId: "",
    lecturerId: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

  const { data, isLoading, refetch } = useGroups({
    page: 0,
    size: 50,
    semesterId: semesterFilter ? parseInt(semesterFilter, 10) : undefined,
  });
  const { data: semesters } = useSemesters();
  const { data: lecturersData } = useUsers({ role: "LECTURER", page: 0, size: 100 });

  const lecturers = lecturersData?.content || [];

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!createForm.groupName.trim()) {
      setCreateError("Please enter group name.");
      return;
    }
    if (!createForm.semesterId) {
      setCreateError("Please select a semester.");
      return;
    }
    if (!createForm.lecturerId) {
      setCreateError("Please select a lecturer.");
      return;
    }

    try {
      setCreateLoading(true);
      await userGroupApi.createGroup({
        groupName: createForm.groupName.trim(),
        semesterId: parseInt(createForm.semesterId, 10),
        lecturerId: parseInt(createForm.lecturerId, 10),
      });
      setCreateSuccess("Group created successfully!");
      setCreateForm({ groupName: "", semesterId: "", lecturerId: "" });

      queryClient.invalidateQueries({ queryKey: ["groups"] });
      refetch();

      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      const response = err?.response;
      if (response?.status === 409) {
        setCreateError("Group name already exists in this semester.");
      } else if (response?.status === 400) {
        setCreateError(response?.data?.message || "Invalid data. Group name must follow format: SE1705-G1");
      } else {
        setCreateError("Failed to create group. Please try again.");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setCreateForm({ groupName: "", semesterId: "", lecturerId: "" });
    setCreateError(null);
    setCreateSuccess(null);
  };

  const columns = [
    { key: "name", header: "Group Name" },
    { key: "semester", header: "Semester" },
    { key: "lecturer", header: "Lecturer" },
    { key: "members", header: "Members" },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Link className="primary-button secondary" to={`/app/groups/${row.id}`}>
          View
        </Link>
      ),
    },
  ];

  const rows = useMemo(() => {
    if (!data?.content) return [];
    const keyword = search.trim().toLowerCase();
    const mapped = data.content.map((item) => ({
      id: item.id,
      name: item.groupName,
      semester: item.semesterCode,
      lecturer: item.lecturerName,
      members: item.memberCount,
    }));
    if (!keyword) return mapped;
    return mapped.filter((group) => group.name.toLowerCase().includes(keyword));
  }, [data, search]);

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Groups</h1>
            <p className="page-subtitle">
              List of project groups by semester and lecturer.
            </p>
          </div>
          {role === "ADMIN" && (
            <button className="primary-button" onClick={() => setShowCreateModal(true)}>
              Create Group
            </button>
          )}
        </div>

        <div className="filter-row filter-row-gap-12">
          <DebouncedSearchInput
            placeholder="Search group name..."
            onChange={(value) => setSearch(value)}
          />
          <select
            className="select-input"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
          >
            <option value="">All semesters</option>
            {semesters?.map((sem) => (
              <option key={sem.id} value={sem.id}>
                {sem.semesterCode} - {sem.semesterName}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          emptyMessage="No groups found."
        />
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Group</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            {createSuccess ? (
              <div className="modal-success">
                <div className="success-icon">✓</div>
                <p>{createSuccess}</p>
              </div>
            ) : (
              <form className="modal-form" onSubmit={handleCreateGroup}>
                <label className="modal-field">
                  <span>Group Name</span>
                  <input
                    type="text"
                    value={createForm.groupName}
                    onChange={(e) => setCreateForm({ ...createForm, groupName: e.target.value })}
                    placeholder="SE1705-G1"
                    disabled={createLoading}
                    required
                  />
                  <small className="text-muted-xs">
                    Format: [COURSE CODE][YEAR]-G[NUMBER] (e.g., SE1705-G1)
                  </small>
                </label>

                <label className="modal-field">
                  <span>Semester</span>
                  <select
                    value={createForm.semesterId}
                    onChange={(e) => setCreateForm({ ...createForm, semesterId: e.target.value })}
                    disabled={createLoading}
                    required
                  >
                    <option value="">-- Select semester --</option>
                    {semesters?.map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        {sem.semesterCode} - {sem.semesterName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="modal-field">
                  <span>Lecturer</span>
                  <select
                    value={createForm.lecturerId}
                    onChange={(e) => setCreateForm({ ...createForm, lecturerId: e.target.value })}
                    disabled={createLoading}
                    required
                  >
                    <option value="">-- Select lecturer --</option>
                    {lecturers.map((lec) => (
                      <option key={lec.id} value={lec.id}>
                        {lec.fullName} ({lec.email})
                      </option>
                    ))}
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
                    disabled={createLoading}
                  >
                    {createLoading ? "Creating..." : "Create Group"}
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

