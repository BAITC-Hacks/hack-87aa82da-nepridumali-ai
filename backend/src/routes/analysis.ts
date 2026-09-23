import { Router } from "express";
import { z } from "zod";
import { loadData } from "../data/loadData.js";
import { generateAiAnalysis } from "../engines/aiAnalysisEngine.js";
import { runSimulation } from "../engines/simulationEngine.js";

const actionSchema = z.object({
  initiativeId: z.string(),
  districtId: z.string().optional()
}).strict();

export const analysisRequestSchema = z.object({
  actions: z.array(actionSchema)
}).strict();

export function parseAnalysisRequest(value: unknown) {
  return analysisRequestSchema.safeParse(value);
}

export const analysisRouter = Router();

analysisRouter.post("/", async (request, response) => {
  const parsedRequest = parseAnalysisRequest(request.body);
  if (!parsedRequest.success) {
    response.status(400).json({
      errors: parsedRequest.error.issues.map((issue) => issue.message)
    });
    return;
  }

  const simulation = runSimulation({ actions: parsedRequest.data.actions }, loadData());
  if (!simulation.valid) {
    response.status(400).json({ errors: simulation.errors });
    return;
  }

  const analysis = await generateAiAnalysis(simulation);
  response.json(analysis);
});
