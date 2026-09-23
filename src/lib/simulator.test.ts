import { describe, expect, it } from "vitest";
import { initiatives } from "../data/initiatives.js";
import type { Category, District } from "../types/index.js";
import {
  CATEGORIES,
  SCORE_WEIGHTS,
  TOTAL_BUDGET_MLN_KZT,
  calculateAqols,
  calculateCategoryScores,
  calculateImbalancePenalty,
  simulateScenario
} from "./simulator.js";

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

describe("simulation core", () => {
  it("uses the fixed budget and score weights from the project specification", () => {
    expect(TOTAL_BUDGET_MLN_KZT).toBe(1000);
    expect(SCORE_WEIGHTS).toEqual({
      transport: 0.27,
      greening: 0.2,
      social: 0.22,
      safety: 0.18,
      services: 0.13
    });
  });

  it("accepts exactly one known initiative per category within budget", () => {
    const result = simulateScenario(validSelection);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.selectedInitiatives).toHaveLength(5);
    expect(result.spentMlnKzt).toBe(725);
    expect(result.remainingMlnKzt).toBe(275);
    expect(result.scoreAfter).toBeGreaterThan(result.scoreBefore);
  });

  it("applies district effects only to the affected district indicators", () => {
    const result = simulateScenario(validSelection);
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
    expect(saryarka?.indicators.transport).toBe(54);
    expect(saryarka?.indicators.greening).toBe(54);
    expect(saryarka?.indicators.social).toBe(64);
    expect(yesil?.indicators.services).toBe(68);
  });

  it("rejects missing, duplicate, unknown, and over-budget selections", () => {
    expect(simulateScenario(validSelection.slice(0, 4)).isValid).toBe(false);

    const duplicateCategory = simulateScenario([
      "transport-brt-corridor",
      "transport-bike-grid",
      "social-mobile-clinics",
      "safety-neighborhood-lighting",
      "services-one-stop-app"
    ]);
    expect(duplicateCategory.isValid).toBe(false);
    expect(duplicateCategory.errors).toContain("В категории transport выбрано больше одной инициативы.");
    expect(duplicateCategory.errors).toContain("Не выбрана инициатива в категории greening.");

    const unknown = simulateScenario([...validSelection.slice(0, 4), "unknown-id"]);
    expect(unknown.isValid).toBe(false);
    expect(unknown.errors).toContain("Неизвестные инициативы: unknown-id.");

    const overBudget = simulateScenario([
      "transport-brt-corridor",
      "greening-river-park",
      "social-school-hubs",
      "safety-community-response",
      "services-digital-dispatch"
    ]);
    expect(overBudget.spentMlnKzt).toBe(1095);
    expect(overBudget.isValid).toBe(false);
    expect(overBudget.errors).toContain("Выбранные инициативы превышают бюджет 1 000 млн KZT.");
  });

  it("does not apply initiative effects when a selection is invalid", () => {
    const result = simulateScenario(validSelection.slice(0, 4));

    expect(result.categoryScoresAfter).toEqual(result.categoryScoresBefore);
    expect(result.scoreAfter).toBe(result.scoreBefore);
  });

  it("calculates population-weighted category scores", () => {
    const cityDistricts: District[] = [
      districtWithPopulation("altyn", 100, { transport: 50, greening: 0, social: 0, safety: 0, services: 0 }),
      districtWithPopulation("saryarka", 300, { transport: 90, greening: 0, social: 0, safety: 0, services: 0 })
    ];

    expect(calculateCategoryScores(cityDistricts).transport).toBe(80);
  });

  it("uses the required base score, imbalance penalty, and clamp", () => {
    const balancedScores = categoryScores(50);
    expect(calculateImbalancePenalty(balancedScores)).toBe(0);
    expect(calculateAqols(balancedScores)).toBe(50);

    const unevenScores: Record<Category, number> = {
      transport: 100,
      greening: 0,
      social: 100,
      safety: 0,
      services: 100
    };
    expect(calculateImbalancePenalty(unevenScores)).toBe(15);
    expect(calculateAqols(unevenScores)).toBe(47);
  });

  it("keeps all resulting district indicators clamped from 0 to 100", () => {
    const result = simulateScenario(clampingSelection);
    const yesil = result.districtResults.find((district) => district.id === "yesil");

    expect(result.isValid).toBe(true);
    expect(yesil?.indicators.services).toBe(100);
    for (const district of result.districtResults) {
      for (const category of CATEGORIES) {
        expect(district.indicators[category]).toBeGreaterThanOrEqual(0);
        expect(district.indicators[category]).toBeLessThanOrEqual(100);
      }
    }
  });

  it("keeps the initiative catalog category coverage complete", () => {
    for (const category of CATEGORIES) {
      expect(initiatives.filter((initiative) => initiative.category === category)).toHaveLength(3);
    }
    expect(initiatives).toHaveLength(15);
  });
});

function districtWithPopulation(
  id: District["id"],
  population: number,
  indicators: Record<Category, number>
): District {
  return {
    id,
    nameRu: id,
    population,
    indicators
  };
}

function categoryScores(score: number): Record<Category, number> {
  return {
    transport: score,
    greening: score,
    social: score,
    safety: score,
    services: score
  };
}
