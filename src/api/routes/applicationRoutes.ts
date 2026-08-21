import { Router } from "express";
import { generateDraft, queueApplication, updateApplicationStatus, getUserApplications } from "../controllers/applicationController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post(["/applications/generate-draft", "/applications/draft", "/application/draft"], authMiddleware, generateDraft);
router.post(["/applications/queue", "/application/queue"], authMiddleware, queueApplication);
router.patch("/applications/:id/status", authMiddleware, updateApplicationStatus);
router.get("/applications", authMiddleware, getUserApplications);

export default router;
