import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import {
    createAssignment,
    getAssignments,
    getUserAssignments,
    getAssignment,
    submitAssignment,
    getAssignmentReports,
    updateAssignment,
    deleteAssignment
} from "../controllers/assignmentController.js";

const router = Router();

// Assignment Routes
router.post("/", verifyToken, createAssignment);
router.get("/admin", verifyToken, getAssignments);
router.get("/user", verifyToken, getUserAssignments);
router.get("/:id", verifyToken, getAssignment);
router.post("/:id/submit", verifyToken, submitAssignment);
router.get("/:id/reports", verifyToken, getAssignmentReports);
router.put("/:id", verifyToken, updateAssignment);
router.delete("/:id", verifyToken, deleteAssignment);

export default router;
