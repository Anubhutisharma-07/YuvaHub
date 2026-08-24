import { Router } from "express";
import { createCareerFair, getCareerFairs, addCompanyBooth, getCompanyBooths, dropResume } from "../api/controllers/virtualCareerFairController";

export const apiRouter = Router();

apiRouter.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString(), architecture: "modular" });
});

// Virtual Career Fair Routes
apiRouter.post("/career-fairs", createCareerFair);
apiRouter.get("/career-fairs", getCareerFairs);
apiRouter.post("/career-fairs/booths", addCompanyBooth);
apiRouter.get("/career-fairs/:fairId/booths", getCompanyBooths);
apiRouter.post("/career-fairs/booths/drop-resume", dropResume);
