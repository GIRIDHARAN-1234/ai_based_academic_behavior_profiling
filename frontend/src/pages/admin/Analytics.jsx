import { useEffect, useState } from "react";
import { getAdminAnalytics } from "../../api";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, PointElement, LineElement, Filler
} from "chart.js";
import toast from "react-hot-toast";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement,
  Tooltip, Legend, PointElement, LineElement, Filler);

export default function AdminAnalytics() {
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
    labels: ["Excellent", "Medium", "Weak"],
    datasets: [{ data: [dist.Excellent||0, dist.Medium||0, dist.Weak||0], backgroundColor: ["#10b981","#f59e0b","#ef4444"], borderWidth: 0 }]
  };

  // Department-wise counts (derived from student list)
  const students = data?.student_behaviors || [];
  const deptMap = {};
  students.forEach(s => {
    const dept = s.department || "Other";
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });
  const deptLabels = Object.keys(deptMap);
  const deptData = {
    labels: deptLabels,
    datasets: [{
      label: "Students",
      data: deptLabels.map(d => deptMap[d]),
      backgroundColor: "rgba(99,102,241,0.7)",
      borderRadius: 6
    }]
  };

  // Attendance distribution
  const bins = { "0-40": 0, "41-60": 0, "61-75": 0, "76-90": 0, "91-100": 0 };
  students.forEach(s => {
    const a = s.attendance || 0;
    if (a <= 40) bins["0-40"]++;
    else if (a <= 60) bins["41-60"]++;
    else if (a <= 75) bins["61-75"]++;
    else if (a <= 90) bins["76-90"]++;
    else bins["91-100"]++;
  });
  const attendanceData = {
    labels: Object.keys(bins),
    datasets: [{
      label: "Students",
      data: Object.values(bins),
      backgroundColor: ["#ef4444","#f59e0b","#6366f1","#10b981","#3b82f6"],
      borderRadius: 6
    }]
  };

  const behaviorBadge = (b) => {
    const map = { Excellent:{bg:"#dcfce7",color:"#10b981"}, Medium:{bg:"#fef3c7",color:"#f59e0b"}, Weak:{bg:"#fee2e2",color:"#ef4444"} };
    const s = map[b] || map.Medium;
    return <span className="behavior-chip" style={{background:s.bg,color:s.color}}>{b}</span>;
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>System Analytics</h2>
        <p>Comprehensive overview of academic performance across all users</p>
      </div>

      {/* Summary strip */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon" style={{background:"#e0e7ff"}}><span style={{fontSize:20}}>🎓</span></div><div><p className="stat-label">Total Students</p><p className="stat-value">{data?.totals?.students||0}</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:"#dcfce7"}}><span style={{fontSize:20}}>👩‍🏫</span></div><div><p className="stat-label">Total Faculty</p><p className="stat-value">{data?.totals?.faculty||0}</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:"#fef3c7"}}><span style={{fontSize:20}}>📝</span></div><div><p className="stat-label">Tests Conducted</p><p className="stat-value">{data?.totals?.tests||0}</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:"#fce7f3"}}><span style={{fontSize:20}}>📋</span></div><div><p className="stat-label">Submissions</p><p className="stat-value">{data?.totals?.submissions||0}</p></div></div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>🥧 Behavior Distribution</h3>
          <div className="donut-wrapper">
            <Doughnut data={donutData} options={{responsive:true, cutout:"68%", plugins:{legend:{position:"bottom"}}}}/>
          </div>
          <div className="dist-summary">
            <div className="dist-item" style={{borderColor:"#10b981"}}><span>Excellent</span><strong>{dist.Excellent||0}</strong></div>
            <div className="dist-item" style={{borderColor:"#f59e0b"}}><span>Medium</span><strong>{dist.Medium||0}</strong></div>
            <div className="dist-item" style={{borderColor:"#ef4444"}}><span>Weak</span><strong>{dist.Weak||0}</strong></div>
          </div>
        </div>

        <div className="card">
          <h3>🏛️ Students by Department</h3>
          {deptLabels.length > 0
            ? <Bar data={deptData} options={{responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{stepSize:1}}}}}/>
            : <div className="empty-state"><p>No department data yet</p></div>
          }
        </div>
      </div>

      <div className="card">
        <h3>📊 Attendance Distribution</h3>
        <Bar data={attendanceData} options={{responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{stepSize:1}}}}}/>
      </div>

      <div className="card">
        <h3>🎓 Student Behavior Details</h3>
        <table className="data-table">
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Department</th><th>Attendance%</th><th>Predicted Behavior</th></tr></thead>
          <tbody>
            {students.length === 0
              ? <tr><td colSpan={6} style={{textAlign:"center",padding:24,color:"#9ca3af"}}>No students registered yet</td></tr>
              : students.map((s,i) => (
                <tr key={i}>
                  <td>{i+1}</td>
                  <td><strong>{s.name}</strong></td>
                  <td className="muted">{s.email}</td>
                  <td>{s.department||"—"}</td>
                  <td>{s.attendance}%</td>
                  <td>{behaviorBadge(s.predicted_behavior)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
