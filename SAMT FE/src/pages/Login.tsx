// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi, getMeApi } from "../api/auth.api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Gọi API login
      const res = await loginApi({ email, password });

      const { accessToken, refreshToken } = res.data;

      // 2. Lưu token
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);

      // 3. Lấy profile để biết role
      const meRes = await getMeApi();
      const role = meRes.data.role; // ADMIN | LECTURER | STUDENT

      // 4. Redirect theo role
      if (role === "ADMIN") {
        navigate("/app/admin/dashboard");
      } else if (role === "LECTURER") {
        navigate("/app/lecturer/groups/list");
      } else {
        navigate("/app/student/profile/me");
      }
    } catch (err: any) {
      console.error(err);
      setError("Đăng nhập thất bại. Vui lòng kiểm tra email hoặc mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 360, padding: 24, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>Login</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </div>

          {error && (
            <div style={{ color: "red", marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 10,
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {loading ? "Đang đăng nhập..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}