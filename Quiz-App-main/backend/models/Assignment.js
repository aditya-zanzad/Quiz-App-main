import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    originalParagraph: {
        type: String,
        required: true
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        options: [{
            type: String,
            required: true
        }],
        correctAnswer: {
            type: String,
            required: true
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            required: true
        },
        questionType: {
            type: String,
            enum: ['mcq', 'true_false'],
            default: 'mcq'
        }
    }],
    totalQuestions: {
        type: Number,
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    passingMarks: {
        type: Number,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'mixed'],
        default: 'mixed'
    },
    questionType: {
        type: String,
        enum: ['mcq', 'true_false', 'mixed'],
        default: 'mcq'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    submissions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        answers: [{
            questionIndex: Number,
            selectedAnswer: String,
            isCorrect: Boolean,
            timeSpent: Number // in seconds
        }],
        score: {
            type: Number,
            required: true
        },
        percentage: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['passed', 'failed', 'incomplete'],
            required: true
        },
        submittedAt: {
            type: Date,
            default: Date.now
        },
        timeTaken: {
            type: Number, // in minutes
            required: true
        }
    }],
    statistics: {
        totalAttempts: {
            type: Number,
            default: 0
        },
        passedAttempts: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        },
        averageTime: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Index for better query performance
assignmentSchema.index({ createdBy: 1, isActive: 1 });
assignmentSchema.index({ assignedTo: 1, isActive: 1 });
assignmentSchema.index({ endDate: 1 });

// Virtual for assignment status
assignmentSchema.virtual('status').get(function() {
    const now = new Date();
    if (now < this.startDate) return 'scheduled';
    if (now > this.endDate) return 'expired';
    return 'active';
});

// Method to calculate statistics
assignmentSchema.methods.calculateStatistics = function() {
    if (this.submissions.length === 0) {
        this.statistics = {
            totalAttempts: 0,
            passedAttempts: 0,
            averageScore: 0,
            averageTime: 0
        };
        return;
    }

    const totalAttempts = this.submissions.length;
    const passedAttempts = this.submissions.filter(sub => sub.status === 'passed').length;
    const totalScore = this.submissions.reduce((sum, sub) => sum + sub.score, 0);
    const totalTime = this.submissions.reduce((sum, sub) => sum + sub.timeTaken, 0);

    this.statistics = {
        totalAttempts,
        passedAttempts,
        averageScore: Math.round((totalScore / totalAttempts) * 100) / 100,
        averageTime: Math.round((totalTime / totalAttempts) * 100) / 100
    };
};

// Method to check if user can take assignment
assignmentSchema.methods.canUserTakeAssignment = function(userId) {
    const now = new Date();
    
    // Check if assignment is active
    if (!this.isActive) return false;
    
    // Check if within time range
    if (now < this.startDate || now > this.endDate) return false;
    
    // Check if user is assigned
    if (!this.assignedTo.includes(userId)) return false;
    
    // Check if user already submitted
    const existingSubmission = this.submissions.find(sub => sub.user.toString() === userId.toString());
    if (existingSubmission) return false;
    
    return true;
};

// Method to get user's submission
assignmentSchema.methods.getUserSubmission = function(userId) {
    return this.submissions.find(sub => sub.user.toString() === userId.toString());
};

export default mongoose.model('Assignment', assignmentSchema);
