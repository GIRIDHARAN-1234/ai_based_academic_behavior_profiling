import { useEffect, useState } from "react";
import { getStudents } from "../../api";
import toast from "react-hot-toast";
import { Users, Search } from "lucide-react";

const behaviorBadge = (b) => {
  const map = { Excellent:{ bg:"#dcfce7",color:"#10b981" }, Medium:{ bg:"#fef3c7",color:"#f59e0b" }, Weak:{ bg:"#fee2e2",color:"#ef4444" } };
  const s = map[b] || map.Medium;
  return <span className="behavior-chip" style={{background:s.bg,color:s.color}}>{b}</span>;
};

export default function FacultyStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudents()
      .then(r => setStudents(r.data))
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;
  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-content">
      <div className="page-header"><h2>Student List</h2><p>{students.length} registered students</p></div>
      <div className="card">
        <div className="table-toolbar">
          <input className="search-input" placeholder="Search by name or email..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <table className="data-table">
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Department</th><th>Attendance%</th><th>Internal</th><th>Exam</th><th>Behavior</th></tr></thead>
          <tbody>
            {filtered.map((s,i) => (
              <tr key={s._id}>
                <td>{i+1}</td>
                <td><strong>{s.name}</strong></td>
                <td className="muted">{s.email}</td>
                <td>{s.department || "—"}</td>
                <td>{s.attendance}%</td>
                <td>{s.internal_marks}</td>
                <td>{s.exam_marks}</td>
                <td>{behaviorBadge(s.predicted_behavior)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
