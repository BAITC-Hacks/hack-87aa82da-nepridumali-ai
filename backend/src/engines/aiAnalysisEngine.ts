import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
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

const aiAnalysisSchema = z.object({
  executiveSummary: z.string(),
  keyImprovements: z.array(z.string()),
  risks: z.array(z.string()),
  tradeoffs: z.array(z.string()),
  strategicRecommendations: z.array(z.string()),
  suggestedNextInvestments: z.array(z.string())
});

const ANALYST_INSTRUCTIONS = [
  "Ты - AI-аналитик городских решений для симулятора Аким на 5 часов.",
  "Отвечай только на русском языке и только по переданному результату детерминированного расчета.",
  "Не пересчитывай Score, не меняй числа, не придумывай показатели, меры, эффекты, риски или ограничения.",
  "Инициативы из server recommendations - это отдельные кандидаты; не предлагай сочетать их без новой проверки валидатором.",
  "Объясняй конкретные сильные стороны, оставшиеся риски и компромиссы сценария.",
  "Если для рекомендации недостаточно фактов в JSON, верни пустой массив для этого раздела.",
  "Не показывай ход внутренних рассуждений."
].join(" ");

export async function generateAiAnalysis(result: SimulationResult): Promise<AiAnalysis> {
  if (!process.env.OPENAI_API_KEY || !result.valid) {
    return fallbackAnalysis(result);
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 1,
      timeout: 15_000
    });
    const completion = await client.beta.chat.completions.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.3,
      response_format: zodResponseFormat(aiAnalysisSchema, "city_scenario_analysis"),
      messages: [
        {
          role: "system",
          content: ANALYST_INSTRUCTIONS
        },
        {
          role: "user",
          content: `Вот единственный источник фактов для анализа:\n${JSON.stringify(result)}`
        }
      ]
    });
    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed) {
      return fallbackAnalysis(result);
    }
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
    suggestedNextInvestments: [...new Set(result.recommendations.flatMap((recommendation) => recommendation.initiativeIds))]
  };
}
