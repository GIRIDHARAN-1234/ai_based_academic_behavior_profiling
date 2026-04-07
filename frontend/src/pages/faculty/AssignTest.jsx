import { useEffect, useState } from "react";
import { getFacultyTests, assignTest } from "../../api";
import toast from "react-hot-toast";
import { Send, Clock, BookOpen } from "lucide-react";

export default function AssignTest() {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState("");
  const [emails, setEmails] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getFacultyTests()
      .then(r => setTests(r.data))
      .catch(() => toast.error("Failed to load tests"));
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedTest) { toast.error("Select a test"); return; }
    const emailList = emails.split(",").map(e => e.trim()).filter(Boolean);
    if (!emailList.length) { toast.error("Enter at least one email"); return; }
    setLoading(true);
    try {
      const res = await assignTest(selectedTest, { emails: emailList, deadline });
      toast.success(res.data.message);
      setEmails(""); setSelectedTest(""); setDeadline("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Assignment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header"><h2>Assign Test to Students</h2><p>Select a test and enter student emails</p></div>
      <div className="card" style={{maxWidth:600}}>
        <form onSubmit={handleAssign}>
          <div className="form-group">
            <label>Select Test *</label>
            <select value={selectedTest} onChange={e=>setSelectedTest(e.target.value)} required>
              <option value="">-- Choose a test --</option>
              {tests.map(t => <option key={t._id} value={t._id}>{t.title} ({t.questions?.length} Qs)</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Student Emails (comma-separated) *</label>
            <textarea value={emails} onChange={e=>setEmails(e.target.value)} rows={3} placeholder="student1@email.com, student2@email.com" required />
          </div>
          <div className="form-group">
            <label>Override Deadline (optional)</label>
            <input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            <Send size={16} /> {loading ? "Assigning..." : "Assign Test"}
          </button>
        </form>
      </div>

      <div className="card" style={{marginTop:24}}>
        <h3>Your Tests</h3>
        {tests.length === 0 ? (
          <p className="muted">No tests yet. <a href="/faculty/create-test">Create one!</a></p>
        ) : (
          <table className="data-table">
            <thead><tr><th>Title</th><th>Questions</th><th>Deadline</th><th>Assigned To</th></tr></thead>
            <tbody>
              {tests.map(t => (
                <tr key={t._id}>
                  <td><BookOpen size={14} color="#6366f1" /> {t.title}</td>
                  <td>{t.questions?.length}</td>
                  <td><Clock size={13} /> {new Date(t.deadline).toLocaleDateString()}</td>
                  <td>{t.assigned_count} student(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
