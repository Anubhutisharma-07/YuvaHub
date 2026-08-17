import { Router } from "express";
import { getOpportunities, getTrendingOpportunities, semanticSearch, getLatestOpportunities, submitOpportunity, getOpportunityById, updateOpportunity, toggleBookmark, getSimilarOpportunities } from "../controllers/opportunityController.js";
import { authMiddleware, adminOnly } from "../middlewares/auth.js";
import { cacheMiddleware } from "../middlewares/cacheMiddleware.js";
import { markdownNegotiation } from "../middlewares/markdownNegotiation.js";

const router = Router();

router.get("/opportunities", getOpportunities);
router.get("/opportunities/trending", cacheMiddleware(300), getTrendingOpportunities);
router.get("/opportunities/semantic-search", semanticSearch);
router.get("/opportunities/latest", getLatestOpportunities);
router.post("/opportunities", authMiddleware, submitOpportunity);
router.get("/opportunity/:id", cacheMiddleware(3600, (req: any) => `opportunity:${req.params.id}`), markdownNegotiation, getOpportunityById);
router.put("/opportunity/:id", authMiddleware, adminOnly, updateOpportunity);
router.post("/opportunities/:id/bookmark", authMiddleware, toggleBookmark);
router.get("/opportunities/:id/similar", cacheMiddleware(3600, (req: any) => `opportunity:${req.params.id}:similar`), getSimilarOpportunities);

export default router;
