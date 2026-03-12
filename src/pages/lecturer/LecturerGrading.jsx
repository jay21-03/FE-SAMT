import { Link } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";

export default function LecturerGrading() {
  const grades = [
    {
      student: "Nguyễn Văn A",
      group: "Team Alpha",
      score: 8.5,
      status: "Draft",
    },
    {
      student: "Trần Thị B",
      group: "Team Alpha",
      score: 9.0,
      status: "Published",
    },
    { student: "Lê Văn C", group: "Team Beta", score: 7.8, status: "Draft" },
  ];

  return (
    <DashboardLayout>
      <div className="lecturer-dashboard">
        <div className="lecturer-header">
          <div>
            <h1 className="page-title">Grading</h1>
            <p className="page-subtitle">
              Quản lý điểm số và trạng thái chấm của từng sinh viên.
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

        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h3>Scores</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Group</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g.student}>
                  <td>{g.student}</td>
                  <td>{g.group}</td>
                  <td>{g.score}</td>
                  <td>
                    <span className="status-pill status-active">{g.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

