import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.login({ email, password });
      const profile = await authApi.getProfile();
      const role = profile.role ?? "STUDENT";
      localStorage.removeItem("group_role");

      localStorage.setItem("role", role);

      if (role === "ADMIN") {
        navigate("/app/admin/dashboard");
      } else if (role === "LECTURER") {
        navigate("/app/lecturer/groups/list");
      } else {
        navigate("/app/student/my-work");
      }
    } catch (err) {
      console.error(err);
      setError("Đăng nhập thất bại. Vui lòng kiểm tra email hoặc mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-hero">
          <div className="auth-hero-header">
            <div className="logo-mark">A</div>
            <div className="logo-text">
              <span className="logo-title">Academic Management Tool</span>
              <span className="logo-subtitle">SAMT</span>
            </div>
          </div>
          <h1 className="auth-hero-title">
            Manage academic projects like a tech company.
          </h1>
          <p className="auth-hero-subtitle">
            Real‑time GitHub metrics, Jira integration, smart grading dashboards
            for admins, lecturers and students.
          </p>

          <ul className="auth-hero-list">
            <li>Live dashboards for commits, issues and code quality.</li>
            <li>Auto‑sync with GitHub and Jira in seconds.</li>
            <li>Role‑based workspaces: Admin, Lecturer, Student.</li>
          </ul>

          <div className="auth-hero-footer">
            <div className="auth-badge">Built for modern universities</div>
          </div>
        </div>

        <div className="auth-card">
          <h2 className="auth-title">Sign in to SAMT</h2>
          <p className="auth-subtitle">
            Sử dụng tài khoản được cấp để truy cập dashboard của bạn.
          </p>

          <div className="auth-test-mode" />

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                data-testid="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@samt.edu.vn"
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                data-testid="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="auth-footer-note">
            Bằng cách đăng nhập, bạn đồng ý với chính sách sử dụng hệ thống
            SAMT.
          </div>

          <div className="auth-register-link">
            Chưa có tài khoản?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="auth-link-button"
            >
              Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

