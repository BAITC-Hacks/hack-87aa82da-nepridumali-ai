import { Router } from "express";
import { loadData } from "../data/loadData.js";
import { generateAiAnalysis } from "../engines/aiAnalysisEngine.js";
import { runSimulation } from "../engines/simulationEngine.js";

export const analysisRouter = Router();

analysisRouter.post("/", async (request, response) => {
  const simulation = runSimulation(request.body, loadData());
  if (!simulation.valid) {
    response.status(400).json({ errors: simulation.errors });
    return;
  }

  const analysis = await generateAiAnalysis(simulation);
  response.json(analysis);
});
