import { useNavigate } from "react-router-dom";
import { tokenStore } from "../api/tokenStore";
import { useProfile } from "../hooks/useAuth";

export default function Header() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const handleLogout = () => {
    tokenStore.clear();
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/app/profile");
  };

  const role = profile?.role || profile?.roles?.[0] || "-";
  const initials = profile?.fullName?.trim()?.charAt(0)?.toUpperCase() || "U";

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
          <span className="avatar-circle">{initials}</span>
        </button>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
