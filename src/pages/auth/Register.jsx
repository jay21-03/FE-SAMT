import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const passwordRules = useMemo(() => {
    return [
      { label: "Ít nhất 8 ký tự", valid: password.length >= 8 },
      { label: "Có chữ hoa (A-Z)", valid: /[A-Z]/.test(password) },
      { label: "Có chữ thường (a-z)", valid: /[a-z]/.test(password) },
      { label: "Có số (0-9)", valid: /[0-9]/.test(password) },
      { label: "Có ký tự đặc biệt (@$!%*?&)", valid: /[@$!%*?&]/.test(password) },
      { label: "Chỉ dùng ký tự cho phép", valid: /^[A-Za-z\d@$!%*?&]*$/.test(password) },
    ];
  }, [password]);

  const isPasswordValid = passwordRules.every((rule) => rule.valid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) {
      setError("Vui lòng nhập họ tên.");
      return;
    }

    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password và Confirm Password không khớp.");
      return;
    }

    if (!isPasswordValid) {
      setError("Mật khẩu chưa đáp ứng đủ yêu cầu.");
      return;
    }

    try {
      setLoading(true);
      await authApi.register({
        email: email.trim(),
        password,
        confirmPassword,
        fullName: fullName.trim(),
        role: "STUDENT",
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      const response = err?.response;
      if (response?.status === 409) {
        setError("Email này đã được đăng ký. Vui lòng sử dụng email khác.");
      } else if (response?.status === 400) {
        const message = response?.data?.message || response?.data?.error;
        setError(message || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.");
      } else if (response?.data?.message) {
        setError(response.data.message);
      } else {
        setError("Đăng ký thất bại. Vui lòng thử lại sau.");
      }
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

          {success ? (
            <div className="auth-success">
              <div className="auth-success-icon">✓</div>
              <h3>Đăng ký thành công!</h3>
              <p>Đang chuyển hướng đến trang đăng nhập...</p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-field">
                <span>Họ và tên</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Nguyen Van A"
                  disabled={loading}
                />
              </label>

              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@samt.edu.vn"
                  disabled={loading}
                />
              </label>

              <label className="auth-field">
                <span>Mật khẩu</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
              </label>

              {password && (
                <div className="password-rules">
                  {passwordRules.map((rule, index) => (
                    <div
                      key={index}
                      className={`password-rule ${rule.valid ? "valid" : "invalid"}`}
                    >
                      <span className="rule-icon">{rule.valid ? "✓" : "✗"}</span>
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <label className="auth-field">
                <span>Xác nhận mật khẩu</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
              </label>

              {confirmPassword && password !== confirmPassword && (
                <div className="password-mismatch">
                  Mật khẩu xác nhận không khớp
                </div>
              )}

              {error && <div className="auth-error">{error}</div>}

              <button
                className="auth-button"
                type="submit"
                disabled={loading || !isPasswordValid || password !== confirmPassword}
              >
                {loading ? "Đang đăng ký..." : "Đăng ký tài khoản"}
              </button>
            </form>
          )}

          <div className="auth-register-link">
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="auth-link-button"
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

