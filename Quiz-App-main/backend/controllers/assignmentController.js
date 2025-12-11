import Assignment from "../models/Assignment.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

// ✅ Create Assignment from AI Generated Questions
export const createAssignment = async (req, res) => {
    logger.info(`Creating assignment: ${req.body.title}`);
    try {
        const {
            title,
            description,
            originalParagraph,
            questions,
            duration = 30, // default 30 minutes
            endDate,
            assignedTo = [] // array of user IDs
        } = req.body;

        const createdBy = req.user.id;

        if (!title || !originalParagraph || !questions || questions.length === 0) {
            return res.status(400).json({
                error: "Title, original paragraph, and questions are required"
            });
        }

        if (!endDate) {
            return res.status(400).json({
                error: "End date is required"
            });
        }

        // Calculate assignment metrics
        const totalQuestions = questions.length;
        const totalMarks = totalQuestions; // 1 mark per question
        const passingMarks = Math.ceil(totalMarks * 0.6); // 60% passing

        // Determine overall difficulty and question type
        const difficulties = [...new Set(questions.map(q => q.difficulty))];
        const questionTypes = [...new Set(questions.map(q => q.questionType))];

        const overallDifficulty = difficulties.length === 1 ? difficulties[0] : 'mixed';
        const overallQuestionType = questionTypes.length === 1 ? questionTypes[0] : 'mixed';

        const assignment = new Assignment({
            title,
            description,
            originalParagraph,
            questions,
            totalQuestions,
            totalMarks,
            duration,
            passingMarks,
            difficulty: overallDifficulty,
            questionType: overallQuestionType,
            createdBy,
            assignedTo,
            endDate: new Date(endDate)
        });

        await assignment.save();

        logger.info(`Assignment created successfully: ${assignment._id}`);

        res.status(201).json({
            success: true,
            message: "Assignment created successfully",
            assignment: {
                id: assignment._id,
                title: assignment.title,
                totalQuestions: assignment.totalQuestions,
                totalMarks: assignment.totalMarks,
                duration: assignment.duration,
                endDate: assignment.endDate,
                assignedTo: assignment.assignedTo.length
            }
        });

    } catch (error) {
        logger.error(`Error creating assignment: ${error.message}`);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

// ✅ Get Assignments for Admin
export const getAssignments = async (req, res) => {
    logger.info("Fetching assignments for admin");
    try {
        const createdBy = req.user.id;
        const { page = 1, limit = 10, status } = req.query;

        const query = { createdBy };

        // Filter by status
        if (status) {
            const now = new Date();
            switch (status) {
                case 'active':
                    query.isActive = true;
                    query.startDate = { $lte: now };
                    query.endDate = { $gte: now };
                    break;
                case 'expired':
                    query.endDate = { $lt: now };
                    break;
                case 'scheduled':
                    query.startDate = { $gt: now };
                    break;
            }
        }

        const assignments = await Assignment.find(query)
            .populate('assignedTo', 'name email')
            .populate('submissions.user', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Assignment.countDocuments(query);

        // Calculate statistics for each assignment
        assignments.forEach(assignment => {
            assignment.calculateStatistics();
        });

        res.json({
            success: true,
            assignments,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });

    } catch (error) {
        logger.error(`Error fetching assignments: ${error.message}`);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

// ✅ Get Assignments for User
export const getUserAssignments = async (req, res) => {
    logger.info(`Fetching assignments for user: ${req.user.id}`);
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;

        // Debug logging
        logger.info(`[DEBUG] User ID: ${userId}`);
        logger.info(`[DEBUG] User ID type: ${typeof userId}`);

        // Use $in operator to properly check if userId exists in assignedTo array
        const query = {
            assignedTo: { $in: [userId] },
            isActive: true
        };

        logger.info(`[DEBUG] Query: ${JSON.stringify(query)}`);

        // Filter by status
        if (status) {
            const now = new Date();
            switch (status) {
                case 'available':
                    query.startDate = { $lte: now };
                    query.endDate = { $gte: now };
                    break;
                case 'expired':
                    query.endDate = { $lt: now };
                    break;
                case 'upcoming':
                    query.startDate = { $gt: now };
                    break;
            }
        }

        const assignments = await Assignment.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Assignment.countDocuments(query);

        logger.info(`[DEBUG] Found ${assignments.length} assignments out of ${total} total`);

        // Log first assignment details if any exist
        if (assignments.length > 0) {
            logger.info(`[DEBUG] First assignment assignedTo: ${JSON.stringify(assignments[0].assignedTo)}`);
        }

        // Add user-specific information
        const assignmentsWithUserInfo = assignments.map(assignment => {
            const userSubmission = assignment.getUserSubmission(userId);
            const canTake = assignment.canUserTakeAssignment(userId);

            return {
                ...assignment.toObject(),
                userSubmission,
                canTake,
                status: assignment.status
            };
        });

        res.json({
            success: true,
            assignments: assignmentsWithUserInfo,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });

    } catch (error) {
        logger.error(`Error fetching user assignments: ${error.message}`);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

// ✅ Get Single Assignment
export const getAssignment = async (req, res) => {
    logger.info(`Fetching assignment: ${req.params.id}`);
    try {
        const assignmentId = req.params.id;
        const userId = req.user.id;

        const assignment = await Assignment.findById(assignmentId)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email');

        if (!assignment) {
            return res.status(404).json({
                error: "Assignment not found"
            });
        }

        // Check if user has access to this assignment
        const isCreator = assignment.createdBy._id.toString() === userId;
        const isAssigned = assignment.assignedTo.some(user => user._id.toString() === userId);

        if (!isCreator && !isAssigned) {
            return res.status(403).json({
                error: "Access denied"
            });
        }

        const userSubmission = assignment.getUserSubmission(userId);
        const canTake = assignment.canUserTakeAssignment(userId);

        res.json({
            success: true,
            assignment: {
                ...assignment.toObject(),
                userSubmission,
                canTake,
                status: assignment.status
            }
        });

    } catch (error) {
        logger.error(`Error fetching assignment: ${error.message}`);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

// ✅ Submit Assignment
export const submitAssignment = async (req, res) => {
    logger.info(`Submitting assignment: ${req.params.id} by user: ${req.user.id}`);
    try {
        const assignmentId = req.params.id;
        const userId = req.user.id;
        const { answers, timeTaken } = req.body;

        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({
                error: "Assignment not found"
            });
        }

        // Check if user can submit
        if (!assignment.canUserTakeAssignment(userId)) {
            return res.status(400).json({
                error: "Cannot submit this assignment"
            });
        }

        // Validate answers
        if (!answers || answers.length !== assignment.questions.length) {
            return res.status(400).json({
                error: "Invalid number of answers"
            });
        }

        // Calculate score
        let score = 0;
        const detailedAnswers = answers.map((answer, index) => {
            const question = assignment.questions[index];
            let isCorrect = false;

            // Handle different question types
            if (question.questionType === 'true_false') {
                // For true/false, convert string to boolean if needed
                const selectedBool = answer.selectedAnswer === 'true' || answer.selectedAnswer === true;
                const correctBool = question.correctAnswer === true || question.correctAnswer === 'true';
                isCorrect = selectedBool === correctBool;
            } else {
                // For MCQ, compare directly
                isCorrect = answer.selectedAnswer === question.correctAnswer;
            }

            if (isCorrect) score++;

            return {
                questionIndex: index,
                selectedAnswer: answer.selectedAnswer,
                isCorrect,
                timeSpent: answer.timeSpent || 0
            };
        });

        const percentage = Math.round((score / assignment.totalMarks) * 100);
        const status = percentage >= 60 ? 'passed' : 'failed';

        // Create submission
        const submission = {
            user: userId,
            answers: detailedAnswers,
            score,
            percentage,
            status,
            timeTaken: timeTaken || 0
        };

        assignment.submissions.push(submission);
        assignment.calculateStatistics();

        await assignment.save();

        logger.info(`Assignment submitted successfully. Score: ${score}/${assignment.totalMarks}`);

        res.json({
            success: true,
            message: "Assignment submitted successfully",
            result: {
                score,
                totalMarks: assignment.totalMarks,
                percentage,
                status,
                timeTaken
            }
        });

    } catch (error) {
        logger.error(`Error submitting assignment: ${error.message}`);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

// ✅ Get Assignment Reports
export const getAssignmentReports = async (req, res) => {
    logger.info(`Fetching assignment reports for: ${req.params.id}`);
    try {
        const assignmentId = req.params.id;
        const createdBy = req.user.id;

        const assignment = await Assignment.findById(assignmentId)
            .populate('submissions.user', 'name email')
            .populate('assignedTo', 'name email');

        if (!assignment) {
            return res.status(404).json({
                error: "Assignment not found"
            });
        }

        if (assignment.createdBy.toString() !== createdBy) {
            return res.status(403).json({
                error: "Access denied"
            });
        }

        assignment.calculateStatistics();

        // Detailed analytics
        const analytics = {
            totalAssigned: assignment.assignedTo.length,
            totalSubmissions: assignment.submissions.length,
            submissionRate: assignment.assignedTo.length > 0
                ? Math.round((assignment.submissions.length / assignment.assignedTo.length) * 100)
                : 0,
            passRate: assignment.submissions.length > 0
                ? Math.round((assignment.statistics.passedAttempts / assignment.submissions.length) * 100)
                : 0,
            averageScore: assignment.statistics.averageScore,
            averageTime: assignment.statistics.averageTime,
            scoreDistribution: {
                excellent: assignment.submissions.filter(s => s.percentage >= 90).length,
                good: assignment.submissions.filter(s => s.percentage >= 70 && s.percentage < 90).length,
                average: assignment.submissions.filter(s => s.percentage >= 50 && s.percentage < 70).length,
                poor: assignment.submissions.filter(s => s.percentage < 50).length
            }
        };

        res.json({
            success: true,
            assignment: {
                id: assignment._id,
                title: assignment.title,
                totalQuestions: assignment.totalQuestions,
                totalMarks: assignment.totalMarks,
                duration: assignment.duration,
                endDate: assignment.endDate,
                status: assignment.status
            },
            analytics,
            submissions: assignment.submissions,
            assignedUsers: assignment.assignedTo
        });

    } catch (error) {
        logger.error(`Error fetching assignment reports: ${error.message}`);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

// ✅ Update Assignment
export const updateAssignment = async (req, res) => {
    logger.info(`Updating assignment: ${req.params.id}`);
    try {
        const assignmentId = req.params.id;
        const createdBy = req.user.id;
        const updates = req.body;

        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({
                error: "Assignment not found"
            });
        }

        if (assignment.createdBy.toString() !== createdBy) {
            return res.status(403).json({
                error: "Access denied"
            });
        }

        // Don't allow updating if submissions exist
        if (assignment.submissions.length > 0) {
            return res.status(400).json({
                error: "Cannot update assignment with existing submissions"
            });
        }

        Object.assign(assignment, updates);
        await assignment.save();

        logger.info(`Assignment updated successfully: ${assignmentId}`);

        res.json({
            success: true,
            message: "Assignment updated successfully",
            assignment
        });

    } catch (error) {
        logger.error(`Error updating assignment: ${error.message}`);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

// ✅ Delete Assignment
export const deleteAssignment = async (req, res) => {
    logger.info(`Deleting assignment: ${req.params.id}`);
    try {
        const assignmentId = req.params.id;
        const createdBy = req.user.id;

        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({
                error: "Assignment not found"
            });
        }

        if (assignment.createdBy.toString() !== createdBy) {
            return res.status(403).json({
                error: "Access denied"
            });
        }

        await Assignment.findByIdAndDelete(assignmentId);

        logger.info(`Assignment deleted successfully: ${assignmentId}`);

        res.json({
            success: true,
            message: "Assignment deleted successfully"
        });

    } catch (error) {
        logger.error(`Error deleting assignment: ${error.message}`);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};
