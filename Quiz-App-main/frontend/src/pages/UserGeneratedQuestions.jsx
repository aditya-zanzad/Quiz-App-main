import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../utils/axios";
import "./UserGeneratedQuestions.css";

const UserGeneratedQuestions = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await axios.get("/api/assignments/user");
        if (res.data?.success) {
          setAssignments(res.data.assignments || []);
        } else {
          setError(res.data?.error || "Failed to load assignments");
        }
      } catch (err) {
        console.error("Error loading assignments:", err);
        setError(err.response?.data?.error || "Failed to load assignments");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const toggle = (id) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="user-generated-questions">
        <div className="ugq-card center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-generated-questions">
        <div className="ugq-card error">{error}</div>
      </div>
    );
  }

  if (!assignments.length) {
    return (
      <div className="user-generated-questions">
        <div className="ugq-card center">No assignments available.</div>
      </div>
    );
  }

  return (
    <div className="user-generated-questions">
      <div className="page-header">
        <div>
          <h1>📖 Assigned Questions (Read-only)</h1>
          <p>View the questions your admin assigned. Answers are disabled here.</p>
        </div>
      </div>

      <div className="ugq-list">
        {assignments.map((assignment) => (
          <div key={assignment._id} className="ugq-card">
            <div className="ugq-header" onClick={() => toggle(assignment._id)}>
              <div>
                <h3>{assignment.title}</h3>
                <p>{assignment.description || "No description"}</p>
              </div>
              <div className="meta">
                <span>{assignment.totalQuestions} questions</span>
                <span>Due: {new Date(assignment.endDate).toLocaleString()}</span>
              </div>
            </div>

            <AnimatePresence>
              {expanded === assignment._id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ugq-body"
                >
                  {assignment.questions.map((q, idx) => (
                    <div key={idx} className="ugq-question">
                      <div className="q-top">
                        <span className="badge">Q{idx + 1}</span>
                        <span className={`difficulty ${q.difficulty || "medium"}`}>
                          {q.difficulty || "medium"}
                        </span>
                        <span className="qtype">{q.questionType || "mcq"}</span>
                      </div>
                      <div className="q-text">{q.question}</div>

                      {q.questionType === "mcq" && (
                        <ul className="q-options">
                          {q.options?.map((opt, oi) => (
                            <li key={oi}>
                              <span className="opt-letter">
                                {String.fromCharCode(65 + oi)}
                              </span>
                              <span>{opt}</span>
                              {q.correctAnswer === String.fromCharCode(65 + oi) && (
                                <span className="correct">✓</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      {q.questionType === "true_false" && (
                        <div className="q-tf">
                          Correct answer: <strong>{q.correctAnswer ? "True" : "False"}</strong>
                        </div>
                      )}

                      {q.questionType === "short_answer" && (
                        <div className="q-short">
                          <div className="label">Answer (expected):</div>
                          <div className="short-box">{q.correctAnswer || "—"}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserGeneratedQuestions;



