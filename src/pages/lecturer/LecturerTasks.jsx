import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import { useRecentActivities, useGroupProgress } from "../../hooks/useReport";
import { useGroups, useSemesters } from "../../hooks/useUserGroups";

export default function LecturerTasks() {
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [page, setPage] = useState(0);

  // Fetch semesters
  const { data: semestersData } = useSemesters();
  const semesters = semestersData?.data?.content || semestersData?.content || semestersData || [];

  // Fetch groups
  const { data: groupsData, isLoading: groupsLoading } = useGroups({
    page: 0,
    size: 100,
    semesterId: selectedSemester || undefined,
  });
  const groups = groupsData?.data?.content || groupsData?.content || [];

  // Get active group
  const activeGroupId = selectedGroupId ? Number(selectedGroupId) : groups[0]?.id || 0;

  // Fetch group progress for stats
  const { data: progress } = useGroupProgress(activeGroupId);

  // Fetch recent activities (which includes Jira issues)
  const { data: activitiesData, isLoading: activitiesLoading } = useRecentActivities(
    activeGroupId,
    { source: sourceFilter, page, size: 20 }
  );

  const activities = activitiesData?.content || [];
  const totalPages = activitiesData?.totalPages || 0;
  const totalElements = activitiesData?.totalElements || 0;

  const isLoading = groupsLoading || activitiesLoading;

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "issue":
      case "task":
        return { bg: "#e6f0ff", color: "#0052cc" };
      case "commit":
        return { bg: "#f0fdf4", color: "#059669" };
      case "pull_request":
      case "pr":
        return { bg: "#faf5ff", color: "#7c3aed" };
      default:
        return { bg: "#f3f4f6", color: "#374151" };
    }
  };

  const columns = [
    {
      key: "title",
      header: "Activity",
      render: (row) => (
        <div>
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0066cc", textDecoration: "none", fontWeight: 500 }}
          >
            {row.title}
          </a>
          {row.externalId && (
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
              {row.externalId}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (row) => (
        <span
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 4,
            background: row.source === "JIRA" ? "#e6f0ff" : "#f0f0f0",
            color: row.source === "JIRA" ? "#0052cc" : "#24292e",
          }}
        >
          {row.source}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => {
        const colors = getTypeColor(row.type);
        return (
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 4,
              background: colors.bg,
              color: colors.color,
            }}
          >
            {row.type}
          </span>
        );
      },
    },
    {
      key: "author",
      header: "Author",
      render: (row) => <span style={{ fontSize: 13 }}>{row.author}</span>,
    },
    {
      key: "occurredAt",
      header: "Time",
      render: (row) => (
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {row.occurredAt
            ? new Date(row.occurredAt).toLocaleString("en-US", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "-"}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="lecturer-dashboard">
        <div className="lecturer-header">
          <div>
            <h1 className="page-title">Tasks & Activities</h1>
            <p className="page-subtitle">
              View Jira issues, GitHub commits and pull requests from your groups.
            </p>
          </div>
        </div>

        <div className="tab-row">
          <Link className="tab" to="/app/lecturer/groups/list">
            My Groups
          </Link>
          <Link className="tab tab-active" to="/app/lecturer/tasks">
            Tasks
          </Link>
          <Link className="tab" to="/app/lecturer/github-stats">
            GitHub Stats
          </Link>
          <Link className="tab" to="/app/lecturer/grading">
            Grading
          </Link>
        </div>

        {/* Stats from Progress */}
        {progress && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginTop: 16 }}>
            <div className="stat-card" style={{ padding: 12, textAlign: "center" }}>
              <div className="stat-value" style={{ fontSize: 24, color: "#f59e0b" }}>
                {progress.todoCount}
              </div>
              <div className="stat-label">To Do</div>
            </div>
            <div className="stat-card" style={{ padding: 12, textAlign: "center" }}>
              <div className="stat-value" style={{ fontSize: 24, color: "#3b82f6" }}>
                {progress.inProgressCount}
              </div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card" style={{ padding: 12, textAlign: "center" }}>
              <div className="stat-value" style={{ fontSize: 24, color: "#10b981" }}>
                {progress.doneCount}
              </div>
              <div className="stat-label">Done</div>
            </div>
            <div className="stat-card" style={{ padding: 12, textAlign: "center" }}>
              <div className="stat-value" style={{ fontSize: 24 }}>
                {Math.round(progress.completionRate * 100)}%
              </div>
              <div className="stat-label">Completion</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h3>Filters</h3>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "12px 0" }}>
            <label className="modal-field" style={{ margin: 0, minWidth: 150 }}>
              <span>Semester</span>
              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setSelectedGroupId("");
                  setPage(0);
                }}
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code || s.semesterCode} {s.active && "(Active)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field" style={{ margin: 0, minWidth: 200 }}>
              <span>Group</span>
              <select
                value={selectedGroupId}
                onChange={(e) => {
                  setSelectedGroupId(e.target.value);
                  setPage(0);
                }}
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
            <label className="modal-field" style={{ margin: 0 }}>
              <span>Source</span>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option value="ALL">All Sources</option>
                <option value="JIRA">Jira Only</option>
                <option value="GITHUB">GitHub Only</option>
              </select>
            </label>
          </div>
        </div>

        {/* Results Info */}
        <div style={{ marginTop: 16, marginBottom: 8, color: "#6b7280", fontSize: 13 }}>
          {totalElements > 0
            ? `Showing ${page * 20 + 1}-${Math.min((page + 1) * 20, totalElements)} of ${totalElements} activities`
            : "No activities found"}
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={activities}
          keyField="activityId"
          loading={isLoading}
          emptyMessage={
            activeGroupId
              ? "No activities found. Make sure data is synced."
              : "Please select a group to view activities."
          }
          pagination={{
            page,
            totalPages,
            onPageChange: setPage,
          }}
        />
      </div>
    </DashboardLayout>
  );
}
