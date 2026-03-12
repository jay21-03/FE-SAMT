import { useMemo } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import DataTable from "../../components/DataTable";
import { useSemesters } from "../../hooks/useUserGroups";

export default function SemesterManagement() {
  const { data, isLoading } = useSemesters();
  const columns = [
    { key: "code", header: "Semester Code" },
    { key: "name", header: "Name" },
    { key: "startDate", header: "Start Date" },
    { key: "endDate", header: "End Date" },
    { key: "status", header: "Status" },
    { key: "actions", header: "" },
  ];

  const rows = useMemo(() => {
    if (!data) return [];
    return data.map((semester) => ({
      id: semester.id,
      code: semester.semesterCode,
      name: semester.semesterName,
      startDate: semester.startDate,
      endDate: semester.endDate,
      status: semester.isActive ? "ACTIVE" : "INACTIVE",
    }));
  }, [data]);

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="admin-header-row">
          <div>
            <h1 className="page-title">Semester Management</h1>
            <p className="page-subtitle">Quản lý danh sách các học kỳ.</p>
          </div>
          <button className="primary-button">New Semester</button>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          emptyMessage="Chưa có học kỳ."
        />
      </div>
    </DashboardLayout>
  );
}

