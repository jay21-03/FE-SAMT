import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import DebouncedSearchInput from "../../components/DebouncedSearchInput";
import { useGroups, useSemesters, useUserGroups, useUsers } from "../../hooks/useUserGroups";
import { useProfile } from "../../hooks/useAuth";
import { userGroupApi } from "../../api/userGroupApi";
import { normalizeRole } from "../../utils/access";

export default function GroupList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [page, setPage] = useState(0);
  const { data: profile } = useProfile();
  const role = normalizeRole(profile?.role || profile?.roles?.[0]);
  const currentUserId = Number(profile?.id || 0);
  const isStudent = role === "STUDENT";
  const isLecturer = role === "LECTURER";
  const isAdmin = role === "ADMIN";

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

  const { data, isLoading: groupsLoading, refetch } = useGroups(
    {
      page,
      size: 50,
      semesterId: semesterFilter ? parseInt(semesterFilter, 10) : undefined,
      lecturerId: isLecturer ? currentUserId : undefined,
    },
    { enabled: isAdmin || isLecturer }
  );
  const { data: userGroupsData, isLoading: userGroupsLoading } = useUserGroups(currentUserId);
  const { data: semesters } = useSemesters();
  const { data: lecturersData } = useUsers(
    { role: "LECTURER", page: 0, size: 100 },
    { enabled: isAdmin, retry: false }
  );

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
    const sourceGroups = isStudent ? (userGroupsData?.groups || []) : (data?.content || []);
    const keyword = search.trim().toLowerCase();
    const semesterId = semesterFilter ? parseInt(semesterFilter, 10) : null;
    const mapped = sourceGroups
      .map((item) => ({
        id: item.id ?? item.groupId,
        name: item.groupName,
        semester: item.semesterCode,
        semesterId: item.semesterId,
        lecturer: item.lecturerName || "-",
        members: item.memberCount ?? "-",
      }))
      .filter((group) => (semesterId ? group.semesterId === semesterId : true));

    if (!keyword) return mapped;
    return mapped.filter((group) => group.name.toLowerCase().includes(keyword));
  }, [data, isStudent, search, semesterFilter, userGroupsData]);

  const isLoading = isStudent ? userGroupsLoading : groupsLoading;
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const isPaged = !isStudent;

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
            onChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
          />
          <select
            className="select-input"
            value={semesterFilter}
            onChange={(e) => {
              setSemesterFilter(e.target.value);
              setPage(0);
            }}
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

        {isPaged && totalPages > 1 && (
          <div className="reports-pagination" style={{ marginTop: 16 }}>
            <span className="reports-pagination-text">
              Page {page + 1} of {totalPages} ({totalElements} total groups)
            </span>
            <div className="reports-pagination-actions">
              <button
                className="primary-button secondary compact-button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                ← Previous
              </button>
              <button
                className="primary-button secondary compact-button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next →
              </button>
            </div>
          </div>
        )}
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

