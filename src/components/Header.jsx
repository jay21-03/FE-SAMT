import { useNavigate } from "react-router-dom";
import { tokenStore } from "../api/tokenStore";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    tokenStore.clear();
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/app/profile");
  };

  const role = localStorage.getItem("role");

  return (
    <header className="app-header">
      <div className="app-header-left">
        <div className="app-title">
          <span className="app-title-prefix">Academic Management Tool</span>
          <span className="app-title-main">SAMT</span>
        </div>
      </div>

      <div className="app-header-right">
        <div className="app-header-role">
          <span className="role-label">{role}</span>
        </div>

        <button className="avatar-button" aria-label="Profile" onClick={handleProfile}>
          <span className="avatar-circle">U</span>
        </button>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
