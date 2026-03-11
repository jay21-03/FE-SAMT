import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi, getMeApi } from "../../api/auth.api.ts";

const MOCK_USERS = [
  { email: "admin@samt.com", password: "123456", role: "ADMIN" },
  { email: "lecturer@samt.com", password: "123456", role: "LECTURER" },
  { email: "student@samt.com", password: "123456", role: "STUDENT", groupRole: "MEMBER" },
  { email: "leader@samt.com", password: "123456", role: "STUDENT", groupRole: "LEADER" },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useMockData, setUseMockData] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let role;

      if (useMockData) {
        const user = MOCK_USERS.find(
          (u) => u.email === email && u.password === password,
        );
        if (!user) {
          setError("Email hoặc mật khẩu không đúng");
          setLoading(false);
          return;
        }
        localStorage.setItem("access_token", "mock-token");
        localStorage.setItem("refresh_token", "mock-refresh-token");
        role = user.role;
        // gán group_role mock để test Leader/Member
        if (user.groupRole) {
          localStorage.setItem("group_role", user.groupRole);
        } else {
          localStorage.removeItem("group_role");
        }
      } else {
        const res = await loginApi({ email, password });
        const { accessToken, refreshToken } = res.data;
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);

        const meRes = await getMeApi();
        role = meRes.data.role;
        // nếu backend trả về groupRole có thể set ở đây
        if (meRes.data.groupRole) {
          localStorage.setItem("group_role", meRes.data.groupRole);
        } else {
          localStorage.removeItem("group_role");
        }
      }

      localStorage.setItem("role", role);

      if (role === "ADMIN") {
        navigate("/app/admin/dashboard");
      } else if (role === "LECTURER") {
        navigate("/app/lecturer/groups/list");
      } else {
        navigate("/app/student/profile/me");
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

          <div className="auth-test-mode">
            <label className="auth-test-toggle">
              <input
                type="checkbox"
                checked={useMockData}
                onChange={(e) => setUseMockData(e.target.checked)}
              />
              <span>Test mode (Mock data, không cần backend)</span>
            </label>
            {useMockData && (
              <div className="auth-test-accounts">
                <div>admin@samt.com / 123456 (ADMIN)</div>
                <div>lecturer@samt.com / 123456 (LECTURER)</div>
                <div>student@samt.com / 123456 (STUDENT - MEMBER)</div>
                <div>leader@samt.com / 123456 (STUDENT - LEADER)</div>
              </div>
            )}
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
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
        </div>
      </div>
    </div>
  );
}

