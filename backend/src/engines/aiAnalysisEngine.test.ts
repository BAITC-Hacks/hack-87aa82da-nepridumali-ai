import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseAnalysisRequest } from "../routes/analysis.js";
import type { SimulationResult } from "../types/index.js";
import { generateAiAnalysis } from "./aiAnalysisEngine.js";

const { parseMock } = vi.hoisted(() => ({
  parseMock: vi.fn()
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    beta = {
      chat: {
        completions: {
          parse: parseMock
        }
      }
    };
  }
}));

describe("analysis request validation", () => {
  it("accepts a clean action-only payload", () => {
    const parsed = parseAnalysisRequest({
      actions: [
        { initiativeId: "M7", districtId: "nura" },
        { initiativeId: "M8", districtId: "nura" },
        { initiativeId: "M10", districtId: "nura" },
        { initiativeId: "M12" },
        { initiativeId: "M5", districtId: "saryarka" }
      ]
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.actions).toHaveLength(5);
      expect(parsed.data.actions.map((action) => action.initiativeId)).toEqual(["M7", "M8", "M10", "M12", "M5"]);
    }
  });

  it("rejects a payload that tries to inject simulation results from the browser", () => {
    const parsed = parseAnalysisRequest({
      actions: [{ initiativeId: "M12" }],
      scoreBefore: 10,
      scoreAfter: 99,
      delta: 89,
      districtResults: [],
      recommendations: []
    });

    expect(parsed.success).toBe(false);
  });
});

describe("generateAiAnalysis", () => {
  beforeEach(() => {
    parseMock.mockReset();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
  });

  it("returns fallback output when the API key is not configured", async () => {
    const result: SimulationResult = {
      valid: true,
      errors: [],
      scoreBefore: 52.56,
      scoreAfter: 56.54,
      delta: 3.98,
      districtsBefore: [],
      districtsAfter: [],
      selectedActions: [],
      analysisData: {
        weakestDistrict: {
          districtId: "nura",
          districtName: "Nura",
          populationShare: 0.16,
          score: 52.96,
          criticalIssues: ["S1", "S2"]
        },
        weakestCategory: {
          category: "transport",
          score: 55.65
        },
        criticalIssueCount: 0,
        improvedDistrictCount: 1,
        budgetUsed: 95,
        budgetRemaining: 5
      },
      recommendations: [{
        type: "weakestDistrict",
        title: "Укрепить район Nura",
        rationale: "Это самый слабый район.",
        initiativeIds: ["M7"]
      }]
    };

    const analysis = await generateAiAnalysis(result);

    expect(analysis.source).toBe("fallback");
    expect(analysis.executiveSummary).toContain("Сценарий повышает Score");
    expect(parseMock).not.toHaveBeenCalled();
  });

  it("uses structured data from the OpenAI parser without inventing numbers", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-4o-mini";

    const result: SimulationResult = {
      valid: true,
      errors: [],
      scoreBefore: 52.56,
      scoreAfter: 56.54,
      delta: 3.98,
      districtsBefore: [],
      districtsAfter: [],
      selectedActions: [],
      analysisData: {
        weakestDistrict: {
          districtId: "nura",
          districtName: "Nura",
          populationShare: 0.16,
          score: 52.96,
          criticalIssues: ["S1", "S2"]
        },
        weakestCategory: {
          category: "transport",
          score: 55.65
        },
        criticalIssueCount: 0,
        improvedDistrictCount: 1,
        budgetUsed: 95,
        budgetRemaining: 5
      },
      recommendations: [{
        type: "weakestDistrict",
        title: "Укрепить район Nura",
        rationale: "Это самый слабый район.",
        initiativeIds: ["M7"]
      }]
    };

    parseMock.mockResolvedValue({
      choices: [{
        message: {
          parsed: {
            executiveSummary: "Сценарий стабилизирует социальные показатели в Nura.",
            keyImprovements: ["Улучшены социальные показатели"],
            risks: ["Остаются риски по транспортной доступности"],
            tradeoffs: ["Требуется поддержать транспортный баланс"],
            strategicRecommendations: ["Сохранить фокус на социальной инфраструктуре"],
            suggestedNextInvestments: ["M7"]
          }
        }
      }]
    });

    const analysis = await generateAiAnalysis(result);

    expect(analysis.source).toBe("openai");
    expect(analysis.executiveSummary).toContain("стабилизирует");
    expect(parseMock).toHaveBeenCalledTimes(1);
  });
});
