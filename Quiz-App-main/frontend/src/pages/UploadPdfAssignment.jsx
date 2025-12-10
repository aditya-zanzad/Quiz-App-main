import React, { useEffect, useState } from "react";
import axios from "../utils/axios";
import "./UploadPdfAssignment.css";

const UploadPdfAssignment = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfText, setPdfText] = useState("");
  const [textInput, setTextInput] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionType, setQuestionType] = useState("mcq");
  const [difficulty, setDifficulty] = useState("any");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    title: "",
    description: "",
    duration: 30,
    endDate: "",
    assignedTo: [],
  });

  // Fetch users for assignment selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/api/users");
        // Only allow non-admin users as assignees
        const filtered =
          (res.data || []).filter((u) => u.role !== "admin" && u.role !== "superadmin");
        setUsers(filtered);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to fetch users list");
      }
    };
    fetchUsers();
  }, []);

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0];
    setPdfFile(file || null);
    setPdfText("");
    setError("");
  };

  const extractPdfText = async () => {
    if (!pdfFile) {
      setError("Please upload a PDF first.");
      return;
    }
    setIsExtracting(true);
    setError("");
    try {
      const pdfjsLib = await import("pdfjs-dist");
      // Correct worker path for Vite
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const strings = textContent.items.map((item) => item.str).join(" ");
        fullText += strings + "\n";
      }
      setPdfText(fullText.trim());
      setSuccess("PDF extracted successfully. You can generate questions now.");
    } catch (err) {
      console.error("PDF extraction error:", err);
      setError("Failed to extract text from PDF. Please try another file.");
    } finally {
      setIsExtracting(false);
    }
  };

  const textForGeneration = (textInput || pdfText).trim();

  const handleGenerate = async () => {
    if (!textForGeneration || textForGeneration.length < 50) {
      setError("Please provide at least 50 characters of text (via input or PDF).");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post("/api/generate-from-text", {
        paragraph: textForGeneration,
        numQuestions,
        questionType,
        difficulty,
      });
      if (res.data?.success) {
        const qs = res.data.questions || [];
        // Ensure questionType is present
        const normalized = qs.map((q) => ({
          ...q,
          questionType: q.questionType || questionType,
          // ensure correctAnswer exists for answer-type questions
          correctAnswer:
            q.questionType === "short_answer" || 
            q.questionType === "brief_answer" || 
            q.questionType === "long_answer" || 
            questionType === "short_answer" ||
            questionType === "brief_answer" ||
            questionType === "long_answer"
              ? q.correctAnswer || ""
              : q.correctAnswer,
          // ensure maxWords exists for answer-type questions
          maxWords: q.maxWords || (
            (q.questionType === "short_answer" || questionType === "short_answer") ? 25 :
            (q.questionType === "brief_answer" || questionType === "brief_answer") ? 75 :
            (q.questionType === "long_answer" || questionType === "long_answer") ? 300 :
            undefined
          )
        }));
        setGeneratedQuestions(normalized);
        setSuccess(`Generated ${normalized.length} questions`);
      } else {
        setError(res.data?.error || "Failed to generate questions");
      }
    } catch (err) {
      console.error("Error generating questions:", err);
      setError(err.response?.data?.error || "Failed to generate questions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionChange = (index, field, value, optionIndex = null) => {
    setGeneratedQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== index) return q;
        if (field === "options" && optionIndex !== null) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return { ...q, [field]: value };
      })
    );
  };

  const toggleAssignee = (userId) => {
    setAssignmentData((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter((id) => id !== userId)
        : [...prev.assignedTo, userId],
    }));
  };

  const handleCreateAssignment = async () => {
    if (!assignmentData.title.trim()) {
      setError("Assignment title is required.");
      return;
    }
    if (!assignmentData.endDate) {
      setError("End date is required.");
      return;
    }
    if (assignmentData.assignedTo.length === 0) {
      setError("Please select at least one user.");
      return;
    }
    if (generatedQuestions.length === 0) {
      setError("Generate questions before creating an assignment.");
      return;
    }
    setIsCreatingAssignment(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post("/api/assignments", {
        title: assignmentData.title,
        description: assignmentData.description,
        originalParagraph: textForGeneration,
        questions: generatedQuestions,
        duration: assignmentData.duration,
        endDate: assignmentData.endDate,
        assignedTo: assignmentData.assignedTo,
      });
      if (res.data?.success) {
        setSuccess(
          `Assignment created and assigned to ${assignmentData.assignedTo.length} user(s).`
        );
        setAssignmentData({
          title: "",
          description: "",
          duration: 30,
          endDate: "",
          assignedTo: [],
        });
      } else {
        setError(res.data?.error || "Failed to create assignment");
      }
    } catch (err) {
      console.error("Create assignment error:", err);
      setError(err.response?.data?.error || "Failed to create assignment");
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  return (
    <div className="upload-assignment-page">
      <div className="page-header">
        <div>
          <h1>📄 Upload Text/PDF & Generate Assignment</h1>
          <p>
            Provide text or upload a PDF, generate questions (MCQ, True/False, Short/Brief/Long Answer), customize, and
            assign to users. Fully responsive.
          </p>
        </div>
        <div className="status">
          {error && <div className="status-badge error">{error}</div>}
          {success && <div className="status-badge success">{success}</div>}
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>1) Source Content</h3>
          <div className="input-group">
            <label>Text Input</label>
            <textarea
              placeholder="Paste text here..."
              rows={8}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
            <div className="muted">Min 50 characters.</div>
          </div>
          <div className="input-group">
            <label>Or Upload PDF</label>
            <input type="file" accept="application/pdf" onChange={handlePdfChange} />
            <button
              className="btn secondary"
              onClick={extractPdfText}
              disabled={!pdfFile || isExtracting}
            >
              {isExtracting ? "Extracting..." : "Extract PDF"}
            </button>
            {pdfText && (
              <div className="muted small">
                Extracted {pdfText.length} characters from PDF.
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>2) Question Settings</h3>
          <div className="input-row">
            <div className="input-group">
              <label>Number of Questions</label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              >
                {[3, 5, 7, 10, 12, 15].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Type</label>
              <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
                <option value="mcq">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer</option>
                <option value="brief_answer">Brief Answer (2-3 sentences)</option>
                <option value="long_answer">Long Answer (paragraph)</option>
              </select>
            </div>
            <div className="input-group">
              <label>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="any">Any</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <button className="btn primary" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Questions"}
          </button>
        </div>
      </div>

            {generatedQuestions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>3) Customize Questions</h3>
            <div className="muted">{generatedQuestions.length} question(s)</div>
          </div>
          <div className="questions-list">
            {generatedQuestions.map((q, idx) => (
              <div key={idx} className="question-item">
                <div className="question-top">
                  <span className="badge">Q{idx + 1}</span>
                  <select
                    value={q.difficulty || "medium"}
                    onChange={(e) => handleQuestionChange(idx, "difficulty", e.target.value)}
                  >
                    <option value="easy">easy</option>
                    <option value="medium">medium</option>
                    <option value="hard">hard</option>
                  </select>
                </div>
                <input
                  className="question-input"
                  value={q.question}
                  onChange={(e) => handleQuestionChange(idx, "question", e.target.value)}
                />
                {q.questionType === "mcq" ? (
                  <div className="options-grid">
                    {q.options?.map((opt, optIdx) => (
                      <div key={optIdx} className="option-item">
                        <span className="badge">{String.fromCharCode(65 + optIdx)}</span>
                        <input
                          value={opt}
                          onChange={(e) =>
                            handleQuestionChange(idx, "options", e.target.value, optIdx)
                          }
                        />
                        <label className="radio">
                          <input
                            type="radio"
                            name={`correct-${idx}`}
                            checked={q.correctAnswer === String.fromCharCode(65 + optIdx)}
                            onChange={() =>
                              handleQuestionChange(
                                idx,
                                "correctAnswer",
                                String.fromCharCode(65 + optIdx)
                              )
                            }
                          />
                          Correct
                        </label>
                      </div>
                    ))}
                  </div>
                ) : q.questionType === "true_false" ? (
                  <div className="tf-row">
                    <label className="radio">
                      <input
                        type="radio"
                        name={`tf-${idx}`}
                        checked={q.correctAnswer === true}
                        onChange={() => handleQuestionChange(idx, "correctAnswer", true)}
                      />
                      True
                    </label>
                    <label className="radio">
                      <input
                        type="radio"
                        name={`tf-${idx}`}
                        checked={q.correctAnswer === false}
                        onChange={() => handleQuestionChange(idx, "correctAnswer", false)}
                      />
                      False
                    </label>
                  </div>
                ) : q.questionType === "short_answer" ? (
                  <div className="short-answer-admin">
                    <label className="muted">Expected answer (1 sentence, ~{q.maxWords || 25} words)</label>
                    <textarea
                      rows={2}
                      value={q.correctAnswer || ""}
                      onChange={(e) => handleQuestionChange(idx, "correctAnswer", e.target.value)}
                      placeholder="Provide the reference answer (used for review)"
                    />
                  </div>
                ) : q.questionType === "brief_answer" ? (
                  <div className="short-answer-admin">
                    <label className="muted">Expected answer (2-3 sentences, ~{q.maxWords || 75} words)</label>
                    <textarea
                      rows={4}
                      value={q.correctAnswer || ""}
                      onChange={(e) => handleQuestionChange(idx, "correctAnswer", e.target.value)}
                      placeholder="Provide the reference answer (used for review)"
                    />
                  </div>
                ) : q.questionType === "long_answer" ? (
                  <div className="short-answer-admin">
                    <label className="muted">Expected answer (paragraph, ~{q.maxWords || 300} words)</label>
                    <textarea
                      rows={8}
                      value={q.correctAnswer || ""}
                      onChange={(e) => handleQuestionChange(idx, "correctAnswer", e.target.value)}
                      placeholder="Provide the reference answer (used for review)"
                    />
                  </div>
                ) : (
                  <div className="short-answer-admin">
                    <label className="muted">Expected answer</label>
                    <textarea
                      rows={3}
                      value={q.correctAnswer || ""}
                      onChange={(e) => handleQuestionChange(idx, "correctAnswer", e.target.value)}
                      placeholder="Provide the reference answer (used for review)"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

            {generatedQuestions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>4) Assignment Details</h3>
            <div className="muted">Select users and set due date</div>
          </div>
          <div className="grid two">
            <div className="input-group">
              <label>Assignment Title *</label>
              <input
                value={assignmentData.title}
                onChange={(e) =>
                  setAssignmentData((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g., Chapter 3 Comprehension"
              />
            </div>
            <div className="input-group">
              <label>Duration (minutes)</label>
              <select
                value={assignmentData.duration}
                onChange={(e) =>
                  setAssignmentData((p) => ({ ...p, duration: parseInt(e.target.value) }))
                }
              >
                {[15, 30, 45, 60, 90, 120].map((d) => (
                  <option key={d} value={d}>
                    {d} min
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="input-group">
            <label>Description</label>
            <textarea
              rows={3}
              value={assignmentData.description}
              onChange={(e) =>
                setAssignmentData((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Optional notes for students..."
            />
          </div>
          <div className="input-group">
            <label>End Date *</label>
            <input
              type="datetime-local"
              value={assignmentData.endDate}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) =>
                setAssignmentData((p) => ({ ...p, endDate: e.target.value }))
              }
            />
          </div>

          <div className="input-group">
            <label>Assign to Users *</label>
            <div className="assignee-list">
              {users.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  className={`chip ${assignmentData.assignedTo.includes(u._id) ? "active" : ""}`}
                  onClick={() => toggleAssignee(u._id)}
                >
                  <span>{u.name || u.email}</span>
                  <small>{u.email}</small>
                </button>
              ))}
            </div>
            <div className="muted small">
              {assignmentData.assignedTo.length} user(s) selected
            </div>
          </div>

          <button
            className="btn primary"
            onClick={handleCreateAssignment}
            disabled={isCreatingAssignment}
          >
            {isCreatingAssignment ? "Creating..." : "Create & Assign"}
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadPdfAssignment;
