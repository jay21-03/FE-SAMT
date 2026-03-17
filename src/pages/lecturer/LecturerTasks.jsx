import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import { useRecentActivities, useGroupProgress } from "../../hooks/useReport";
import { useProfile } from "../../hooks/useAuth";
import { useSemesters, useUserGroups } from "../../hooks/useUserGroups";

export default function LecturerTasks() {
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const { data: profile } = useProfile();
  const currentUserId = Number(profile?.id || 0);

  // Fetch semesters
  const { data: semestersData } = useSemesters();
  const semesters = Array.isArray(semestersData) ? semestersData : [];

  // Fetch own groups for lecturer only
  const { data: userGroupsData, isLoading: groupsLoading } = useUserGroups(currentUserId);
  const groups = useMemo(() => {
    const memberships = userGroupsData?.groups || [];
    const semesterId = selectedSemester ? Number(selectedSemester) : undefined;
    const filtered = semesterId
      ? memberships.filter((group) => group.semesterId === semesterId)
      : memberships;

    return filtered.map((group) => ({
      id: group.groupId,
      groupName: group.groupName,
    }));
  }, [selectedSemester, userGroupsData]);

  // Get active group
  const activeGroupId = selectedGroupId ? Number(selectedGroupId) : (groups[0]?.id || 0);

  // Fetch group progress for stats - only if activeGroupId is valid
  const { data: progress } = useGroupProgress(activeGroupId);

  // Fetch recent activities (which includes Jira issues) - only if activeGroupId is valid
  const { data: activitiesData, isLoading: activitiesLoading } = useRecentActivities(
    activeGroupId,
    { source: sourceFilter, page, size: 20 }
  );

  const activities = activitiesData?.content || [];
  const totalPages = activitiesData?.totalPages || 0;
  const totalElements = activitiesData?.totalElements || 0;

  const isLoading = groupsLoading || activitiesLoading;

  const getTypeClass = (type) => {
    const normalized = type?.toLowerCase();
    if (normalized === "issue" || normalized === "task") return "issue";
    if (normalized === "commit") return "commit";
    if (normalized === "pull_request" || normalized === "pr") return "pr";
    return "default";
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
            className="lecturer-link lecturer-link-strong"
          >
            {row.title}
          </a>
          {row.externalId && (
            <div className="lecturer-activity-id">
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
        <span className={`lecturer-source-badge ${row.source === "JIRA" ? "jira" : "github"}`}>
          {row.source}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => {
        return (
          <span className={`lecturer-type-badge ${getTypeClass(row.type)}`}>
            {row.type}
          </span>
        );
      },
    },
    {
      key: "author",
      header: "Author",
      render: (row) => <span className="lecturer-author">{row.author}</span>,
    },
    {
      key: "occurredAt",
      header: "Time",
      render: (row) => (
        <span className="text-muted-sm">
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
        </div>

        {/* Stats from Progress */}
        {progress && (
          <div className="lecturer-metrics-grid">
            <div className="stat-card lecturer-metrics-card">
              <div className="stat-value lecturer-metrics-value lecturer-stat-todo">
                {progress.todoCount}
              </div>
              <div className="stat-label">To Do</div>
            </div>
            <div className="stat-card lecturer-metrics-card">
              <div className="stat-value lecturer-metrics-value lecturer-stat-pr">
                {progress.inProgressCount}
              </div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card lecturer-metrics-card">
              <div className="stat-value lecturer-metrics-value lecturer-stat-completed">
                {progress.doneCount}
              </div>
              <div className="stat-label">Done</div>
            </div>
            <div className="stat-card lecturer-metrics-card">
              <div className="stat-value lecturer-metrics-value">
                {Math.round(progress.completionRate * 100)}%
              </div>
              <div className="stat-label">Completion</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="panel panel-mt-16">
          <div className="panel-header">
            <h3>Filters</h3>
          </div>
          <div className="lecturer-filters-row">
            <label className="modal-field lecturer-filter-semester">
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
                    {s.semesterCode} {s.isActive && "(Active)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field lecturer-filter-group">
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
            <label className="modal-field field-reset">
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
        <div className="lecturer-results-info">
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
