import { afterEach, describe, expect, it, vi } from "vitest";
import { districts } from "./catalog";
import {
  analyze,
  fallbackAnalysis,
  parseAnalysis,
  parseSimulation,
  simulate,
} from "./api";
import type { Action } from "../types";

const actions: Action[] = [
  { initiativeId: "M1", districtId: "nura" },
  { initiativeId: "M4", districtId: "yesil" },
  { initiativeId: "M7", districtId: "nura" },
  { initiativeId: "M10", districtId: "baikonur" },
  { initiativeId: "M12" },
];
afterEach(() => vi.unstubAllGlobals());
const selectedActions = (input: Action[]) =>
  input.map(({ initiativeId, ...rest }) => ({
    initiative: { id: initiativeId },
    ...rest,
  }));
// Contract fixtures only: never imported by the app or used as API substitutes.
function payload() {
  return {
    valid: true,
    errors: [],
    scoreBefore: 52.56,
    scoreAfter: 56.5,
    delta: 3.94,
    districtsBefore: structuredClone(districts),
    districtsAfter: structuredClone(districts),
    selectedActions: selectedActions(actions),
    analysisData: {},
    recommendations: [
      { action: "Проверить сценарий M4", rationale: "Рекомендация сервера" },
    ],
  };
}

describe("simulation response boundary", () => {
  it("preserves server numbers without calculating effects", () => {
    const raw = payload();
    const result = parseSimulation(raw, actions);
    expect(result.scoreAfter).toBe(56.5);
    expect(result.delta).toBe(3.94);
    expect(result.districtsAfter[0].metrics).toEqual(
      raw.districtsAfter[0].metrics,
    );
  });
  it("accepts reordered actions but rejects a result for another selection", () => {
    expect(
      parseSimulation(
        {
          ...payload(),
          selectedActions: selectedActions([...actions].reverse()),
        },
        actions,
      ).valid,
    ).toBe(true);
    expect(() =>
      parseSimulation(
        {
          ...payload(),
          selectedActions: selectedActions([
            ...actions.slice(0, 4),
            { initiativeId: "M14" },
          ]),
        },
        actions,
      ),
    ).toThrow("контракту");
  });
  it("rejects incomplete districts, duplicate districts and incomplete metrics", () => {
    expect(() =>
      parseSimulation({ ...payload(), districtsAfter: [] }, actions),
    ).toThrow("контракту");
    expect(() =>
      parseSimulation(
        { ...payload(), districtsAfter: Array(5).fill(districts[0]) },
        actions,
      ),
    ).toThrow("контракту");
    const raw = payload();
    raw.districtsAfter[0].metrics =
      {} as (typeof raw.districtsAfter)[0]["metrics"];
    expect(() => parseSimulation(raw, actions)).toThrow("контракту");
  });
  it("rejects non-finite scores and out-of-range metrics", () => {
    expect(() =>
      parseSimulation({ ...payload(), scoreAfter: NaN }, actions),
    ).toThrow("контракту");
    const raw = payload();
    raw.districtsAfter[0].metrics.T1 = 101;
    expect(() => parseSimulation(raw, actions)).toThrow("контракту");
  });
  it("retains backend validation messages and does not show results", () => {
    expect(() =>
      parseSimulation(
        { valid: false, errors: ["Конфликт серверной проверки"] },
        actions,
      ),
    ).toThrow("Сервер отклонил");
  });
});

describe("HTTP error messages", () => {
  it("treats an HTML error page as service unavailability, not a malformed successful result", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("<html>Unavailable</html>", { status: 503 }),
        ),
    );
    await expect(
      simulate(actions, new AbortController().signal),
    ).rejects.toThrow("Сервис временно недоступен");
  });
  it("preserves server validation reasons and explains rate limits", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ errors: ["Конфликт района"] }), {
            status: 400,
          }),
        )
        .mockResolvedValueOnce(new Response("busy", { status: 429 })),
    );
    await expect(
      simulate(actions, new AbortController().signal),
    ).rejects.toMatchObject({ issues: ["Конфликт района"] });
    await expect(
      simulate(actions, new AbortController().signal),
    ).rejects.toThrow("Слишком много запросов");
  });
  it("distinguishes unreachable and unreadable successful responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce(new Response("not json", { status: 200 })),
    );
    await expect(
      simulate(actions, new AbortController().signal),
    ).rejects.toThrow("Не удалось связаться");
    await expect(
      simulate(actions, new AbortController().signal),
    ).rejects.toThrow("нечитаемый ответ");
  });
  it("sends only selected actions to the analysis endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            source: "fallback",
            executiveSummary: "Разбор",
            keyImprovements: [],
            risks: [],
            tradeoffs: [],
            strategicRecommendations: [],
            suggestedNextInvestments: [],
          }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    await analyze(actions, new AbortController().signal);
    expect(fetchMock.mock.calls[0][0]).toBe("/analysis");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ actions });
  });
});

describe("analysis boundary and fallback", () => {
  it("validates all analysis sections", () => {
    const analysis = {
      source: "openai",
      executiveSummary: "Разбор",
      keyImprovements: [],
      risks: [],
      tradeoffs: [],
      strategicRecommendations: [],
      suggestedNextInvestments: [],
    };
    expect(parseAnalysis(analysis)).toEqual({
      source: "openai",
      executive_summary: "Разбор",
      key_improvements: [],
      risks: [],
      tradeoffs: [],
      strategic_recommendations: [],
      suggested_next_investments: [],
    });
    expect(() =>
      parseAnalysis({ ...analysis, risks: [{ unexpected: "object" }] }),
    ).toThrow("формате");
    expect(() => parseAnalysis({ ...analysis, source: ["openai"] })).toThrow(
      "формате",
    );
    expect(() => parseAnalysis(null)).toThrow("формате");
  });
  it("uses only server recommendations in fallback without adding numeric claims", () => {
    const analysis = fallbackAnalysis(parseSimulation(payload(), actions));
    expect(analysis.source).toBe("fallback");
    expect(analysis.strategic_recommendations).toEqual([
      "Проверить сценарий M4 — Рекомендация сервера",
    ]);
    expect(analysis.suggested_next_investments).toEqual([]);
  });
});
