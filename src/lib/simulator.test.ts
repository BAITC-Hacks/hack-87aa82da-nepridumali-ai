import { describe, expect, it } from "vitest";
import { districts } from "../data/districts.js";
import { initiatives } from "../data/initiatives.js";
import type { Category, District } from "../types/index.js";
import { runSimulation } from "./simulator.js";

const categories: Category[] = [
  "transport",
  "greening",
  "social",
  "safety",
  "services"
];

const scoreWeights: Record<Category, number> = {
  transport: 0.27,
  greening: 0.2,
  social: 0.22,
  safety: 0.18,
  services: 0.13
};

const validSelection = [
  "transport-bike-grid",
  "greening-courtyard-shade",
  "social-mobile-clinics",
  "safety-neighborhood-lighting",
  "services-one-stop-app"
];

const clampingSelection = [
  "transport-bike-grid",
  "greening-school-yards",
  "social-mobile-clinics",
  "safety-neighborhood-lighting",
  "services-digital-dispatch"
];

describe("runSimulation", () => {
  it("returns a valid ScenarioResult for exactly one initiative per category within budget", () => {
    const result = runSimulation(validSelection);

    expect(result).toMatchObject({
      isValid: true,
      errors: [],
      totalBudgetMlnKzt: 1000,
      spentMlnKzt: 725,
      remainingMlnKzt: 275,
      scoreBefore: 51.34,
      scoreAfter: 57.24,
      categoryScoresBefore: {
        transport: 53.86,
        greening: 45.93,
        social: 54.29,
        safety: 56,
        services: 54.59
      },
      categoryScoresAfter: {
        transport: 58.2,
        greening: 53.37,
        social: 59.49,
        safety: 61.58,
        services: 60.81
      },
      imbalancePenalty: 1.23
    });
    expect(Array.isArray(result.districtResults)).toBe(true);
    expect(Array.isArray(result.selectedInitiatives)).toBe(true);
    expect(result.selectedInitiatives.map((initiative) => initiative.id)).toEqual(validSelection);
  });

  it("applies selected initiative effects to district indicators", () => {
    const result = runSimulation(validSelection);
    const altyn = result.districtResults.find((district) => district.id === "altyn");
    const saryarka = result.districtResults.find((district) => district.id === "saryarka");
    const yesil = result.districtResults.find((district) => district.id === "yesil");

    expect(altyn?.indicators).toEqual({
      transport: 62,
      greening: 51,
      social: 61,
      safety: 65,
      services: 64
    });
    expect(saryarka?.indicators).toEqual({
      transport: 54,
      greening: 54,
      social: 64,
      safety: 60,
      services: 59
    });
    expect(yesil?.indicators.services).toBe(68);
  });

  it("rejects a selection with a missing category", () => {
    const result = runSimulation(validSelection.slice(0, 4));

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Нужно выбрать ровно пять инициатив.");
    expect(result.errors).toContain("Не выбрана инициатива в категории services.");
    expect(result.categoryScoresAfter).toEqual(result.categoryScoresBefore);
    expect(result.scoreAfter).toBe(result.scoreBefore);
  });

  it("rejects a selection with a duplicate category", () => {
    const result = runSimulation([
      "transport-brt-corridor",
      "transport-bike-grid",
      "social-mobile-clinics",
      "safety-neighborhood-lighting",
      "services-one-stop-app"
    ]);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("В категории transport выбрано больше одной инициативы.");
    expect(result.errors).toContain("Не выбрана инициатива в категории greening.");
  });

  it("rejects an unknown initiative ID", () => {
    const result = runSimulation([...validSelection.slice(0, 4), "unknown-id"]);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Неизвестные инициативы: unknown-id.");
    expect(result.errors).toContain("Не выбрана инициатива в категории services.");
  });

  it("rejects a selection that exceeds the fixed budget", () => {
    const result = runSimulation([
      "transport-brt-corridor",
      "greening-river-park",
      "social-school-hubs",
      "safety-community-response",
      "services-digital-dispatch"
    ]);

    expect(result.spentMlnKzt).toBe(1095);
    expect(result.remainingMlnKzt).toBe(-95);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Выбранные инициативы превышают бюджет 1 000 млн KZT.");
  });

  it("calculates population-weighted category scores", () => {
    const expectedTransportScore = weightedCategoryScore(districts, "transport");
    const result = runSimulation(validSelection);

    expect(result.categoryScoresBefore.transport).toBe(expectedTransportScore);
    expect(expectedTransportScore).toBe(53.86);
  });

  it("uses the required base score and imbalance penalty formula", () => {
    const result = runSimulation(validSelection);
    const baseScore = roundToTwo(
      categories.reduce(
        (sum, category) => sum + result.categoryScoresAfter[category] * scoreWeights[category],
        0
      )
    );
    const categoryValues = categories.map((category) => result.categoryScoresAfter[category]);
    const penalty = roundToTwo(0.15 * (Math.max(...categoryValues) - Math.min(...categoryValues)));
    const finalScore = roundToTwo(clamp(baseScore - penalty, 0, 100));

    expect(baseScore).toBe(58.47);
    expect(result.imbalancePenalty).toBe(penalty);
    expect(result.scoreAfter).toBe(finalScore);
  });

  it("clamps every district indicator to the 0-100 range", () => {
    const result = runSimulation(clampingSelection);
    const yesil = result.districtResults.find((district) => district.id === "yesil");

    expect(result.isValid).toBe(true);
    expect(yesil?.indicators.services).toBe(100);
    for (const district of result.districtResults) {
      for (const category of categories) {
        expect(district.indicators[category]).toBeGreaterThanOrEqual(0);
        expect(district.indicators[category]).toBeLessThanOrEqual(100);
      }
    }
  });

  it("keeps the synthetic data catalog complete", () => {
    expect(districts.map((district) => district.id)).toEqual([
      "altyn",
      "saryarka",
      "yesil",
      "baiterek"
    ]);
    for (const category of categories) {
      expect(initiatives.filter((initiative) => initiative.category === category)).toHaveLength(3);
    }
    expect(initiatives).toHaveLength(15);
  });
});

function weightedCategoryScore(cityDistricts: District[], category: Category): number {
  const totalPopulation = cityDistricts.reduce((sum, district) => sum + district.population, 0);
  const weightedTotal = cityDistricts.reduce(
    (sum, district) => sum + district.population * district.indicators[category],
    0
  );
  return roundToTwo(weightedTotal / totalPopulation);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
