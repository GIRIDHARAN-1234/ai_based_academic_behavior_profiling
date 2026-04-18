import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStudentProfile, getStudentPrediction, getStudentTrend, getAssignedTests } from "../../api";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from "chart.js";
import { BookOpen, TrendingUp, Award, AlertTriangle, User, BarChart2 } from "lucide-react";
import toast from "react-hot-toast";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const behaviorConfig = {
  Excellent:       { color: "#059669", bg: "#d1fae5", icon: "🌟", label: "Excellent" },
  Good:            { color: "#2563eb", bg: "#dbeafe", icon: "👍", label: "Good" },
  Average:         { color: "#d97706", bg: "#fef3c7", icon: "📈", label: "Average" },
  "Below Average": { color: "#ea580c", bg: "#ffe4cc", icon: "⚠️", label: "Below Average" },
  "At Risk":       { color: "#dc2626", bg: "#fee2e2", icon: "🚨", label: "At Risk" },
};

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [trend, setTrend] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStudentProfile(), getStudentPrediction(), getStudentTrend(), getAssignedTests()])
      .then(([p, pr, t, ts]) => {
        setProfile(p.data);
        setPrediction(pr.data);
        setTrend(t.data);
        setTests(ts.data);
      })
      .catch(() => toast.error("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const bConfig = prediction ? behaviorConfig[prediction.behavior] || behaviorConfig.Average : behaviorConfig.Average;

  const trendChart = {
    labels: trend.map(t => t.date),
    datasets: [{
      label: "Test Score",
      data: trend.map(t => t.score),
      borderColor: "#6366f1", backgroundColor: "rgba(99,102,241,0.12)",
      tension: 0.4, fill: true, pointBackgroundColor: "#6366f1", pointRadius: 5
    }]
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Student Dashboard</h2>
        <p>Welcome back, <strong>{profile?.name}</strong> 👋</p>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background:"#e0e7ff"}}><BookOpen color="#6366f1" /></div>
          <div><p className="stat-label">Attendance</p><p className="stat-value">{profile?.attendance ?? 0}%</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:"#dcfce7"}}><Award color="#10b981" /></div>
          <div><p className="stat-label">Internal Marks</p><p className="stat-value">{profile?.internal_marks ?? 0}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:"#fef3c7"}}><TrendingUp color="#f59e0b" /></div>
          <div><p className="stat-label">Exam Marks</p><p className="stat-value">{profile?.exam_marks ?? 0}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:"#fce7f3"}}><BarChart2 color="#ec4899" /></div>
          <div><p className="stat-label">Pending Tests</p><p className="stat-value">{tests.length}</p></div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Behavior Prediction Card */}
        <div className="card behavior-card" style={{borderTop: `4px solid ${bConfig.color}`, background: bConfig.bg}}>
          <h3>🤖 AI Behavior Prediction</h3>
          <div className="behavior-badge" style={{color: bConfig.color}}>
            <span className="behavior-icon">{bConfig.icon}</span>
            <span className="behavior-label">{bConfig.label}</span>
          </div>
          <p className="behavior-insight">{prediction?.insight}</p>
          <div className="behavior-metrics">
            {prediction?.data && Object.entries(prediction.data).map(([k,v]) => (
              <div key={k} className="metric-chip">
                <span>{k.replace(/_/g," ")}</span>
                <strong>{v}{k==="attendance" ? "%" : ""}</strong>
              </div>
            ))}
          </div>
          {prediction?.behavior === "At Risk" && (
            <div className="early-warning">
              <AlertTriangle size={16} color="#ef4444" /> Early Warning: Your faculty has been notified!
            </div>
          )}
        </div>

        {/* Performance Trend */}
        <div className="card">
          <h3>📊 Performance Trend</h3>
          {trend.length > 0 ? (
            <Line data={trendChart} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }} />
          ) : (
            <div className="empty-state"><TrendingUp size={40} opacity={0.3} /><p>No test data yet. Take a test to see your trend!</p></div>
          )}
        </div>
      </div>

      {/* Assigned Tests */}
      <div className="card">
        <div className="card-header-row">
          <h3>📝 Assigned Tests</h3>
          <Link to="/student/tests" className="btn-outline">View All</Link>
        </div>
        {tests.length === 0 ? (
          <div className="empty-state"><BookOpen size={36} opacity={0.3} /><p>No tests assigned yet.</p></div>
        ) : (
          <div className="test-list">
            {tests.slice(0, 3).map(t => (
              <div key={t._id} className="test-item">
                <div><p className="test-title">{t.title}</p><p className="test-meta">{t.questions?.length} questions · Due: {new Date(t.deadline).toLocaleDateString()}</p></div>
                <Link to={`/student/tests/${t._id}`} className="btn-primary btn-sm">Start Test</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
