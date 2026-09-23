import { describe, expect, it } from "vitest";
import { loadData } from "../data/loadData.js";
import type { ActionInput, Category, DataCatalog, DistrictId, MetricCode } from "../types/index.js";
import { findBestSingleReplacementAlternatives } from "./alternativeEngine.js";
import { runSimulation } from "./simulationEngine.js";

const catalog = loadData();

const metricCodes: MetricCode[] = ["T1", "T2", "E1", "E2", "S1", "S2", "B1", "B2", "C1", "C2"];

const demoActions: ActionInput[] = [
  { initiativeId: "M7", districtId: "nura" },
  { initiativeId: "M8", districtId: "nura" },
  { initiativeId: "M10", districtId: "nura" },
  { initiativeId: "M12" },
  { initiativeId: "M5", districtId: "saryarka" }
];

function resultFor(actions: ActionInput[], data: DataCatalog = catalog) {
  return runSimulation({ actions }, data);
}

function expectInvalid(actions: ActionInput[], errorFragment: string) {
  const result = resultFor(actions);
  expect(result.valid).toBe(false);
  expect(result.scoreAfter).toBeNull();
  expect(result.delta).toBeNull();
  expect(result.analysisData).toBeNull();
  expect(result.recommendations).toEqual([]);
  expect(result.errors.some((error) => error.includes(errorFragment))).toBe(true);
}

function districtMetric(result: ReturnType<typeof runSimulation>, districtId: DistrictId, metric: MetricCode) {
  const district = result.districtsAfter.find((item) => item.id === districtId);
  expect(district).toBeDefined();
  return district?.metrics[metric];
}

describe("simulation data contract", () => {
  it("loads exactly the five documented districts with population shares and ten metrics", () => {
    expect(catalog.districts.map((district) => district.id)).toEqual([
      "yesil",
      "almaty",
      "saryarka",
      "baikonur",
      "nura"
    ]);
    expect(catalog.districts.map((district) => district.populationShare)).toEqual([0.27, 0.24, 0.2, 0.13, 0.16]);
    expect(catalog.districts.reduce((sum, district) => sum + district.populationShare, 0)).toBeCloseTo(1);

    for (const district of catalog.districts) {
      expect(Object.keys(district.metrics).sort()).toEqual([...metricCodes].sort());
    }

    expect(catalog.districts.find((district) => district.id === "nura")?.metrics).toMatchObject({
      T1: 55,
      T2: 40,
      E1: 45,
      E2: 65,
      S1: 38,
      S2: 35,
      B1: 55,
      B2: 50,
      C1: 60,
      C2: 50
    });
  });

  it("loads exactly the fourteen documented initiatives with costs, lags, scopes, and effects", () => {
    expect(catalog.initiatives.map((initiative) => initiative.id)).toEqual([
      "M1",
      "M2",
      "M3",
      "M4",
      "M5",
      "M6",
      "M7",
      "M8",
      "M9",
      "M10",
      "M11",
      "M12",
      "M13",
      "M14"
    ]);

    expect(catalog.initiatives.map((initiative) => ({
      id: initiative.id,
      category: initiative.category,
      scope: initiative.scope,
      cost: initiative.cost,
      lag: initiative.lag,
      effects: initiative.effects
    }))).toEqual([
      { id: "M1", category: "transport", scope: "district", cost: 18, lag: 2, effects: { T1: 6, T2: 9 } },
      { id: "M2", category: "transport", scope: "city", cost: 22, lag: 2, effects: { T1: 4, B2: 3 } },
      { id: "M3", category: "transport", scope: "district", cost: 30, lag: 4, effects: { T1: 16, T2: 20, E2: 4 } },
      { id: "M4", category: "ecology", scope: "district", cost: 15, lag: 2, effects: { E1: 12, E2: 3, B1: 2 } },
      { id: "M5", category: "ecology", scope: "district", cost: 25, lag: 3, effects: { E2: 14, C1: 4 } },
      { id: "M6", category: "ecology", scope: "city", cost: 20, lag: 4, effects: { E1: 5, E2: 3 } },
      { id: "M7", category: "social", scope: "district", cost: 24, lag: 3, effects: { S1: 16 } },
      { id: "M8", category: "social", scope: "district", cost: 20, lag: 3, effects: { S2: 14 } },
      { id: "M9", category: "social", scope: "district", cost: 10, lag: 1, effects: { S1: 3, S2: 3, B1: 3 } },
      { id: "M10", category: "safety", scope: "district", cost: 12, lag: 1, effects: { B1: 12, B2: 2 } },
      { id: "M11", category: "safety", scope: "district", cost: 10, lag: 1, effects: { B2: 12, T1: -2 } },
      { id: "M12", category: "services", scope: "city", cost: 14, lag: 1, effects: { C2: 5 } },
      { id: "M13", category: "services", scope: "district", cost: 28, lag: 4, effects: { C1: 18, E2: 2 } },
      { id: "M14", category: "services", scope: "city", cost: 16, lag: 1, effects: { C1: 5, C2: 2 } }
    ]);
  });

  it("loads exactly the documented synergies and conflicts", () => {
    expect(catalog.synergies).toEqual([
      { initiativeIds: ["M1", "M2"], districtSourceInitiativeId: "M1", bonus: { T1: 2 } },
      { initiativeIds: ["M10", "M12"], districtSourceInitiativeId: "M10", bonus: { B1: 2 } },
      { initiativeIds: ["M5", "M6"], districtSourceInitiativeId: "M5", bonus: { E2: 2 } }
    ]);
    expect(catalog.conflicts.map((conflict) => ({
      initiativeIds: conflict.initiativeIds,
      scope: conflict.scope
    }))).toEqual([
      { initiativeIds: ["M1", "M3"], scope: "global" },
      { initiativeIds: ["M4", "M7"], scope: "sameDistrict" },
      { initiativeIds: ["M5", "M13"], scope: "sameDistrict" }
    ]);
  });
});

describe("simulation engine", () => {
  it("matches the documented baseline score 52.56 and critical issue count", () => {
    const invalid = resultFor([]);

    expect(invalid.scoreBefore).toBe(52.56);
    expect(invalid.districtsBefore.find((district) => district.id === "nura")?.criticalIssues).toEqual(["S1", "S2"]);
  });

  it("runs the documented valid demo scenario", () => {
    const result = resultFor(demoActions);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.selectedActions).toHaveLength(5);
    expect(result.analysisData?.budgetUsed).toBe(95);
    expect(result.analysisData?.budgetRemaining).toBe(5);
    expect(result.scoreBefore).toBe(52.56);
    expect(result.scoreAfter).toBe(56.54);
    expect(result.delta).toBe(3.98);
  });

  it("applies lag effects and city-scope effects deterministically", () => {
    const result = resultFor(demoActions);

    expect(districtMetric(result, "nura", "S1")).toBe(48);
    expect(districtMetric(result, "nura", "S2")).toBe(43.75);
    expect(districtMetric(result, "yesil", "C2")).toBe(74.38);
    expect(districtMetric(result, "almaty", "C2")).toBe(64.38);
  });

  it("applies all documented synergies without lag scaling", () => {
    const transportSafety = resultFor([
      { initiativeId: "M1", districtId: "yesil" },
      { initiativeId: "M2" },
      { initiativeId: "M7", districtId: "nura" },
      { initiativeId: "M10", districtId: "nura" },
      { initiativeId: "M12" }
    ]);
    const ecology = resultFor([
      { initiativeId: "M5", districtId: "saryarka" },
      { initiativeId: "M6" },
      { initiativeId: "M7", districtId: "nura" },
      { initiativeId: "M10", districtId: "nura" },
      { initiativeId: "M12" }
    ]);

    expect(transportSafety.valid).toBe(true);
    expect(ecology.valid).toBe(true);
    expect(districtMetric(transportSafety, "yesil", "T1")).toBe(54.5);
    expect(districtMetric(transportSafety, "nura", "B1")).toBe(67.5);
    expect(districtMetric(ecology, "saryarka", "E2")).toBe(52.25);
  });

  it("uses the district and city score formula from the spec", () => {
    const result = resultFor(demoActions);
    const districtScores = Object.fromEntries(result.districtsAfter.map((district) => [district.id, district.score]));
    const weightedAverage = result.districtsAfter.reduce(
      (sum, district) => sum + district.populationShare * district.score,
      0
    );
    const weakestDistrictScore = Math.min(...result.districtsAfter.map((district) => district.score));
    const criticalIssueCount = result.analysisData?.criticalIssueCount ?? 0;

    expect(districtScores.nura).toBe(52.96);
    expect(weightedAverage).toBeCloseTo(58.08, 2);
    expect(weakestDistrictScore).toBe(52.96);
    expect(result.scoreAfter).toBeCloseTo(0.7 * weightedAverage + 0.3 * weakestDistrictScore - criticalIssueCount);
  });

  it("calculates population-weighted category scores", () => {
    const result = resultFor(demoActions);
    const transport = result.districtsAfter.reduce((sum, district) => {
      const score = (district.metrics.T1 + district.metrics.T2) / 2;
      return sum + district.populationShare * score;
    }, 0);
    const ecology = result.districtsAfter.reduce((sum, district) => {
      const score = (district.metrics.E1 + district.metrics.E2) / 2;
      return sum + district.populationShare * score;
    }, 0);

    expect(result.analysisData?.weakestCategory.category).toBe("transport");
    expect(result.analysisData?.weakestCategory.score).toBeCloseTo(transport, 2);
    expect(transport).toBeCloseTo(55.65, 2);
    expect(ecology).toBeCloseTo(56.2, 2);
  });

  it("counts critical issues after the scenario", () => {
    const result = resultFor(demoActions);

    expect(result.analysisData?.criticalIssueCount).toBe(0);
    expect(result.districtsAfter.flatMap((district) => district.criticalIssues)).toEqual([]);
  });

  it("clamps metric values to 100", () => {
    const clampingCatalog: DataCatalog = {
      ...catalog,
      districts: catalog.districts.map((district) => ({
        ...district,
        metrics: {
          ...district.metrics,
          ...(district.id === "yesil" ? { B1: 99 } : {})
        }
      }))
    };
    const result = resultFor([
      { initiativeId: "M10", districtId: "yesil" },
      { initiativeId: "M12" },
      { initiativeId: "M7", districtId: "nura" },
      { initiativeId: "M8", districtId: "nura" },
      { initiativeId: "M5", districtId: "saryarka" }
    ], clampingCatalog);

    expect(result.valid).toBe(true);
    expect(districtMetric(result, "yesil", "B1")).toBe(100);
    for (const district of result.districtsAfter) {
      for (const value of Object.values(district.metrics)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it("returns deterministic recommendations from simulation outputs", () => {
    const first = resultFor(demoActions);
    const second = resultFor(demoActions);
    const knownInitiativeIds = new Set(catalog.initiatives.map((initiative) => initiative.id));

    expect(first.recommendations).toEqual(second.recommendations);
    expect(first.recommendations.map((recommendation) => recommendation.type)).toEqual([
      "weakestDistrict",
      "weakestCategory",
      "unusedBudget"
    ]);
    for (const recommendation of first.recommendations) {
      for (const initiativeId of recommendation.initiativeIds) {
        expect(knownInitiativeIds.has(initiativeId)).toBe(true);
      }
    }
  });
});

describe("single replacement alternatives", () => {
  it("keeps the documented control scenario at 52.56 to 56.54", () => {
    const result = resultFor(demoActions);

    expect(result.scoreBefore).toBe(52.56);
    expect(result.scoreAfter).toBe(56.54);
  });

  it("returns up to three valid alternatives with calculated scores and deltas", () => {
    const alternatives = findBestSingleReplacementAlternatives({ actions: demoActions }, catalog);

    expect(alternatives).toHaveLength(3);
    expect(alternatives.map((alternative) => alternative.scoreAfter)).toEqual(
      [...alternatives.map((alternative) => alternative.scoreAfter)].sort((left, right) => right - left)
    );

    for (const alternative of alternatives) {
      const scenario = resultFor(alternative.actions);
      expect(scenario.valid).toBe(true);
      expect(alternative.actions).toHaveLength(5);
      expect(alternative.scoreAfter).toBe(scenario.scoreAfter);
      expect(alternative.delta).toBe(scenario.delta);
      expect(alternative.actions.filter((action) => action.initiativeId === alternative.replacementAction.initiativeId)).toHaveLength(1);
      expect(alternative.actions).not.toContainEqual(alternative.replacedAction);
    }
  });

  it("does not mutate the original selected actions", () => {
    const originalActions = demoActions.map((action) => ({ ...action }));

    findBestSingleReplacementAlternatives({ actions: demoActions }, catalog);

    expect(demoActions).toEqual(originalActions);
  });

  it("returns no alternatives when the source scenario is invalid", () => {
    expect(findBestSingleReplacementAlternatives({ actions: demoActions.slice(0, 4) }, catalog)).toEqual([]);
  });
});

describe("simulation validation", () => {
  it("rejects invalid action count", () => {
    expectInvalid(demoActions.slice(0, 4), "ровно 5");
  });

  it("rejects duplicate initiatives", () => {
    expectInvalid([
      { initiativeId: "M12" },
      { initiativeId: "M12" },
      { initiativeId: "M7", districtId: "nura" },
      { initiativeId: "M8", districtId: "nura" },
      { initiativeId: "M10", districtId: "nura" }
    ], "больше одного раза");
  });

  it("rejects unknown initiatives", () => {
    expectInvalid([
      { initiativeId: "M404" },
      { initiativeId: "M7", districtId: "nura" },
      { initiativeId: "M8", districtId: "nura" },
      { initiativeId: "M10", districtId: "nura" },
      { initiativeId: "M12" }
    ], "не найдено");
  });

  it("rejects over-budget scenarios", () => {
    expectInvalid([
      { initiativeId: "M3", districtId: "nura" },
      { initiativeId: "M5", districtId: "saryarka" },
      { initiativeId: "M7", districtId: "yesil" },
      { initiativeId: "M8", districtId: "almaty" },
      { initiativeId: "M14" }
    ], "Бюджет превышен: 115 из 100");
  });

  it("rejects category max violations", () => {
    expectInvalid([
      { initiativeId: "M1", districtId: "yesil" },
      { initiativeId: "M2" },
      { initiativeId: "M3", districtId: "nura" },
      { initiativeId: "M7", districtId: "nura" },
      { initiativeId: "M12" }
    ], "больше 2 мероприятий");
  });

  it("rejects scenarios with fewer than three categories", () => {
    expectInvalid([
      { initiativeId: "M7", districtId: "nura" },
      { initiativeId: "M8", districtId: "nura" },
      { initiativeId: "M10", districtId: "nura" },
      { initiativeId: "M11", districtId: "yesil" }
    ], "минимум 3 направления");
  });

  it("rejects district initiatives without a district", () => {
    expectInvalid([
      { initiativeId: "M7" },
      { initiativeId: "M8", districtId: "nura" },
      { initiativeId: "M10", districtId: "nura" },
      { initiativeId: "M12" },
      { initiativeId: "M5", districtId: "saryarka" }
    ], "нужно выбрать район");
  });

  it("rejects city initiatives with a district", () => {
    expectInvalid([
      { initiativeId: "M7", districtId: "nura" },
      { initiativeId: "M8", districtId: "nura" },
      { initiativeId: "M10", districtId: "nura" },
      { initiativeId: "M12", districtId: "nura" },
      { initiativeId: "M5", districtId: "saryarka" }
    ], "район указывать нельзя");
  });

  it("rejects global conflicts", () => {
    expectInvalid([
      { initiativeId: "M1", districtId: "yesil" },
      { initiativeId: "M3", districtId: "nura" },
      { initiativeId: "M7", districtId: "nura" },
      { initiativeId: "M10", districtId: "nura" },
      { initiativeId: "M12" }
    ], "M1 и M3");
  });

  it("rejects same-district conflicts", () => {
    expectInvalid([
      { initiativeId: "M4", districtId: "nura" },
      { initiativeId: "M7", districtId: "nura" },
      { initiativeId: "M8", districtId: "nura" },
      { initiativeId: "M10", districtId: "nura" },
      { initiativeId: "M12" }
    ], "конфликт за участок");
  });

  it("allows same-district conflict pairs in different districts", () => {
    const result = resultFor([
      { initiativeId: "M4", districtId: "yesil" },
      { initiativeId: "M7", districtId: "nura" },
      { initiativeId: "M8", districtId: "nura" },
      { initiativeId: "M10", districtId: "nura" },
      { initiativeId: "M12" }
    ]);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("domain categories", () => {
  it("keeps the documented five category identifiers", () => {
    const categories = new Set<Category>(catalog.initiatives.map((initiative) => initiative.category));

    expect([...categories].sort()).toEqual(["ecology", "safety", "services", "social", "transport"]);
  });
});
