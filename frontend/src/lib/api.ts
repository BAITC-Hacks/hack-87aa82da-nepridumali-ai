import type { ActionInput, AiAnalysis, SimulationResult } from "../types/index.js";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export async function simulate(actions: ActionInput[]): Promise<SimulationResult> {
  const response = await fetch(`${API_URL}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actions })
  });
  return response.json() as Promise<SimulationResult>;
}

export async function analyze(result: SimulationResult): Promise<AiAnalysis> {
  const response = await fetch(`${API_URL}/analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result)
  });
  return response.json() as Promise<AiAnalysis>;
}
