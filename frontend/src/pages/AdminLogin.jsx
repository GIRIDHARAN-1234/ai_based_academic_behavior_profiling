import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as apiLogin } from "../api";
import toast from "react-hot-toast";
import { Shield, ShieldAlert } from "lucide-react";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await apiLogin(form);
      if (res.data.role !== "admin") {
        toast.error("Unauthorized. Admin access only.");
        return;
      }
      login(res.data);
      toast.success(`Welcome back, Administrator!`);
      navigate("/admin");
    } catch (err) {
      if (!err.response) {
        toast.error("Cannot reach server. Run start.bat to start the backend.");
      } else {
        toast.error(err.response?.data?.error || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Shield size={48} color="#ef4444" />
          <h1>Admin Portal</h1>
          <p>Secure login for administrators</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="admin@example.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading} style={{ background: "#ef4444" }}>
            <ShieldAlert size={16} /> {loading ? "Authenticating..." : "Admin Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
