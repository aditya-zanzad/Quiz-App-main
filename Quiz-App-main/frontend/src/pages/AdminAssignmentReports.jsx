import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';
import './AdminAssignmentReports.css';

const AdminAssignmentReports = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('/api/assignments/admin');
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

  const fetchAssignmentDetails = async (assignmentId) => {
    try {
      const response = await axios.get(`/api/assignments/${assignmentId}/reports`);
      if (response.data.success) {
        setSelectedAssignment(response.data);
        setShowDetails(true);
      }
    } catch (err) {
      console.error('Error fetching assignment details:', err);
      setError('Failed to fetch assignment details');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'expired': return '#dc3545';
      case 'scheduled': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-assignment-reports-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading assignment reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-assignment-reports-page">
      <div className="reports-container">
        <div className="reports-header">
          <h1>📊 Assignment Reports</h1>
          <p>Monitor assignment performance and student progress</p>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        <div className="assignments-grid">
          {assignments.length === 0 ? (
            <div className="no-assignments">
              <div className="no-assignments-icon">📚</div>
              <h3>No assignments found</h3>
              <p>Create assignments to view reports here.</p>
            </div>
          ) : (
            assignments.map((assignment, index) => (
              <motion.div
                key={assignment._id}
                className="assignment-report-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="card-header">
                  <h3 className="assignment-title">{assignment.title}</h3>
                  <span 
                    className="assignment-status"
                    style={{ color: getStatusColor(assignment.status) }}
                  >
                    {assignment.status}
                  </span>
                </div>

                <div className="assignment-metrics">
                  <div className="metric">
                    <span className="metric-label">📊 Total Questions</span>
                    <span className="metric-value">{assignment.totalQuestions}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">👥 Assigned To</span>
                    <span className="metric-value">{assignment.assignedTo.length}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">📝 Submissions</span>
                    <span className="metric-value">{assignment.statistics.totalAttempts}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">✅ Passed</span>
                    <span className="metric-value">{assignment.statistics.passedAttempts}</span>
                  </div>
                </div>

                <div className="performance-stats">
                  <div className="stat">
                    <span className="stat-label">Average Score</span>
                    <span className="stat-value">{assignment.statistics.averageScore.toFixed(1)}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Average Time</span>
                    <span className="stat-value">{assignment.statistics.averageTime.toFixed(1)} min</span>
                  </div>
                </div>

                <div className="assignment-info">
                  <div className="info-item">
                    <span className="info-label">📅 End Date:</span>
                    <span className="info-value">{formatDate(assignment.endDate)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">⏱️ Duration:</span>
                    <span className="info-value">{assignment.duration} minutes</span>
                  </div>
                </div>

                <div className="card-actions">
                  <motion.button
                    onClick={() => fetchAssignmentDetails(assignment._id)}
                    className="view-details-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📈 View Details
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Assignment Details Modal */}
        <AnimatePresence>
          {showDetails && selectedAssignment && (
            <motion.div 
              className="details-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
            >
              <motion.div 
                className="details-modal glass-card"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3 className="modal-title">
                    <span className="title-icon">📈</span>
                    Assignment Analytics
                  </h3>
                  <button 
                    className="close-modal-btn"
                    onClick={() => setShowDetails(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="modal-content">
                  <div className="assignment-summary">
                    <h4>{selectedAssignment.assignment.title}</h4>
                    <p>Total Questions: {selectedAssignment.assignment.totalQuestions} | Duration: {selectedAssignment.assignment.duration} minutes</p>
                  </div>

                  <div className="analytics-grid">
                    <div className="analytics-card">
                      <h5>📊 Overall Statistics</h5>
                      <div className="stats-list">
                        <div className="stat-item">
                          <span>Total Assigned:</span>
                          <span>{selectedAssignment.analytics.totalAssigned}</span>
                        </div>
                        <div className="stat-item">
                          <span>Total Submissions:</span>
                          <span>{selectedAssignment.analytics.totalSubmissions}</span>
                        </div>
                        <div className="stat-item">
                          <span>Submission Rate:</span>
                          <span>{selectedAssignment.analytics.submissionRate}%</span>
                        </div>
                        <div className="stat-item">
                          <span>Pass Rate:</span>
                          <span>{selectedAssignment.analytics.passRate}%</span>
                        </div>
                        <div className="stat-item">
                          <span>Average Score:</span>
                          <span>{selectedAssignment.analytics.averageScore ? selectedAssignment.analytics.averageScore.toFixed(1) : 0}%</span>
                        </div>
                        <div className="stat-item">
                          <span>Average Time:</span>
                          <span>{selectedAssignment.analytics.averageTime ? selectedAssignment.analytics.averageTime.toFixed(1) : 0} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="analytics-card">
                      <h5>📈 Score Distribution</h5>
                      <div className="distribution-chart">
                        <div className="distribution-item">
                          <span className="dist-label">Excellent (90%+)</span>
                          <div className="dist-bar">
                            <div 
                              className="dist-fill excellent"
                              style={{ width: `${selectedAssignment.analytics.totalSubmissions > 0 && selectedAssignment.analytics.scoreDistribution ? (selectedAssignment.analytics.scoreDistribution.excellent / selectedAssignment.analytics.totalSubmissions) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="dist-count">{selectedAssignment.analytics.scoreDistribution?.excellent || 0}</span>
                        </div>
                        <div className="distribution-item">
                          <span className="dist-label">Good (70-89%)</span>
                          <div className="dist-bar">
                            <div 
                              className="dist-fill good"
                              style={{ width: `${selectedAssignment.analytics.totalSubmissions > 0 && selectedAssignment.analytics.scoreDistribution ? (selectedAssignment.analytics.scoreDistribution.good / selectedAssignment.analytics.totalSubmissions) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="dist-count">{selectedAssignment.analytics.scoreDistribution?.good || 0}</span>
                        </div>
                        <div className="distribution-item">
                          <span className="dist-label">Average (50-69%)</span>
                          <div className="dist-bar">
                            <div 
                              className="dist-fill average"
                              style={{ width: `${selectedAssignment.analytics.totalSubmissions > 0 && selectedAssignment.analytics.scoreDistribution ? (selectedAssignment.analytics.scoreDistribution.average / selectedAssignment.analytics.totalSubmissions) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="dist-count">{selectedAssignment.analytics.scoreDistribution?.average || 0}</span>
                        </div>
                        <div className="distribution-item">
                          <span className="dist-label">Poor (&lt;50%)</span>
                          <div className="dist-bar">
                            <div 
                              className="dist-fill poor"
                              style={{ width: `${selectedAssignment.analytics.totalSubmissions > 0 && selectedAssignment.analytics.scoreDistribution ? (selectedAssignment.analytics.scoreDistribution.poor / selectedAssignment.analytics.totalSubmissions) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="dist-count">{selectedAssignment.analytics.scoreDistribution?.poor || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="submissions-table">
                    <h5>📝 Student Submissions</h5>
                    <div className="table-container">
                      <table className="submissions-table-content">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Score</th>
                            <th>Percentage</th>
                            <th>Status</th>
                            <th>Time Taken</th>
                            <th>Submitted At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAssignment.submissions.map((submission, index) => (
                            <tr key={index}>
                              <td>
                                <div className="student-info">
                                  <span className="student-name">{submission.user.name}</span>
                                  <span className="student-email">{submission.user.email}</span>
                                </div>
                              </td>
                              <td>{submission.score}/{selectedAssignment.assignment.totalMarks}</td>
                              <td>{submission.percentage}%</td>
                              <td>
                                <span className={`status-badge ${submission.status}`}>
                                  {submission.status.toUpperCase()}
                                </span>
                              </td>
                              <td>{submission.timeTaken.toFixed(1)} min</td>
                              <td>{formatDate(submission.submittedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminAssignmentReports;
