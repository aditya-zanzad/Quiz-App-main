import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';
import './UserAssignments.css';

const UserAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('/api/assignments/user');
      if (response.data.success) {
        setAssignments(response.data.assignments);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Failed to fetch assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const startAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setAnswers(
      new Array(assignment.questions.length).fill({
        selectedAnswer: "",
        timeSpent: 0,
      })
    );
    setCurrentQuestion(0);
    setTimeLeft(assignment.duration * 60); // Convert minutes to seconds
    setShowQuiz(true);
    setQuizStarted(true);
  };

  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && quizStarted) {
      handleSubmitAssignment();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, quizStarted]);

  const handleAnswerSelect = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = {
      selectedAnswer: answer,
      timeSpent: selectedAssignment.duration * 60 - timeLeft,
    };
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < selectedAssignment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitAssignment = async () => {
    setSubmitting(true);
    try {
      const timeTaken = selectedAssignment.duration - (timeLeft / 60);
      const response = await axios.post(`/api/assignments/${selectedAssignment._id}/submit`, {
        answers: answers.map((answer, index) => ({
          questionIndex: index,
          selectedAnswer: answer.selectedAnswer,
          timeSpent: answer.timeSpent
        })),
        timeTaken
      });

      if (response.data.success) {
        setError('');
        setShowQuiz(false);
        setQuizStarted(false);
        fetchAssignments(); // Refresh assignments to show updated status
        alert(`Assignment submitted! Score: ${response.data.result.score}/${response.data.result.totalMarks} (${response.data.result.percentage}%)`);
      }
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setError(err.response?.data?.error || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#28a745';
      case 'expired': return '#dc3545';
      case 'upcoming': return '#ffc107';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="user-assignments-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (showQuiz && selectedAssignment) {
    const question = selectedAssignment.questions[currentQuestion];
    const currentAnswer = answers[currentQuestion]?.selectedAnswer ?? "";

    return (
      <div className="quiz-page">
        <div className="quiz-header">
          <div className="quiz-info">
            <h2>{selectedAssignment.title}</h2>
            <p>Question {currentQuestion + 1} of {selectedAssignment.questions.length}</p>
          </div>
          <div className="quiz-timer">
            <span className="timer-text">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="quiz-progress">
          <div 
            className="progress-bar"
            style={{ width: `${((currentQuestion + 1) / selectedAssignment.questions.length) * 100}%` }}
          ></div>
        </div>

        <div className="question-container">
          <div className="question-card">
            <div className="question-header">
              <span className="question-number">Q{currentQuestion + 1}</span>
              <span className={`difficulty-badge ${question.difficulty}`}>
                {question.difficulty}
              </span>
            </div>
            
            <div className="question-text">
              {question.question}
            </div>

            {question.questionType === "mcq" && (
              <div className="question-options">
                {question.options.map((option, index) => (
                  <motion.div
                    key={index}
                    className={`option ${
                      currentAnswer === String.fromCharCode(65 + index) ? "selected" : ""
                    }`}
                    onClick={() => handleAnswerSelect(String.fromCharCode(65 + index))}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="option-text">{option}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {question.questionType === "true_false" && (
              <div className="question-options tf-options">
                <motion.div
                  className={`option ${currentAnswer === true ? "selected" : ""}`}
                  onClick={() => handleAnswerSelect(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="option-letter">T</span>
                  <span className="option-text">True</span>
                </motion.div>
                <motion.div
                  className={`option ${currentAnswer === false ? "selected" : ""}`}
                  onClick={() => handleAnswerSelect(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="option-letter">F</span>
                  <span className="option-text">False</span>
                </motion.div>
              </div>
            )}

            {question.questionType === "short_answer" && (
              <div className="short-answer">
                <label className="muted">Your answer (1 sentence, ~{question.maxWords || 25} words)</label>
                <textarea
                  rows={2}
                  value={currentAnswer}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  placeholder="Type your short answer..."
                />
              </div>
            )}

            {question.questionType === "brief_answer" && (
              <div className="short-answer">
                <label className="muted">Your answer (2-3 sentences, ~{question.maxWords || 75} words)</label>
                <textarea
                  rows={4}
                  value={currentAnswer}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  placeholder="Type your brief answer (2-3 sentences)..."
                />
                <div className="word-count">
                  {currentAnswer.split(/\s+/).filter(w => w.length > 0).length} words
                </div>
              </div>
            )}

            {question.questionType === "long_answer" && (
              <div className="short-answer">
                <label className="muted">Your answer (detailed paragraph, ~{question.maxWords || 300} words)</label>
                <textarea
                  rows={10}
                  value={currentAnswer}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  placeholder="Type your detailed answer (paragraph)..."
                />
                <div className="word-count">
                  {currentAnswer.split(/\s+/).filter(w => w.length > 0).length} words
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="quiz-navigation">
          <button 
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className="nav-btn prev-btn"
          >
            Previous
          </button>
          
          <div className="question-indicators">
            {selectedAssignment.questions.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentQuestion ? 'active' : ''} ${answers[index]?.selectedAnswer ? 'answered' : ''}`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion === selectedAssignment.questions.length - 1 ? (
            <button 
              onClick={handleSubmitAssignment}
              disabled={submitting}
              className="nav-btn submit-btn"
            >
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          ) : (
            <button 
              onClick={nextQuestion}
              className="nav-btn next-btn"
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="user-assignments-page">
      <div className="assignments-container">
        <div className="assignments-header">
          <h1>📝 My Assignments</h1>
          <p>Complete your assigned quizzes and track your progress</p>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        <div className="assignments-list">
          {assignments.length === 0 ? (
            <div className="no-assignments">
              <div className="no-assignments-icon">📚</div>
              <h3>No assignments available</h3>
              <p>You don't have any assignments at the moment.</p>
            </div>
          ) : (
            assignments.map((assignment, index) => (
              <motion.div
                key={assignment._id}
                className="assignment-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="assignment-header">
                  <h3 className="assignment-title">{assignment.title}</h3>
                  <span 
                    className="assignment-status"
                    style={{ color: getStatusColor(assignment.status) }}
                  >
                    {assignment.status}
                  </span>
                </div>

                <div className="assignment-info">
                  <div className="info-item">
                    <span className="info-label">📊 Questions:</span>
                    <span className="info-value">{assignment.totalQuestions}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">⏱️ Duration:</span>
                    <span className="info-value">{assignment.duration} minutes</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">📅 End Date:</span>
                    <span className="info-value">
                      {new Date(assignment.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">👨‍🏫 Created by:</span>
                    <span className="info-value">{assignment.createdBy.name}</span>
                  </div>
                </div>

                {assignment.description && (
                  <div className="assignment-description">
                    <p>{assignment.description}</p>
                  </div>
                )}

                {assignment.userSubmission ? (
                  <div className="submission-info">
                    <div className="submission-result">
                      <span className="result-label">Your Score:</span>
                      <span className={`result-score ${assignment.userSubmission.status}`}>
                        {assignment.userSubmission.score}/{assignment.totalMarks} ({assignment.userSubmission.percentage}%)
                      </span>
                    </div>
                    <div className="submission-status">
                      Status: <span className={assignment.userSubmission.status}>
                        {assignment.userSubmission.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="assignment-actions">
                    {assignment.canTake ? (
                      <motion.button
                        onClick={() => startAssignment(assignment)}
                        className="start-assignment-btn"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        🚀 Start Assignment
                      </motion.button>
                    ) : (
                      <div className="cannot-take">
                        {assignment.status === 'expired' ? 'Assignment expired' : 'Assignment not available'}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAssignments;
