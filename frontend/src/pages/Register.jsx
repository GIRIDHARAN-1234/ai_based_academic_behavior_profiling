import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register as apiRegister } from "../api";
import toast from "react-hot-toast";
import { BrainCircuit, UserPlus } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", department: "", attendance: 75, internal_marks: 60, exam_marks: 60 });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await apiRegister(form);
      toast.success(res.data.message);
      navigate("/login");
    } catch (err) {
      if (!err.response) {
        toast.error("Cannot connect to server. Please check your internet connection or if the backend is live.");
      } else if (err.response.status === 409) {
        toast.error("This email is already registered. Please login instead.");
      } else {
        toast.error(err.response?.data?.error || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-logo">
          <BrainCircuit size={40} color="#6366f1" />
          <h1>Create Account</h1>
          <p>Join the Academic Behavior Profiling System</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input type="text" placeholder="e.g. Computer Science" value={form.department}
                onChange={e => setForm({...form, department: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Minimum 6 characters" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
          </div>
          {form.role === "student" && (
            <div className="form-section">
              <p className="form-section-title">Academic Details (initial, can update later)</p>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Attendance %</label>
                  <input type="number" min="0" max="100" value={form.attendance}
                    onChange={e => setForm({...form, attendance: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Internal Marks</label>
                  <input type="number" min="0" max="100" value={form.internal_marks}
                    onChange={e => setForm({...form, internal_marks: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Exam Marks</label>
                  <input type="number" min="0" max="100" value={form.exam_marks}
                    onChange={e => setForm({...form, exam_marks: Number(e.target.value)})} />
                </div>
              </div>
            </div>
          )}
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            <UserPlus size={16} /> {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in here</Link></p>
          {form.role === "faculty" && <p className="info-note">⚠️ Faculty accounts require admin approval before login.</p>}
        </div>
      </div>
    </div>
  );
}
