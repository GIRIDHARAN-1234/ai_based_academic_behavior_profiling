import { useEffect, useState } from "react";
import { getFacultyAnalytics } from "../../api";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { Users, BookOpen, AlertTriangle, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const behaviorColors = {
  Excellent:       "#059669",
  Good:            "#2563eb",
  Average:         "#d97706",
  "Below Average": "#ea580c",
  "At Risk":       "#dc2626",
};

export default function FacultyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFacultyAnalytics()
      .then(r => setData(r.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const dist = data?.behavior_distribution || {};
  const studentList = data?.students || [];
  const scoreData = {
    labels: studentList.slice(0,10).map(s => s.name.split(" ")[0]),
    datasets: [{
      label: "Avg Test Score (%)",
      data: studentList.slice(0,10).map(s => s.avg_test_score || s.last_test_score || 0),
      backgroundColor: studentList.slice(0,10).map(s => {
        const b = s.predicted_behavior;
        return behaviorColors[b] ? behaviorColors[b] + "b3" : "rgba(99,102,241,0.7)";
      }),
      borderRadius: 6
    }]
  };
  const donutData = {
    labels: ["Excellent","Good","Average","Below Average","At Risk"],
    datasets: [{ data: [dist.Excellent||0, dist.Good||0, dist.Average||0, dist["Below Average"]||0, dist["At Risk"]||0],
      backgroundColor:["#059669","#2563eb","#d97706","#ea580c","#dc2626"], borderWidth:0 }]
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Faculty Dashboard</h2>
        <p>Track student performance and AI behavior predictions</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon" style={{background:"#e0e7ff"}}><Users color="#6366f1" /></div><div><p className="stat-label">Total Students</p><p className="stat-value">{data?.students?.length || 0}</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:"#dcfce7"}}><TrendingUp color="#10b981" /></div><div><p className="stat-label">Excellent</p><p className="stat-value">{dist.Excellent || 0}</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:"#fef3c7"}}><BookOpen color="#f59e0b" /></div><div><p className="stat-label">Tests Created</p><p className="stat-value">{data?.total_tests || 0}</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:"#fee2e2"}}><AlertTriangle color="#ef4444" /></div><div><p className="stat-label">Early Warnings</p><p className="stat-value">{data?.early_warnings?.length || 0}</p></div></div>
      </div>

      {/* Early Warnings */}
      {data?.early_warnings?.length > 0 && (
        <div className="card warning-card">
          <h3><AlertTriangle size={18} color="#ef4444" /> 🚨 Early Warning — At-Risk Students</h3>
          <div className="warning-list">
            {data.early_warnings.map((w,i) => (
              <div key={i} className="warning-item">
                <span className="warning-dot" />
                <strong>{w.name}</strong><span className="muted">{w.email}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <h3>📊 Student Test Scores</h3>
          <Bar data={scoreData} options={{responsive:true, plugins:{legend:{display:false}}, scales:{y:{min:0,max:100}}}} />
        </div>
        <div className="card">
          <h3>🥧 Behavior Distribution</h3>
          <div className="donut-wrapper">
            <Doughnut data={donutData} options={{responsive:true, cutout:"70%", plugins:{legend:{position:"bottom"}}}} />
          </div>
        </div>
      </div>
    </div>
  );
}
