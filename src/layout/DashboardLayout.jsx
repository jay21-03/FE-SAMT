import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout({ children }) {
  return (
    <div
      className="dashboard-shell"
      style={{ display: "flex", height: "100vh" }}
    >
      <Sidebar />
      <div className="dashboard-main" style={{ flex: 1, background: "#f3f4f6" }}>
        <Header />
        <div className="dashboard-content" style={{ padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}