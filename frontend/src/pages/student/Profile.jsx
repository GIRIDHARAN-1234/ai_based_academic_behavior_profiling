import { useEffect, useState } from "react";
import { getStudentProfile, updateStudentProfile } from "../../api";
import toast from "react-hot-toast";
import { User, Save, Mail, BookOpen, BarChart } from "lucide-react";

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStudentProfile()
      .then(r => { setProfile(r.data); setForm(r.data); })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateStudentProfile({ attendance: Number(form.attendance), internal_marks: Number(form.internal_marks), exam_marks: Number(form.exam_marks), department: form.department });
      setProfile(res.data);
      toast.success("Profile updated!");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>My Profile</h2>
        <p>View and update your academic information</p>
      </div>
      <div className="profile-grid">
        {/* Info Card */}
        <div className="card profile-info-card">
          <div className="avatar-circle"><User size={48} color="#6366f1" /></div>
          <h3>{profile?.name}</h3>
          <p><Mail size={14} /> {profile?.email}</p>
          <p><BookOpen size={14} /> {profile?.department || "No department set"}</p>
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-num">{profile?.attendance ?? 0}%</span>
              <span className="stat-lbl">Attendance</span>
            </div>
            <div className="profile-stat">
              <span className="stat-num">{profile?.internal_marks ?? 0}</span>
              <span className="stat-lbl">Internal</span>
            </div>
            <div className="profile-stat">
              <span className="stat-num">{profile?.exam_marks ?? 0}</span>
              <span className="stat-lbl">Exam</span>
            </div>
          </div>
        </div>

        {/* Edit Card */}
        <div className="card">
          <h3>Update Academic Details</h3>
          <div className="form-group">
            <label>Department</label>
            <input type="text" value={form.department || ""} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Computer Science"/>
          </div>
          <div className="form-row-3">
            <div className="form-group">
              <label>Attendance %</label>
              <input type="number" min="0" max="100" value={form.attendance ?? 0} onChange={e => setForm({...form, attendance: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Internal Marks</label>
              <input type="number" min="0" max="100" value={form.internal_marks ?? 0} onChange={e => setForm({...form, internal_marks: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Exam Marks</label>
              <input type="number" min="0" max="100" value={form.exam_marks ?? 0} onChange={e => setForm({...form, exam_marks: e.target.value})} />
            </div>
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
