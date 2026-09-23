import OpenAI from "openai";
import type { SimulationResult } from "../types/index.js";

export interface AiAnalysis {
  source: "openai" | "fallback";
  executiveSummary: string;
  keyImprovements: string[];
  risks: string[];
  tradeoffs: string[];
  strategicRecommendations: string[];
  suggestedNextInvestments: string[];
}

export async function generateAiAnalysis(result: SimulationResult): Promise<AiAnalysis> {
  if (!process.env.OPENAI_API_KEY || !result.valid) {
    return fallbackAnalysis(result);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an Urban Development Strategic Advisor. Explain only the calculated simulation result. Never calculate or modify metrics."
        },
        {
          role: "user",
          content: JSON.stringify({
            requiredKeys: [
              "executiveSummary",
              "keyImprovements",
              "risks",
              "tradeoffs",
              "strategicRecommendations",
              "suggestedNextInvestments"
            ],
            simulationResult: result
          })
        }
      ]
    });
    const content = completion.choices[0]?.message.content;
    if (!content) {
      return fallbackAnalysis(result);
    }
    const parsed = JSON.parse(content) as Omit<AiAnalysis, "source">;
    return {
      source: "openai",
      ...parsed
    };
  } catch {
    return fallbackAnalysis(result);
  }
}

function fallbackAnalysis(result: SimulationResult): AiAnalysis {
  if (!result.valid || !result.analysisData) {
    return {
      source: "fallback",
      executiveSummary: "Сценарий не прошел валидацию, поэтому стратегический анализ не сформирован.",
      keyImprovements: [],
      risks: result.errors,
      tradeoffs: [],
      strategicRecommendations: ["Исправьте ошибки выбора мероприятий и повторите симуляцию."],
      suggestedNextInvestments: []
    };
  }

  return {
    source: "fallback",
    executiveSummary: `Сценарий повышает Score на ${result.delta} пункта: с ${result.scoreBefore} до ${result.scoreAfter}.`,
    keyImprovements: [`Улучшено районов: ${result.analysisData.improvedDistrictCount}.`],
    risks: [`Критических показателей после сценария: ${result.analysisData.criticalIssueCount}.`],
    tradeoffs: ["Бюджетные решения улучшают выбранные направления, но не закрывают все слабые зоны города."],
    strategicRecommendations: result.recommendations.map((recommendation) => recommendation.title),
    suggestedNextInvestments: result.recommendations.flatMap((recommendation) => recommendation.initiativeIds)
  };
}
