import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTest } from "../../api";
import toast from "react-hot-toast";
import { Plus, Trash2, Save } from "lucide-react";

const defaultQ = { text: "", options: ["", "", "", ""], correct: "A" };

export default function CreateTest() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState([{ ...defaultQ, options: ["","","",""] }]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addQuestion = () => setQuestions([...questions, { text:"", options:["","","",""], correct:"A" }]);
  const removeQuestion = (i) => setQuestions(questions.filter((_,idx)=>idx!==i));

  const updateQ = (i, field, val) => {
    const updated = [...questions];
    updated[i] = { ...updated[i], [field]: val };
    setQuestions(updated);
  };

  const updateOption = (qi, oi, val) => {
    const updated = [...questions];
    updated[qi].options[oi] = val;
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (questions.some(q => !q.text.trim() || q.options.some(o=>!o.trim()))) {
      toast.error("Fill in all question texts and options"); return;
    }
    setLoading(true);
    try {
      const res = await createTest({ title, description, questions, deadline: deadline || "2099-12-31T23:59:59" });
      toast.success("Test created successfully!");
      navigate("/faculty");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header"><h2>Create MCQ Test</h2><p>Add questions and set the correct answers</p></div>
      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3>Test Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Test Title *</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Data Structures Mid-Term" required />
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} placeholder="Optional description..." />
          </div>
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="card question-editor">
            <div className="question-editor-header">
              <h3>Question {qi + 1}</h3>
              {questions.length > 1 && <button type="button" className="btn-danger-sm" onClick={()=>removeQuestion(qi)}><Trash2 size={14}/> Remove</button>}
            </div>
            <div className="form-group">
              <label>Question Text *</label>
              <textarea value={q.text} onChange={e=>updateQ(qi,"text",e.target.value)} rows={2} placeholder="Enter your question..." required />
            </div>
            <div className="options-editor">
              {["A","B","C","D"].map((letter, oi) => (
                <div key={oi} className="option-editor-row">
                  <span className="option-letter-badge">{letter}</span>
                  <input value={q.options[oi]} onChange={e=>updateOption(qi,oi,e.target.value)} placeholder={`Option ${letter}`} required />
                  <label className="correct-radio">
                    <input type="radio" name={`correct-${qi}`} value={letter} checked={q.correct===letter} onChange={()=>updateQ(qi,"correct",letter)} />
                    Correct
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="action-bar">
          <button type="button" className="btn-outline" onClick={addQuestion}><Plus size={16}/> Add Question</button>
          <button type="submit" className="btn-primary" disabled={loading}><Save size={16}/> {loading?"Saving...":"Save Test"}</button>
        </div>
      </form>
    </div>
  );
}
