import { districts } from "../data/districts.js";
import { initiatives } from "../data/initiatives.js";
import type { Category, District, Initiative, ScenarioResult } from "../types/index.js";

export const TOTAL_BUDGET_MLN_KZT = 1000;

export const CATEGORIES: Category[] = [
  "transport",
  "greening",
  "social",
  "safety",
  "services"
];

export const SCORE_WEIGHTS: Record<Category, number> = {
  transport: 0.27,
  greening: 0.2,
  social: 0.22,
  safety: 0.18,
  services: 0.13
};

const initiativeById = new Map(initiatives.map((initiative) => [initiative.id, initiative]));

export function simulateScenario(selectedInitiativeIds: string[]): ScenarioResult {
  const selectedInitiatives = selectedInitiativeIdsToInitiatives(selectedInitiativeIds);
  const errors = validateSelection(selectedInitiativeIds, selectedInitiatives);
  const spentMlnKzt = sumSelectedCost(selectedInitiatives);
  const categoryScoresBefore = calculateCategoryScores(districts);
  const scoreBefore = calculateAqols(categoryScoresBefore);
  const districtResults = errors.length === 0 ? applyInitiatives(districts, selectedInitiatives) : cloneDistricts(districts);
  const categoryScoresAfter = calculateCategoryScores(districtResults);
  const scoreAfter = calculateAqols(categoryScoresAfter);

  return {
    isValid: errors.length === 0,
    errors,
    totalBudgetMlnKzt: TOTAL_BUDGET_MLN_KZT,
    spentMlnKzt,
    remainingMlnKzt: TOTAL_BUDGET_MLN_KZT - spentMlnKzt,
    scoreBefore,
    scoreAfter,
    categoryScoresBefore,
    categoryScoresAfter,
    imbalancePenalty: calculateImbalancePenalty(categoryScoresAfter),
    districtResults,
    selectedInitiatives
  };
}

export function calculateCategoryScores(cityDistricts: District[]): Record<Category, number> {
  const totalPopulation = cityDistricts.reduce((sum, district) => sum + district.population, 0);

  return CATEGORIES.reduce<Record<Category, number>>((scores, category) => {
    const weightedTotal = cityDistricts.reduce(
      (sum, district) => sum + district.population * district.indicators[category],
      0
    );
    scores[category] = roundToTwo(weightedTotal / totalPopulation);
    return scores;
  }, emptyCategoryScores());
}

export function calculateAqols(categoryScores: Record<Category, number>): number {
  const baseScore = CATEGORIES.reduce(
    (sum, category) => sum + categoryScores[category] * SCORE_WEIGHTS[category],
    0
  );
  return roundToTwo(clamp(baseScore - calculateImbalancePenalty(categoryScores), 0, 100));
}

export function calculateImbalancePenalty(categoryScores: Record<Category, number>): number {
  const scores = CATEGORIES.map((category) => categoryScores[category]);
  return roundToTwo(0.15 * (Math.max(...scores) - Math.min(...scores)));
}

function validateSelection(selectedInitiativeIds: string[], selectedInitiatives: Initiative[]): string[] {
  const errors: string[] = [];

  if (selectedInitiativeIds.length !== CATEGORIES.length) {
    errors.push("Нужно выбрать ровно пять инициатив.");
  }

  const unknownIds = selectedInitiativeIdsWithoutCatalogMatch(selectedInitiativeIds);
  if (unknownIds.length > 0) {
    errors.push(`Неизвестные инициативы: ${unknownIds.join(", ")}.`);
  }

  for (const category of CATEGORIES) {
    const count = selectedInitiatives.filter((initiative) => initiative.category === category).length;
    if (count === 0) {
      errors.push(`Не выбрана инициатива в категории ${category}.`);
    }
    if (count > 1) {
      errors.push(`В категории ${category} выбрано больше одной инициативы.`);
    }
  }

  const spentMlnKzt = sumSelectedCost(selectedInitiatives);
  if (spentMlnKzt > TOTAL_BUDGET_MLN_KZT) {
    errors.push("Выбранные инициативы превышают бюджет 1 000 млн KZT.");
  }

  return errors;
}

function applyInitiatives(baseDistricts: District[], selectedInitiatives: Initiative[]): District[] {
  const updatedDistricts = cloneDistricts(baseDistricts);

  for (const initiative of selectedInitiatives) {
    for (const district of updatedDistricts) {
      const districtEffects = initiative.effects[district.id];
      if (!districtEffects) {
        continue;
      }

      for (const category of CATEGORIES) {
        const effect = districtEffects[category] ?? 0;
        district.indicators[category] = clamp(district.indicators[category] + effect, 0, 100);
      }
    }
  }

  return updatedDistricts;
}

function selectedInitiativeIdsToInitiatives(selectedInitiativeIds: string[]): Initiative[] {
  return selectedInitiativeIds.flatMap((id) => {
    const initiative = initiativeById.get(id);
    return initiative ? [initiative] : [];
  });
}

function selectedInitiativeIdsWithoutCatalogMatch(selectedInitiativeIds: string[]): string[] {
  return selectedInitiativeIds.filter((id) => !initiativeById.has(id));
}

function sumSelectedCost(selectedInitiatives: Initiative[]): number {
  return selectedInitiatives.reduce((sum, initiative) => sum + initiative.costMlnKzt, 0);
}

function cloneDistricts(sourceDistricts: District[]): District[] {
  return sourceDistricts.map((district) => ({
    ...district,
    indicators: { ...district.indicators }
  }));
}

function emptyCategoryScores(): Record<Category, number> {
  return {
    transport: 0,
    greening: 0,
    social: 0,
    safety: 0,
    services: 0
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
