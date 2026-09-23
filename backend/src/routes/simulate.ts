import { Router } from "express";
import { loadData } from "../data/loadData.js";
import { runSimulation } from "../engines/simulationEngine.js";

export const simulateRouter = Router();

simulateRouter.post("/", (request, response) => {
  const catalog = loadData();
  const result = runSimulation(request.body, catalog);
  response.status(result.valid ? 200 : 400).json(result);
});
