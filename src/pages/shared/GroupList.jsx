import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import DebouncedSearchInput from "../../components/DebouncedSearchInput";
import { useGroups } from "../../hooks/useUserGroups";

export default function GroupList() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGroups({ page: 0, size: 20 });

  const columns = [
    { key: "name", header: "Group Name" },
    { key: "semester", header: "Semester" },
    { key: "lecturer", header: "Lecturer" },
    { key: "members", header: "Members" },
    { key: "status", header: "Status" },
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
      status: "ACTIVE",
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
              Danh sách nhóm đồ án theo học kỳ và giảng viên.
            </p>
          </div>
          <button className="primary-button">Create Group</button>
        </div>

        <div className="filter-row">
          <DebouncedSearchInput
            placeholder="Search group name..."
            onChange={(value) => setSearch(value)}
          />
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          emptyMessage="Chưa có nhóm."
        />
      </div>
    </DashboardLayout>
  );
}

