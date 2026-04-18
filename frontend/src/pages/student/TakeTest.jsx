import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getAssignedTests, submitTest } from "../../api";
import toast from "react-hot-toast";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function TakeTest() {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [test, setTest] = useState(location.state?.test || null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!test);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!test) {
      getAssignedTests().then(r => {
        const found = r.data.find(t => t._id === testId);
        if (found) setTest(found);
        else toast.error("Test not found");
      }).finally(() => setLoading(false));
    }
  }, [testId]);

  const handleSubmit = async () => {
    if (!test) return;
    const unanswered = test.questions.filter((_, i) => !(String(i) in answers));
    if (unanswered.length > 0) {
      toast.error(`Please answer all ${unanswered.length} remaining question(s)`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitTest(testId, answers);
      setResult(res.data);
      setSubmitted(true);
      toast.success("Test submitted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!test) return <div className="page-content"><div className="card"><p>Test not found.</p></div></div>;

  if (submitted && result) {
    const pct = result.score;
    const behaviorColors = { Excellent:"#059669", Good:"#2563eb", Average:"#d97706", "Below Average":"#ea580c", "At Risk":"#dc2626" };
    const bColor = behaviorColors[result.behavior] || "#6366f1";
    return (
      <div className="page-content">
        <div className="card result-card">
          <CheckCircle size={64} color={bColor} />
          <h2>Test Submitted!</h2>

          {/* This Test Score */}
          <div className="score-display" style={{ color: bColor }}>
            <span className="score-number">{result.score}%</span>
            <span className="score-label">This test: {result.correct} / {result.total} correct</span>
          </div>

          {/* Weighted Avg Score */}
          <div className="avg-score-row">
            <span>📊 Weighted avg of all your tests:</span>
            <strong style={{ color: "#818cf8" }}>{result.avg_score ?? pct}%</strong>
          </div>

          {/* Behavior Badge */}
          <div className="behavior-result-badge" style={{ background: `${bColor}22`, color: bColor, fontSize: "1.1rem" }}>
            🎯 Overall Behavior: <strong>{result.behavior}</strong>
          </div>

          {/* AI Insight */}
          {result.insight && (
            <div className="insight-box" style={{ borderColor: bColor }}>
              {result.insight}
            </div>
          )}

          <div className="result-actions">
            <button onClick={() => navigate("/student/results")} className="btn-primary">View All Results</button>
            <button onClick={() => navigate("/student")} className="btn-outline">Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>{test.title}</h2>
        <div className="test-meta-badges">
          <span><Clock size={14} /> Due: {new Date(test.deadline).toLocaleDateString()}</span>
          <span><AlertCircle size={14} /> {test.questions.length} questions</span>
          <span>Answered: {Object.keys(answers).length} / {test.questions.length}</span>
        </div>
      </div>

      <div className="questions-list">
        {test.questions.map((q, i) => (
          <div key={i} className={`question-card ${answers[String(i)] ? "answered" : ""}`}>
            <p className="question-number">Question {i + 1}</p>
            <p className="question-text">{q.text}</p>
            <div className="options-grid">
              {q.options.map((opt, j) => {
                const letter = ["A","B","C","D"][j];
                const checked = answers[String(i)] === letter;
                return (
                  <label key={j} className={`option-label ${checked ? "selected" : ""}`}>
                    <input type="radio" name={`q${i}`} value={letter}
                      checked={checked}
                      onChange={() => setAnswers({...answers, [String(i)]: letter})} />
                    <span className="option-letter">{letter}</span>
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="submit-section">
        <button onClick={handleSubmit} className="btn-primary btn-lg" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Test"}
        </button>
        <p className="submit-note">⚠️ Once submitted, you cannot retake this test.</p>
      </div>
    </div>
  );
}
