import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../api/auth.api.ts";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validatePassword = (value) => {
    const rules = [
      /.{8,}/,
      /[A-Z]/,
      /[a-z]/,
      /[0-9]/,
      /[^A-Za-z0-9]/,
    ];
    return rules.every((r) => r.test(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Password và Confirm Password không khớp.");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Mật khẩu phải ≥ 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.",
      );
      return;
    }

    try {
      setLoading(true);
      await registerApi({
        email,
        password,
        role: "STUDENT",
      });
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError("Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
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
          <h1 className="auth-hero-title">Create your SAMT student account.</h1>
          <p className="auth-hero-subtitle">
            Đăng ký tài khoản sinh viên để theo dõi tiến độ, nhiệm vụ và thống
            kê GitHub trong các đồ án môn học.
          </p>
        </div>

        <div className="auth-card">
          <h2 className="auth-title">Student Registration</h2>
          <p className="auth-subtitle">
            Role mặc định: <strong>STUDENT</strong>. Bạn có thể đổi thông tin
            sau khi được duyệt.
          </p>

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

            <label className="auth-field">
              <span>Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <div className="auth-footer-note">
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                background: "none",
                border: "none",
                color: "#60a5fa",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

