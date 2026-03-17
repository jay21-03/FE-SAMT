import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import DebouncedSearchInput from "../../components/DebouncedSearchInput";
import { useGroups, useSemesters } from "../../hooks/useUserGroups";
import { useAuditRange } from "../../hooks/useIdentityAdmin";
import { useRestoreProjectConfig } from "../../hooks/useProjectConfigs";

export default function ProjectConfigList() {
  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  // Restore state
  const [restoreConfigId, setRestoreConfigId] = useState("");
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(null);
  const [restoreError, setRestoreError] = useState(null);

  const restoreConfig = useRestoreProjectConfig();

  // Fetch audit logs to find deleted configs (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const auditQuery = {
    startDate: ninetyDaysAgo.toISOString(),
    endDate: new Date().toISOString(),
    page: 0,
    size: 100,
  };
  const { data: auditData, refetch: refetchAudit } = useAuditRange(auditQuery, activeTab === "deleted");

  // Extract deleted configs from audit logs
  const deletedConfigs = useMemo(() => {
    const logs = auditData?.data?.content || auditData?.content || [];
    return logs
      .filter((log) => log.action === "SOFT_DELETE" && log.entityType === "ProjectConfig")
      .map((log) => ({
        id: log.entityId,
        deletedAt: log.timestamp,
        deletedBy: log.actorEmail || `User #${log.actorId}`,
      }));
  }, [auditData]);

  // Handle restore
  const handleRestoreConfig = async (configId) => {
    if (!configId) return;
    setRestoreLoading(true);
    setRestoreSuccess(null);
    setRestoreError(null);

    try {
      await restoreConfig.mutateAsync(configId);
      setRestoreSuccess(`Project config "${configId}" restored successfully!`);
      setRestoreConfigId("");
      refetchAudit();
      setTimeout(() => setRestoreSuccess(null), 5000);
    } catch (err) {
      setRestoreError(
        err?.response?.data?.message || "Failed to restore config. It may not exist or is not deleted."
      );
    } finally {
      setRestoreLoading(false);
    }
  };

  const { data: groupsData, isLoading } = useGroups({
    page: 0,
    size: 100,
    semesterId: semesterFilter ? parseInt(semesterFilter, 10) : undefined,
  });
  const { data: semesters } = useSemesters();

  const columns = [
    { key: "groupName", header: "Group" },
    { key: "semester", header: "Semester" },
    { key: "lecturer", header: "Lecturer" },
    { key: "members", header: "Members" },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Link
          className="primary-button secondary"
          to={`/app/groups/${row.id}/config`}
        >
          Configure
        </Link>
      ),
    },
  ];

  const rows = useMemo(() => {
    if (!groupsData?.content) return [];
    const keyword = search.trim().toLowerCase();
    const mapped = groupsData.content.map((group) => ({
      id: group.id,
      groupName: group.groupName,
      semester: group.semesterCode,
      lecturer: group.lecturerName,
      members: group.memberCount,
    }));
    if (!keyword) return mapped;
    return mapped.filter(
      (row) =>
        row.groupName.toLowerCase().includes(keyword) ||
        row.lecturer.toLowerCase().includes(keyword)
    );
  }, [groupsData, search]);

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Project Configurations</h1>
            <p className="page-subtitle">
              Manage Jira and GitHub configurations for project groups.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active Groups ({rows.length})
          </button>
          <button
            className={`tab-button tab-danger ${activeTab === "deleted" ? "active" : ""}`}
            onClick={() => setActiveTab("deleted")}
          >
            Deleted Configs ({deletedConfigs.length})
          </button>
        </div>

        {/* Messages */}
        {restoreSuccess && <div className="alert alert-success">{restoreSuccess}</div>}
        {restoreError && <div className="alert alert-error">{restoreError}</div>}

        {activeTab === "active" ? (
          <>
            {/* Active Configs Tab */}
            <div className="filter-row filter-row-gap-12">
              <DebouncedSearchInput
                placeholder="Search group or lecturer..."
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

            <div className="panel panel-mt-16">
              <div className="panel-header">
                <h3>Guidelines</h3>
              </div>
              <div className="guideline-text">
                <p><strong>Project Configuration</strong> allows connecting groups with Jira and GitHub:</p>
                <ul className="guideline-list panel-mt-16">
                  <li><strong>Jira:</strong> Host URL, Email, API Token to sync issues and sprints</li>
                  <li><strong>GitHub:</strong> Repository URL, Personal Access Token to sync commits and PRs</li>
                </ul>
                <p className="panel-mt-16">
                  Click <strong>"Configure"</strong> to set up or edit configuration for each group.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Deleted Configs Tab */}
            <div className="panel panel-mb-16">
              <div className="panel-header">
                <h3>Restore Config by ID</h3>
              </div>
              <div className="flex-row-12-end py-12">
                <label className="modal-field field-flex-1">
                  <span>Config ID (UUID)</span>
                  <input
                    type="text"
                    value={restoreConfigId}
                    onChange={(e) => setRestoreConfigId(e.target.value)}
                    placeholder="e.g., 5f2c5d35-431f-4a59-8168-88ff3c42649e"
                    disabled={restoreLoading}
                  />
                </label>
                <button
                  className="action-button success compact-button"
                  onClick={() => handleRestoreConfig(restoreConfigId)}
                  disabled={restoreLoading || !restoreConfigId}
                >
                  {restoreLoading ? "Restoring..." : "Restore"}
                </button>
              </div>
              <p className="text-muted-sm">
                If you know the Config ID (UUID), enter it above to restore. Otherwise, find the config in the list below.
              </p>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Recently Deleted Configs</h3>
              </div>
              {deletedConfigs.length === 0 ? (
                <p className="table-empty-cell text-muted">
                  No deleted configs found in recent audit logs (last 90 days).
                </p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Config ID</th>
                      <th>Deleted At</th>
                      <th>Deleted By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedConfigs.map((config, idx) => (
                      <tr key={`deleted-${config.id}-${idx}`}>
                        <td>
                          <span className="reports-id" title={config.id}>
                            {config.id?.length > 20 ? `${config.id.substring(0, 20)}...` : config.id}
                          </span>
                        </td>
                        <td>
                          {new Date(config.deletedAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td>{config.deletedBy}</td>
                        <td>
                          <button
                            className="action-button success compact-button"
                            onClick={() => handleRestoreConfig(config.id)}
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

            <div className="panel panel-mt-16">
              <div className="panel-header">
                <h3>About Deleted Configs</h3>
              </div>
              <div className="guideline-text">
                <ul className="guideline-list">
                  <li>Deleted configs are <strong>soft-deleted</strong> in the database (not permanently removed).</li>
                  <li>The list above shows configs deleted from <strong>audit logs</strong> (last 90 days).</li>
                  <li>Use the <strong>Restore</strong> button to reactivate a deleted configuration.</li>
                  <li>If you know the Config ID (UUID), you can restore directly using the input field above.</li>
                  <li>Restoring a config will make it active again for its associated group.</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
