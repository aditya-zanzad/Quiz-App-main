import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import passport from "passport";
import session from "express-session";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import cron from "node-cron";
import { createServer } from "http";

// ✅ Load environment variables
dotenv.config();

// ✅ Passport Google strategy
import "./config/passport.js";

// Route Imports
import userRoutes from "./routes/userRoutes.js";
import apiRoutes from "./routes/api.js";
import requestLogger from "./middleware/requestLogger.js";
import errorHandler from "./services/errorHandler.js";
import writtenTestRoutes from "./routes/writtenTestRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import intelligenceRoutes from "./routes/intelligenceRoutes.js"; // Phase 2
import debugRoutes from "./routes/debugRoutes.js"; // Temporary

// Phase 3: Social & Gamification
import socialRoutes from "./routes/socialRoutes.js";
import studyGroupRoutes from "./routes/studyGroupRoutes.js";
import gamificationRoutes from "./routes/gamificationRoutes.js";

// Phase 4: Next-Gen Features
import aiStudyBuddyRoutes from "./routes/aiStudyBuddyRoutes.js";
import realTimeQuizRoutes from "./routes/realTimeQuizRoutes.js";
import { initializeRealTimeQuiz } from "./controllers/realTimeQuizController.js";

// Phase 5: Advanced Learning Path Engine
import learningPathRoutes from "./routes/learningPathRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

// Gamification controller
import { resetDailyChallenges } from "./controllers/gamificationController.js";


rateLimit.prototype.defaults.validate = {
  xForwardedForHeader: false
};
const app = express();
app.set('trust proxy', 1);

// 🔒 SECURITY: Headers
app.use(requestLogger);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.emailjs.com"]
        },
    },
    crossOriginEmbedderPolicy: false
}));

// 🔒 Rate limiting



const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
    xForwardedForHeader: false 
  }
});
app.use(limiter);

// Stricter auth limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many authentication attempts, please try again later." },
    skip: (req) => req.method === "OPTIONS",
    validate: { xForwardedForHeader: false }
});

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(mongoSanitize());

// CORS handling
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://quiz-app-frontend-otvk.onrender.com"
        ].filter(Boolean);

        const isOriginAllowed = allowedOrigins.some(allowed =>
            allowed === origin || allowed.replace(/\/$/, "") === origin.replace(/\/$/, "")
        );

        if (isOriginAllowed) return callback(null, true);
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cache-Control", "X-File-Name"],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false
};
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", (req, res) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,Accept,Origin,Cache-Control,X-File-Name");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400");
    res.sendStatus(200);
});

// Session (in-memory)
const sessionConfig = {
    secret: process.env.GOOGLE_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "quiz-app-session",
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
};
console.log("ℹ️ Using in-memory session store (Redis disabled)");
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// Test route
app.get("/ping", (req, res) => res.status(200).send("Server is awake"));

// Routes
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/users", userRoutes);
app.use("/api", apiRoutes);
app.use("/api/written-tests", writtenTestRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/study-groups", studyGroupRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/ai-study-buddy", aiStudyBuddyRoutes);
app.use("/api/real-time-quiz", realTimeQuizRoutes);
app.use("/api/learning-paths", learningPathRoutes);
app.use("/api/reviews", reviewRoutes);

// Global error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
}));

// MongoDB + Server
const PORT = process.env.PORT || 4000;
const startServer = async () => {
    try {
        await mongoose.connect("mongodb+srv://aditya-zanzad:Pass%40123@cluster0.b2qwzvo.mongodb.net/quizdb?retryWrites=true&w=majority&appName=Quiz-assignment", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ Connected to MongoDB");

        const server = createServer(app);
        initializeRealTimeQuiz(server);

        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
        });

        // Daily challenge reset
        cron.schedule("0 * * * *", async () => {
            console.log("🔄 Running hourly daily challenge reset check...");
            try {
                const result = await resetDailyChallenges();
                if (result.success && result.usersReset > 0) {
                    console.log(`✅ Reset: ${result.usersReset} users across ${result.challengesModified} challenges`);
                }
            } catch (err) {
                console.error("❌ Error in scheduled reset:", err);
            }
        });

        // Run once at startup
        console.log("🚀 Running initial daily challenge reset check...");
        resetDailyChallenges().then(result => {
            if (result.success && result.usersReset > 0) {
                console.log(`✅ Startup reset: ${result.usersReset} users across ${result.challengesModified} challenges`);
            } else {
                console.log("📝 No challenges needed reset at startup");
            }
        }).catch(err => console.error("❌ Error in startup reset:", err));

    } catch (err) {
        console.error("❌ Server Startup Error:", err);
        process.exit(1);
    }
};

startServer();
