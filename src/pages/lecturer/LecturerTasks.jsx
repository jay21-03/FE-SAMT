import { Link } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";

export default function LecturerTasks() {
  const tasks = [];

  return (
    <DashboardLayout>
      <div className="lecturer-dashboard">
        <div className="lecturer-header">
          <div>
            <h1 className="page-title">Tasks</h1>
            <p className="page-subtitle">
              Danh sách nhiệm vụ bạn giao cho các nhóm trong học kỳ hiện tại.
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

        <div className="student-main-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Tasks Overview</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Group</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 16 }}>
                      No data
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.name}>
                      <td>{t.name}</td>
                      <td>{t.group}</td>
                      <td>
                        <span className="status-pill status-inprogress">
                          {t.status}
                        </span>
                      </td>
                      <td>{t.due}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Filters</h3>
            </div>
            <div className="profile-form">
              <label>
                <span>Semester</span>
                <select className="select-input">
                  <option>2025A</option>
                  <option>2025B</option>
                </select>
              </label>
              <label>
                <span>Status</span>
                <select className="select-input">
                  <option>All</option>
                  <option>To Do</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

