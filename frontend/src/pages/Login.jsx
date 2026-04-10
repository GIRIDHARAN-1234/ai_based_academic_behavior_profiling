import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as apiLogin } from "../api";
import toast from "react-hot-toast";
import { BrainCircuit, LogIn } from "lucide-react";

export default function Login() {
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
      if (res.data.role === "admin") {
        toast.error("Admins must login via the admin portal.");
        navigate("/admin-login");
        return;
      }
      login(res.data);
      toast.success(`Welcome, ${res.data.name}!`);
      if (res.data.role === "student") navigate("/student");
      else if (res.data.role === "faculty") navigate("/faculty");
    } catch (err) {
      if (!err.response) {
        toast.error("Cannot reach server. Please check your internet connection or if the backend is live.");
      } else if (err.response.status === 403) {
        toast.error("Account pending admin approval. Contact your admin.");
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
          <BrainCircuit size={48} color="#6366f1" />
          <h1>AcademIQ</h1>
          <p>AI-Based Academic Behavior Profiling</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            <LogIn size={16} /> {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>
    </div>
  );
}
