import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createStudent } from "../../api";
import toast from "react-hot-toast";
import { UserPlus, Plus, Trash2, Send, Info } from "lucide-react";

const emptyRow = { name: "", email: "", department: "", attendance: 75, internal_marks: 60, exam_marks: 60 };

export default function CreateStudent() {
  const [students, setStudents] = useState([{ ...emptyRow }]);
  const [loading, setLoading] = useState(false);
  const [createdList, setCreatedList] = useState([]);
  const navigate = useNavigate();

  const addRow = () => setStudents([...students, { ...emptyRow }]);
  const removeRow = (i) => setStudents(students.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => {
    const updated = [...students];
    updated[i] = { ...updated[i], [field]: val };
    setStudents(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalid = students.find(s => !s.name.trim() || !s.email.trim());
    if (invalid) { toast.error("Name and email are required for all rows"); return; }
    setLoading(true);
    try {
      // Use bulk endpoint
      const { createStudentBulk } = await import("../../api");
      const res = await createStudentBulk({ students });
      const d = res.data;
      toast.success(`${d.created} student(s) created successfully!`);
      if (d.errors?.length) {
        d.errors.forEach(err => toast.error(err, { duration: 4000 }));
      }
      setCreatedList(students.filter(s => !d.errors?.some(e => e.includes(s.email))));
      setStudents([{ ...emptyRow }]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create students");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Create Student Accounts</h2>
        <p>Add student academic data — they will login with their email and default password <strong>student123</strong></p>
      </div>

      {/* Info Banner */}
      <div className="info-banner">
        <Info size={18} color="#6366f1" />
        <div>
          <strong>How it works:</strong> Add student details below → Students login at the Login page with their <strong>email</strong> and password <strong>student123</strong> → They see assigned tests → After completing tests, AI predicts their behavior based on all past scores combined.
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header-row">
            <h3>Student Records</h3>
            <button type="button" className="btn-outline" onClick={addRow}>
              <Plus size={15} /> Add Row
            </button>
          </div>

          <div className="student-creation-table">
            <div className="student-table-header">
              <span>Full Name *</span>
              <span>Email *</span>
              <span>Department</span>
              <span>Attendance %</span>
              <span>Internal Marks</span>
              <span>Exam Marks</span>
              <span></span>
            </div>
            {students.map((s, i) => (
              <div key={i} className="student-table-row">
                <input placeholder="e.g. John Doe" value={s.name}
                  onChange={e => updateRow(i, "name", e.target.value)} required />
                <input type="email" placeholder="john@email.com" value={s.email}
                  onChange={e => updateRow(i, "email", e.target.value)} required />
                <input placeholder="e.g. CSE" value={s.department}
                  onChange={e => updateRow(i, "department", e.target.value)} />
                <input type="number" min="0" max="100" value={s.attendance}
                  onChange={e => updateRow(i, "attendance", Number(e.target.value))} />
                <input type="number" min="0" max="100" value={s.internal_marks}
                  onChange={e => updateRow(i, "internal_marks", Number(e.target.value))} />
                <input type="number" min="0" max="100" value={s.exam_marks}
                  onChange={e => updateRow(i, "exam_marks", Number(e.target.value))} />
                <button type="button" className="btn-danger-sm"
                  onClick={() => removeRow(i)} disabled={students.length === 1}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="action-bar" style={{ marginTop: 16 }}>
            <p className="muted"><Info size={13} /> Default password for all students: <code>student123</code></p>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Send size={15} /> {loading ? "Creating..." : `Create ${students.length} Student(s)`}
            </button>
          </div>
        </div>
      </form>

      {/* Created Students List */}
      {createdList.length > 0 && (
        <div className="card">
          <h3>✅ Students Created — Share these credentials:</h3>
          <table className="data-table">
            <thead><tr><th>#</th><th>Name</th><th>Email (Login ID)</th><th>Password</th><th>Attendance</th><th>Internal</th><th>Exam</th></tr></thead>
            <tbody>
              {createdList.map((s, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td><strong>{s.name}</strong></td>
                  <td className="muted">{s.email}</td>
                  <td><code className="cred-pill">student123</code></td>
                  <td>{s.attendance}%</td>
                  <td>{s.internal_marks}</td>
                  <td>{s.exam_marks}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
            <button className="btn-primary" onClick={() => navigate("/faculty/assign-test")}>
              Assign Tests to These Students →
            </button>
            <button className="btn-outline" onClick={() => setCreatedList([])}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
