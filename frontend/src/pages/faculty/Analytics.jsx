import { useEffect, useState } from "react";
import { getFacultyAnalytics } from "../../api";
import toast from "react-hot-toast";
import { Search, AlertTriangle, TrendingUp } from "lucide-react";

const behaviorStyle = {
  Excellent: { background:"#d1fae5", color:"#10b981" },
  Medium:    { background:"#fef3c7", color:"#f59e0b" },
  Weak:      { background:"#fee2e2", color:"#ef4444" }
};

export default function FacultyAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    getFacultyAnalytics()
      .then(r => setData(r.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  const students = (data?.students || []).filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || s.predicted_behavior === filter;
    return matchSearch && matchFilter;
  });

  const dist = data?.behavior_distribution || {};
  const warnings = data?.early_warnings || [];

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Student Analytics</h2>
        <p>AI behavior predictions based on weighted average of all past test scores + academic data</p>
      </div>

      {/* Summary Strip */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background:"#dcfce7"}}><TrendingUp color="#10b981"/></div>
          <div><p className="stat-label">Excellent</p><p className="stat-value" style={{color:"#10b981"}}>{dist.Excellent||0}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:"#fef3c7"}}><span style={{fontSize:20}}>📊</span></div>
          <div><p className="stat-label">Medium</p><p className="stat-value" style={{color:"#f59e0b"}}>{dist.Medium||0}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:"#fee2e2"}}><AlertTriangle color="#ef4444"/></div>
          <div><p className="stat-label">Weak / At-Risk</p><p className="stat-value" style={{color:"#ef4444"}}>{dist.Weak||0}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:"#e0e7ff"}}><span style={{fontSize:20}}>📝</span></div>
          <div><p className="stat-label">Tests Created</p><p className="stat-value">{data?.total_tests||0}</p></div>
        </div>
      </div>

      {/* Early Warnings Panel */}
      {warnings.length > 0 && (
        <div className="card warning-card">
          <h3><AlertTriangle size={16} color="#ef4444"/> Early Warning — {warnings.length} At-Risk Student{warnings.length > 1 ? "s" : ""}</h3>
          <div className="warning-list">
            {warnings.map((w,i) => (
              <div key={i} className="warning-item">
                <span className="warning-dot"/>
                <strong>{w.name}</strong>
                <span className="muted">{w.email}</span>
                <span className="muted" style={{marginLeft:"auto"}}>⚠️ Predicted: Weak</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="card">
        <div className="table-toolbar">
          <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 12px",flex:1,maxWidth:300}}>
            <Search size={15} color="#9ca3af"/>
            <input className="search-input" style={{border:"none",background:"transparent",padding:0,maxWidth:"100%"}}
              placeholder="Search student..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="filter-tabs">
            {["All","Excellent","Medium","Weak"].map(f => (
              <button key={f} className={`filter-tab ${filter===f?"active":""}`} onClick={()=>setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Attendance%</th>
              <th>Internal</th>
              <th>Exam</th>
              <th>Tests Taken</th>
              <th>Avg Score%</th>
              <th>Behavior</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={9} style={{textAlign:"center",padding:32,color:"#9ca3af"}}>No students match your filter.</td></tr>
            ) : students.map((s,i) => {
              const bs = behaviorStyle[s.predicted_behavior] || behaviorStyle.Medium;
              return (
                <tr key={i}>
                  <td>{i+1}</td>
                  <td><strong>{s.name}</strong></td>
                  <td className="muted">{s.email}</td>
                  <td><span style={{color: s.attendance<60?"#ef4444":s.attendance<75?"#f59e0b":"#10b981", fontWeight:700}}>{s.attendance}%</span></td>
                  <td>{s.internal_marks}</td>
                  <td>{s.exam_marks}</td>
                  <td style={{textAlign:"center"}}>{s.tests_taken ?? "—"}</td>
                  <td><strong style={{color: (s.avg_test_score||0)<50?"#ef4444":(s.avg_test_score||0)<70?"#f59e0b":"#10b981"}}>{s.avg_test_score ?? s.last_test_score ?? "—"}</strong></td>
                  <td><span className="behavior-chip" style={bs}>{s.predicted_behavior}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
