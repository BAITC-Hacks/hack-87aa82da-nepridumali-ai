import { Router } from "express";
import { generateAiAnalysis } from "../engines/aiAnalysisEngine.js";
import type { SimulationResult } from "../types/index.js";

export const analysisRouter = Router();

analysisRouter.post("/", async (request, response) => {
  const analysis = await generateAiAnalysis(request.body as SimulationResult);
  response.json(analysis);
});
