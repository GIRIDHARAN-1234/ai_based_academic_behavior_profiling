import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAssignedTests } from "../../api";
import { BookOpen, Clock, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function StudentTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAssignedTests()
      .then(r => setTests(r.data))
      .catch(() => toast.error("Failed to load tests"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>My Assigned Tests</h2>
        <p>Complete your tests before the deadline</p>
      </div>
      {tests.length === 0 ? (
        <div className="card empty-state-large">
          <BookOpen size={64} opacity={0.2} />
          <h3>No Pending Tests</h3>
          <p>You have no active tests assigned. Check back later!</p>
        </div>
      ) : (
        <div className="tests-grid">
          {tests.map(t => (
            <div key={t._id} className="test-card">
              <div className="test-card-header">
                <BookOpen size={24} color="#6366f1" />
                <span className="test-badge">Active</span>
              </div>
              <h3>{t.title}</h3>
              <p className="test-description">{t.description || "No description provided"}</p>
              <div className="test-meta-row">
                <span><BookOpen size={14} /> {t.questions?.length} Questions</span>
                <span><Clock size={14} /> Due: {new Date(t.deadline).toLocaleDateString()}</span>
              </div>
              <Link to={`/student/tests/${t._id}`} className="btn-primary btn-full" state={{ test: t }}>
                Start Test <ChevronRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
