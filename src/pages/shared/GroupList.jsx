import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import DebouncedSearchInput from "../../components/DebouncedSearchInput";
import { useGroups, useSemesters, useUsers } from "../../hooks/useUserGroups";
import { useProfile } from "../../hooks/useAuth";
import { useUserGroups } from "../../hooks/useUserGroups";
import { getAccessTokenUserId } from "../../utils/authToken";
import { userGroupApi } from "../../api/userGroupApi";

export default function GroupList() {
  const queryClient = useQueryClient();
  const pageSize = 20;
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const role = localStorage.getItem("role");
  const isStudent = role === "STUDENT";

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

  const { data, isLoading, refetch } = useGroups(
    {
      page,
      size: pageSize,
      semesterId: semesterFilter ? parseInt(semesterFilter, 10) : undefined,
    },
    { enabled: !isStudent }
  );
  const { data: semesters } = useSemesters();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const userId = getAccessTokenUserId() || profile?.id || 0;
  const { data: myGroupsData, isLoading: myGroupsLoading } = useUserGroups(userId);
  const { data: lecturersData } = useUsers(
    { role: "LECTURER", page: 0, size: 100 },
    { enabled: role === "ADMIN", retry: false }
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

      setPage(0);
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

  const studentFilteredRows = useMemo(() => {
    if (!isStudent) return [];
    const keyword = search.trim().toLowerCase();
    const semesterId = semesterFilter ? parseInt(semesterFilter, 10) : null;

    const mapped = (myGroupsData?.groups || []).map((item) => ({
      id: item.groupId,
      name: item.groupName,
      semester: item.semesterCode,
      lecturer: item.lecturerName,
      members: "-",
      semesterId: item.semesterId,
    }));

    return mapped.filter((group) => {
      const matchesSearch = !keyword || group.name.toLowerCase().includes(keyword);
      const matchesSemester = !semesterId || group.semesterId === semesterId;
      return matchesSearch && matchesSemester;
    });
  }, [isStudent, myGroupsData?.groups, search, semesterFilter]);

  const rows = useMemo(() => {
    if (isStudent) {
      const start = page * pageSize;
      return studentFilteredRows.slice(start, start + pageSize);
    }
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
  }, [isStudent, studentFilteredRows, page, data, search]);

  const totalPages = isStudent
    ? Math.max(1, Math.ceil(studentFilteredRows.length / pageSize))
    : Math.max(1, data?.totalPages || 1);
  const canGoPrev = page > 0;
  const canGoNext = page + 1 < totalPages;
  const tableLoading = isStudent ? profileLoading || myGroupsLoading : isLoading;

  useEffect(() => {
    if (tableLoading) return;

    if (isStudent) {
      if (page + 1 > totalPages) {
        setPage(Math.max(0, totalPages - 1));
      }
      return;
    }

    if (typeof data?.totalPages !== "number" || data.totalPages < 1) return;
    if (page >= data.totalPages) {
      setPage(Math.max(0, data.totalPages - 1));
    }
  }, [tableLoading, isStudent, page, totalPages, data?.totalPages]);

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

        <div className="filter-row" style={{ gap: 12 }}>
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
          loading={tableLoading}
          emptyMessage="No groups found."
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
            Page {Math.min(page + 1, totalPages)} / {totalPages}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="primary-button secondary"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!canGoPrev || tableLoading}
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
              disabled={tableLoading}
              style={{ width: 80 }}
              className="select-input"
            />

            <button
              className="primary-button secondary"
              onClick={() => setPage((p) => p + 1)}
              disabled={!canGoNext || tableLoading}
            >
              Next
            </button>
          </div>
        </div>
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
                  <small style={{ color: "#6b7280", fontSize: 11 }}>
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

