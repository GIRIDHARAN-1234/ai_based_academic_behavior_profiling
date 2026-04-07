import { useEffect, useState } from "react";
import { getAdminAnalytics } from "../../api";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { Users, BookOpen, ClipboardList, AlertTriangle, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAnalytics()
      .then(r => setData(r.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  const dist = data?.behavior_distribution || {};
  const donutData = {
    labels: ["Excellent","Medium","Weak"],
    datasets: [{ data:[dist.Excellent||0,dist.Medium||0,dist.Weak||0], backgroundColor:["#10b981","#f59e0b","#ef4444"], borderWidth:0 }]
  };

  const behaviorBadge = (b) => {
    const map = { Excellent:{ bg:"#dcfce7", color:"#10b981" }, Medium:{ bg:"#fef3c7", color:"#f59e0b" }, Weak:{ bg:"#fee2e2", color:"#ef4444" } };
    const s = map[b] || map.Medium;
    return <span className="behavior-chip" style={{background:s.bg,color:s.color}}>{b}</span>;
  };

  return (
    <div className="page-content">
      <div className="page-header"><h2>Admin Dashboard</h2><p>System-wide monitoring and analytics</p></div>

      <div className="stats-grid">
        <div className="stat-card admin-stat"><div className="stat-icon" style={{background:"#e0e7ff"}}><Users color="#6366f1"/></div><div><p className="stat-label">Total Students</p><p className="stat-value">{data?.totals?.students||0}</p></div></div>
        <div className="stat-card admin-stat"><div className="stat-icon" style={{background:"#dcfce7"}}><TrendingUp color="#10b981"/></div><div><p className="stat-label">Total Faculty</p><p className="stat-value">{data?.totals?.faculty||0}</p></div></div>
        <div className="stat-card admin-stat"><div className="stat-icon" style={{background:"#fef3c7"}}><BookOpen color="#f59e0b"/></div><div><p className="stat-label">Tests Conducted</p><p className="stat-value">{data?.totals?.tests||0}</p></div></div>
        <div className="stat-card admin-stat"><div className="stat-icon" style={{background:"#fce7f3"}}><ClipboardList color="#ec4899"/></div><div><p className="stat-label">Total Submissions</p><p className="stat-value">{data?.totals?.submissions||0}</p></div></div>
        <div className="stat-card admin-stat"><div className="stat-icon" style={{background:"#fee2e2"}}><AlertTriangle color="#ef4444"/></div><div><p className="stat-label">Pending Faculty</p><p className="stat-value">{data?.totals?.pending_faculty||0}</p></div></div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>🥧 Behavior Distribution</h3>
          <div className="donut-wrapper">
            <Doughnut data={donutData} options={{responsive:true, cutout:"70%", plugins:{legend:{position:"bottom"}}}}/>
          </div>
          <div className="dist-summary">
            <div className="dist-item" style={{borderColor:"#10b981"}}><span>Excellent</span><strong>{dist.Excellent||0}</strong></div>
            <div className="dist-item" style={{borderColor:"#f59e0b"}}><span>Medium</span><strong>{dist.Medium||0}</strong></div>
            <div className="dist-item" style={{borderColor:"#ef4444"}}><span>Weak</span><strong>{dist.Weak||0}</strong></div>
          </div>
        </div>

        <div className="card">
          <h3>👩‍🏫 Faculty Overview</h3>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Tests</th></tr></thead>
            <tbody>
              {(data?.faculty||[]).map((f,i)=>(
                <tr key={i}>
                  <td><strong>{f.name}</strong></td>
                  <td className="muted">{f.email}</td>
                  <td><span className={`status-badge status-${f.status}`}>{f.status}</span></td>
                  <td>{f.tests_created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>🎓 Student Behavior Overview</h3>
        <table className="data-table">
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Department</th><th>Attendance%</th><th>Internal</th><th>Exam</th><th>Avg Score%</th><th>Tests Taken</th><th>Behavior</th></tr></thead>
          <tbody>
            {(data?.student_behaviors||[]).map((s,i)=>(
              <tr key={i}>
                <td>{i+1}</td>
                <td><strong>{s.name}</strong></td>
                <td className="muted">{s.email}</td>
                <td>{s.department||"—"}</td>
                <td><span style={{color:s.attendance<60?"#ef4444":s.attendance<75?"#f59e0b":"#10b981",fontWeight:700}}>{s.attendance}%</span></td>
                <td>{s.internal_marks}</td>
                <td>{s.exam_marks}</td>
                <td><strong style={{color:(s.avg_test_score||0)<50?"#ef4444":(s.avg_test_score||0)<70?"#f59e0b":"#10b981"}}>{s.avg_test_score ?? "—"}</strong></td>
                <td style={{textAlign:"center"}}>{s.tests_taken ?? 0}</td>
                <td>{behaviorBadge(s.predicted_behavior)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
