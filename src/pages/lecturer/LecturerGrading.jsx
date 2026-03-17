import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import { useGroupProgress } from "../../hooks/useReport";
import { useGroup, useGroups, useSemesters } from "../../hooks/useUserGroups";

export default function LecturerGrading() {
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // Fetch semesters
  const { data: semestersData } = useSemesters();
  const semesters = Array.isArray(semestersData) ? semestersData : [];

  // Fetch groups
  const { data: groupsData, isLoading: groupsLoading } = useGroups({
    page: 0,
    size: 100,
    semesterId: selectedSemester ? Number(selectedSemester) : undefined,
  });
  const groups = groupsData?.content || [];

  // Get active group
  const activeGroupId = selectedGroupId ? Number(selectedGroupId) : (groups[0]?.id || 0);
  const activeGroup = groups.find((g) => g.id === activeGroupId);

  // Fetch detailed group info for members with fullName/email - only if activeGroupId is valid
  const { data: groupDetail, isLoading: groupLoading } = useGroup(activeGroupId);
  const members = useMemo(() => {
    if (!groupDetail?.members) return [];
    return groupDetail.members.map((member) => ({
      userId: member.userId,
      fullName: member.fullName,
      email: member.email,
      role: member.role,
      joinedAt: null,
    }));
  }, [groupDetail]);

  // Fetch group progress for context - only if activeGroupId is valid
  const { data: progress } = useGroupProgress(activeGroupId);

  const isLoading = groupsLoading || groupLoading;

  const columns = [
    {
      key: "fullName",
      header: "Student",
      render: (row) => (
        <div>
          <span className="lecturer-student-name">{row.fullName}</span>
          <div className="lecturer-student-email">{row.email}</div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <span className={`lecturer-role-badge ${row.role === "LEADER" ? "leader" : "member"}`}>
          {row.role}
        </span>
      ),
    },
    {
      key: "joinedAt",
      header: "Joined",
      render: (row) => (
        <span className="text-muted-sm">
          {row.joinedAt
            ? new Date(row.joinedAt).toLocaleDateString("en-US")
            : "-"}
        </span>
      ),
    },
    {
      key: "grade",
      header: "Grade",
      render: () => (
        <span className="lecturer-grade-placeholder">
          Not available
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="lecturer-dashboard">
        <div className="lecturer-header">
          <div>
            <h1 className="page-title">Grading</h1>
            <p className="page-subtitle">
              View group members and track student contributions.
            </p>
          </div>
        </div>

        <div className="tab-row">
          <Link className="tab" to="/app/lecturer/groups/list">
            My Groups
          </Link>
          <Link className="tab" to="/app/lecturer/tasks">
            Tasks
          </Link>
          <Link className="tab" to="/app/lecturer/github-stats">
            GitHub Stats
          </Link>
          <Link className="tab tab-active" to="/app/lecturer/grading">
            Grading
          </Link>
        </div>

        {/* Filters */}
        <div className="panel panel-mt-16">
          <div className="panel-header">
            <h3>Select Group</h3>
          </div>
          <div className="lecturer-filters-row">
            <label className="modal-field lecturer-filter-semester">
              <span>Semester</span>
              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setSelectedGroupId("");
                }}
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.semesterCode} {s.isActive && "(Active)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field lecturer-filter-group">
              <span>Group</span>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                {groups.length === 0 ? (
                  <option value="">No groups</option>
                ) : (
                  groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.groupName}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>
        </div>

        {/* Group Progress Stats */}
        {progress && (
          <div className="lecturer-metrics-grid">
            <div className="stat-card lecturer-metrics-card">
              <div className="stat-value lecturer-metrics-value">
                {members.length}
              </div>
              <div className="stat-label">Members</div>
            </div>
            <div className="stat-card lecturer-metrics-card">
              <div className="stat-value lecturer-metrics-value lecturer-stat-completed">
                {progress.doneCount}
              </div>
              <div className="stat-label">Tasks Done</div>
            </div>
            <div className="stat-card lecturer-metrics-card">
              <div className="stat-value lecturer-metrics-value">
                {Math.round(progress.completionRate * 100)}%
              </div>
              <div className="stat-label">Completion</div>
            </div>
          </div>
        )}

        {/* Members Table */}
        <div className="panel panel-mt-16">
          <div className="panel-header">
            <h3>Group Members</h3>
            {activeGroup && (
              <span className="text-muted-sm">
                {activeGroup.groupName}
              </span>
            )}
          </div>
          <DataTable
            columns={columns}
            data={members}
            keyField="userId"
            loading={isLoading}
            emptyMessage={
              activeGroupId
                ? "No members found in this group."
                : "Please select a group to view members."
            }
          />
        </div>

        {/* Info Panel */}
        <div className="panel panel-mt-16">
          <div className="panel-header">
            <h3>About Grading</h3>
          </div>
          <div className="guideline-text">
            <div className="lecturer-note-box">
              <strong className="lecturer-note-title">Note:</strong> The grading feature is currently not available in the backend API.
              This page shows group members for reference.
            </div>
            <p>To evaluate students, consider:</p>
            <ul className="guideline-list panel-mt-16">
              <li><strong>Tasks:</strong> View task completion in the Tasks tab</li>
              <li><strong>GitHub Stats:</strong> Check commit and PR activity in GitHub Stats tab</li>
              <li><strong>Reports:</strong> Generate SRS reports to assess project documentation</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
