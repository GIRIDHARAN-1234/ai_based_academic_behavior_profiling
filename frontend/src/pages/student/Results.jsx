import { useEffect, useState } from "react";
import { getStudentResults } from "../../api";
import toast from "react-hot-toast";
import { ClipboardList, TrendingUp } from "lucide-react";

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentResults()
      .then(r => setResults(r.data))
      .catch(() => toast.error("Failed to load results"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  // Compute trend: is latest score higher or lower than the one before?
  const trend = results.length >= 2
    ? results[0].score > results[1].score ? "up" : results[0].score < results[1].score ? "down" : "flat"
    : null;

  // Stats
  const avg = results.length ? Math.round(results.reduce((a,r)=>a+r.score,0)/results.length) : 0;
  const best = results.length ? Math.max(...results.map(r=>r.score)) : 0;

  const scoreColor = (s) => s >= 70 ? "#10b981" : s >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Test Results</h2>
        <p>Your complete test history — behavior prediction is based on the weighted average of all scores</p>
      </div>

      {results.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{background:"#e0e7ff"}}><ClipboardList color="#6366f1"/></div>
            <div><p className="stat-label">Tests Taken</p><p className="stat-value">{results.length}</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:"#dcfce7"}}><span style={{fontSize:20}}>🏆</span></div>
            <div><p className="stat-label">Best Score</p><p className="stat-value" style={{color:"#10b981"}}>{best}%</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:"#fef3c7"}}><TrendingUp color="#f59e0b"/></div>
            <div><p className="stat-label">Weighted Avg</p><p className="stat-value">{avg}%</p></div>
          </div>
          {trend && (
            <div className="stat-card">
              <div className="stat-icon" style={{background: trend==="up"?"#dcfce7":"#fee2e2"}}>
                <span style={{fontSize:24}}>{trend==="up"?"📈":"📉"}</span>
              </div>
              <div><p className="stat-label">Trend</p><p className="stat-value" style={{color:trend==="up"?"#10b981":"#ef4444",fontSize:"1rem"}}>{trend==="up"?"Improving":"Declining"}</p></div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3>📋 All Test Results</h3>
        {results.length === 0 ? (
          <div className="empty-state-large">
            <ClipboardList size={48} opacity={0.3}/>
            <h3>No Results Yet</h3>
            <p>Take a test to see your results here.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Test Name</th>
                <th>Score</th>
                <th>Correct / Total</th>
                <th>Date</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r._id}>
                  <td>{i + 1}</td>
                  <td><strong>{r.test_title || "Test"}</strong></td>
                  <td>
                    <span className="score-pill" style={{
                      background: `${scoreColor(r.score)}22`,
                      color: scoreColor(r.score),
                      fontSize:"0.85rem", fontWeight:700
                    }}>{r.score}%</span>
                  </td>
                  <td className="muted">{r.correct} / {r.total}</td>
                  <td className="muted">{new Date(r.submitted_at).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"})}</td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{flex:1,height:6,background:"var(--border)",borderRadius:3,maxWidth:80}}>
                        <div style={{width:`${r.score}%`,height:"100%",background:scoreColor(r.score),borderRadius:3,transition:"width 0.5s"}}/>
                      </div>
                      <span style={{fontSize:"0.75rem",color:scoreColor(r.score),fontWeight:600}}>{r.score >= 70?"Good":r.score>=45?"Average":"Needs Work"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
