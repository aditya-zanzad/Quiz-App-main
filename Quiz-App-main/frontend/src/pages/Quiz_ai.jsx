import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';
import './Quiz_ai.css';

const Quiz_ai = () => {
  const [paragraph, setParagraph] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionType, setQuestionType] = useState('mcq');
  const [difficulty, setDifficulty] = useState('any');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    duration: 30,
    endDate: '',
    assignedTo: []
  });
  const [users, setUsers] = useState([]);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

  const handleGenerateQuestions = async () => {
    if (!paragraph.trim()) {
      setError('Please enter a paragraph to generate questions from.');
      return;
    }

    if (paragraph.length < 50) {
      setError('Paragraph must be at least 50 characters long for meaningful question generation.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/generate-from-text', {
        paragraph: paragraph.trim(),
        numQuestions,
        questionType,
        difficulty
      });

      if (response.data.success) {
        setGeneratedQuestions(response.data.questions);
        setSuccess(`Successfully generated ${response.data.questions.length} questions!`);
      } else {
        setError(response.data.error || 'Failed to generate questions');
      }
    } catch (err) {
      console.error('Error generating questions:', err);
      setError(err.response?.data?.error || 'Failed to generate questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    setParagraph('');
    setGeneratedQuestions([]);
    setError('');
    setSuccess('');
  };

  const handleSaveQuestions = () => {
    setSuccess('Questions generated successfully! You can copy them or save them to a quiz.');
  };

  // Fetch users for assignment
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    }
  };

  // Handle assignment form toggle
  const handleShowAssignmentForm = () => {
    if (generatedQuestions.length === 0) {
      setError('Please generate questions first before creating an assignment.');
      return;
    }
    setShowAssignmentForm(true);
    fetchUsers();
  };

  // Handle assignment creation
  const handleCreateAssignment = async () => {
    if (!assignmentData.title.trim()) {
      setError('Assignment title is required.');
      return;
    }

    if (!assignmentData.endDate) {
      setError('End date is required.');
      return;
    }

    if (assignmentData.assignedTo.length === 0) {
      setError('Please select at least one user to assign the assignment to.');
      return;
    }

    setIsCreatingAssignment(true);
    setError('');

    try {
      const response = await axios.post('/api/assignments', {
        title: assignmentData.title,
        description: assignmentData.description,
        originalParagraph: paragraph,
        questions: generatedQuestions,
        duration: assignmentData.duration,
        endDate: assignmentData.endDate,
        assignedTo: assignmentData.assignedTo
      });

      if (response.data.success) {
        setSuccess(`Assignment "${assignmentData.title}" created successfully and assigned to ${assignmentData.assignedTo.length} user(s)!`);
        setShowAssignmentForm(false);
        setAssignmentData({
          title: '',
          description: '',
          duration: 30,
          endDate: '',
          assignedTo: []
        });
      } else {
        setError(response.data.error || 'Failed to create assignment');
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(err.response?.data?.error || 'Failed to create assignment. Please try again.');
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  // Handle user selection for assignment
  const handleUserSelection = (userId) => {
    setAssignmentData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId]
    }));
  };

  return (
    <div className="quiz-ai-page">
      {/* Background Elements */}
      <div className="background-elements">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="quiz-ai-container">
        {/* Header Section */}
        <motion.div 
          className="quiz-ai-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="header-content">
            <motion.h1 
              className="main-title"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            >
              <span className="title-icon">🤖</span>
              AI Quiz Generator
            </motion.h1>
            <motion.p 
              className="subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Transform any text into intelligent quiz questions with the power of AI
            </motion.p>
          </div>
        </motion.div>

        {/* Main Form */}
        <motion.div 
          className="quiz-ai-form glass-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        >
          {/* Paragraph Input Section */}
          <motion.div 
            className="form-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <label htmlFor="paragraph" className="section-label">
              <span className="label-icon">📝</span>
              Enter your paragraph
            </label>
            <div className="input-wrapper">
              <textarea
                id="paragraph"
                value={paragraph}
                onChange={(e) => setParagraph(e.target.value)}
                placeholder="Paste your paragraph here... (minimum 50 characters)"
                rows={8}
                className="paragraph-input glass-input"
              />
              <div className="input-decoration"></div>
            </div>
            <div className="character-count">
              <span className="count-text">{paragraph.length}</span>
              <span className="count-label">characters</span>
            </div>
          </motion.div>

          {/* Controls Section */}
          <motion.div 
            className="form-controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="control-group">
              <label htmlFor="numQuestions" className="control-label">
                <span className="control-icon">🔢</span>
                Questions
              </label>
              <div className="select-wrapper">
                <select
                  id="numQuestions"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="glass-select"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <div className="select-arrow">▼</div>
              </div>
            </div>

            <div className="control-group">
              <label htmlFor="questionType" className="control-label">
                <span className="control-icon">📋</span>
                Type
              </label>
              <div className="select-wrapper">
                <select
                  id="questionType"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="glass-select"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                </select>
                <div className="select-arrow">▼</div>
              </div>
            </div>

            <div className="control-group">
              <label htmlFor="difficulty" className="control-label">
                <span className="control-icon">⚡</span>
                Difficulty
              </label>
              <div className="select-wrapper">
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="glass-select"
                >
                  <option value="any">Any Level</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <div className="select-arrow">▼</div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="form-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <motion.button
              onClick={handleGenerateQuestions}
              disabled={isLoading || !paragraph.trim()}
              className="generate-btn primary-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="btn-icon">
                {isLoading ? '🔄' : '🚀'}
              </span>
              <span className="btn-text">
                {isLoading ? 'Generating...' : 'Generate Questions'}
              </span>
              {isLoading && <div className="btn-loader"></div>}
            </motion.button>
            
            <motion.button
              onClick={handleClearAll}
              className="clear-btn secondary-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="btn-icon">🗑️</span>
              <span className="btn-text">Clear All</span>
            </motion.button>
          </motion.div>

          {/* Status Messages */}
          <AnimatePresence>
            {error && (
              <motion.div 
                className="status-message error-message"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="message-icon">❌</span>
                <span className="message-text">{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div 
                className="status-message success-message"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="message-icon">✅</span>
                <span className="message-text">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Generated Questions Section */}
        <AnimatePresence>
          {generatedQuestions.length > 0 && (
            <motion.div 
              className="generated-questions glass-card"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="questions-header">
                <h2 className="questions-title">
                  <span className="title-icon">📋</span>
                  Generated Questions
                </h2>
                <div className="questions-count">
                  {generatedQuestions.length} question{generatedQuestions.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="questions-list">
                {generatedQuestions.map((question, index) => (
                  <motion.div 
                    key={index} 
                    className="question-card glass-card-small"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <div className="question-header">
                      <span className="question-number">Q{index + 1}</span>
                      <span className={`difficulty-badge ${question.difficulty}`}>
                        {question.difficulty}
                      </span>
                    </div>
                    
                    <div className="question-text">
                      {question.question}
                    </div>

                    {questionType === 'mcq' ? (
                      <div className="question-options">
                        {question.options.map((option, optionIndex) => (
                          <motion.div
                            key={optionIndex}
                            className={`option ${question.correctAnswer === String.fromCharCode(65 + optionIndex) ? 'correct' : ''}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (index * 0.1) + (optionIndex * 0.05) + 0.3 }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <span className="option-letter">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span className="option-text">{option}</span>
                            {question.correctAnswer === String.fromCharCode(65 + optionIndex) && (
                              <span className="correct-indicator">✓</span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="true-false-answer">
                        <span className={`answer ${question.correctAnswer ? 'true' : 'false'}`}>
                          {question.correctAnswer ? 'True' : 'False'}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="questions-actions">
                <motion.button 
                  onClick={handleShowAssignmentForm} 
                  className="action-btn assignment-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="btn-icon">📝</span>
                  <span className="btn-text">Create Assignment</span>
                </motion.button>
                
                <motion.button 
                  onClick={handleSaveQuestions} 
                  className="action-btn save-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="btn-icon">💾</span>
                  <span className="btn-text">Save Questions</span>
                </motion.button>
                
                <motion.button 
                  onClick={() => window.print()} 
                  className="action-btn print-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="btn-icon">🖨️</span>
                  <span className="btn-text">Print Questions</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assignment Creation Modal */}
        <AnimatePresence>
          {showAssignmentForm && (
            <motion.div 
              className="assignment-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignmentForm(false)}
            >
              <motion.div 
                className="assignment-modal glass-card"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3 className="modal-title">
                    <span className="title-icon">📝</span>
                    Create Assignment
                  </h3>
                  <button 
                    className="close-modal-btn"
                    onClick={() => setShowAssignmentForm(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="modal-content">
                  <div className="form-group">
                    <label className="form-label">Assignment Title *</label>
                    <input
                      type="text"
                      className="glass-input"
                      value={assignmentData.title}
                      onChange={(e) => setAssignmentData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter assignment title..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="glass-input"
                      rows={3}
                      value={assignmentData.description}
                      onChange={(e) => setAssignmentData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter assignment description..."
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Duration (minutes) *</label>
                      <select
                        className="glass-select"
                        value={assignmentData.duration}
                        onChange={(e) => setAssignmentData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                        <option value={90}>90 minutes</option>
                        <option value={120}>120 minutes</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">End Date *</label>
                      <input
                        type="datetime-local"
                        className="glass-input"
                        value={assignmentData.endDate}
                        onChange={(e) => setAssignmentData(prev => ({ ...prev, endDate: e.target.value }))}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assign to Users *</label>
                    <div className="users-selection">
                      {users.map(user => (
                        <motion.div
                          key={user._id}
                          className={`user-option ${assignmentData.assignedTo.includes(user._id) ? 'selected' : ''}`}
                          onClick={() => handleUserSelection(user._id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="user-info">
                            <span className="user-name">{user.name}</span>
                            <span className="user-email">{user.email}</span>
                          </div>
                          <div className="selection-indicator">
                            {assignmentData.assignedTo.includes(user._id) ? '✓' : '○'}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="selection-summary">
                      {assignmentData.assignedTo.length} user(s) selected
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <motion.button
                    onClick={() => setShowAssignmentForm(false)}
                    className="cancel-btn secondary-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    onClick={handleCreateAssignment}
                    disabled={isCreatingAssignment}
                    className="create-btn primary-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isCreatingAssignment ? 'Creating...' : 'Create Assignment'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Quiz_ai;