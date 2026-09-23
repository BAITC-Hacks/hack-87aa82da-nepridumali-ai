import { districts } from '@/src/data/districts';
import { initiatives } from '@/src/data/initiatives';
import type { Category, District, Initiative, ScenarioResult } from '@/src/types';

export const TOTAL_BUDGET_MLN_KZT = 1000;

export const SCORE_WEIGHTS: Record<Category, number> = {
  transport: 0.27,
  greening: 0.2,
  social: 0.22,
  safety: 0.18,
  services: 0.13,
};

export const CATEGORY_ORDER: Category[] = ['transport', 'greening', 'social', 'safety', 'services'];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function getCategoryScoreByPopulation(districtsList: District[], category: Category): number {
  const totalPopulation = districtsList.reduce((sum, district) => sum + district.population, 0);
  const weighted = districtsList.reduce(
    (sum, district) => sum + district.population * district.indicators[category],
    0,
  );

  return clamp(weighted / totalPopulation, 0, 100);
}

export function computeCategoryScores(districtsList: District[]): Record<Category, number> {
  return CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = getCategoryScoreByPopulation(districtsList, category);
    return acc;
  }, {} as Record<Category, number>);
}

export function computeAqoLS(categoryScores: Record<Category, number>): number {
  const baseScore =
    SCORE_WEIGHTS.transport * categoryScores.transport +
    SCORE_WEIGHTS.greening * categoryScores.greening +
    SCORE_WEIGHTS.social * categoryScores.social +
    SCORE_WEIGHTS.safety * categoryScores.safety +
    SCORE_WEIGHTS.services * categoryScores.services;

  const penalty =
    0.15 *
    (Math.max(
      categoryScores.transport,
      categoryScores.greening,
      categoryScores.social,
      categoryScores.safety,
      categoryScores.services,
    ) -
      Math.min(
        categoryScores.transport,
        categoryScores.greening,
        categoryScores.social,
        categoryScores.safety,
        categoryScores.services,
      ));

  return clamp(baseScore - penalty, 0, 100);
}

export function applyInitiativesToDistricts(
  baseDistricts: District[],
  selectedInitiatives: Initiative[],
): District[] {
  const nextDistricts = baseDistricts.map((district) => ({
    ...district,
    indicators: { ...district.indicators },
  }));

  for (const initiative of selectedInitiatives) {
    for (const district of nextDistricts) {
      const districtEffects = initiative.effects[district.id];
      if (!districtEffects) continue;

      for (const category of CATEGORY_ORDER) {
        const delta = districtEffects[category] ?? 0;
        district.indicators[category] = clamp(district.indicators[category] + delta, 0, 100);
      }
    }
  }

  return nextDistricts;
}

export function buildScenarioResult(selectedIds: string[] = []): ScenarioResult {
  const selected = selectedIds
    .map((id) => initiatives.find((initiative) => initiative.id === id))
    .filter((item): item is Initiative => Boolean(item));

  const errors: string[] = [];

  if (selectedIds.length !== 5) {
    errors.push('There are not exactly five selected initiatives.');
  }

  const categoryCounts = new Map<Category, number>();
  for (const initiative of selected) {
    categoryCounts.set(initiative.category, (categoryCounts.get(initiative.category) ?? 0) + 1);
  }

  for (const category of CATEGORY_ORDER) {
    const count = categoryCounts.get(category) ?? 0;
    if (count === 0) {
      errors.push(`Category is missing: ${category}.`);
    }
    if (count > 1) {
      errors.push(`More than one initiative selected in category: ${category}.`);
    }
  }

  const invalidIds = selectedIds.filter((id) => !initiatives.some((initiative) => initiative.id === id));
  if (invalidIds.length > 0) {
    errors.push(`Initiative ID does not exist: ${invalidIds.join(', ')}.`);
  }

  const spent = selected.reduce((sum, initiative) => sum + initiative.costMlnKzt, 0);
  if (spent > TOTAL_BUDGET_MLN_KZT) {
    errors.push('Total selected cost is greater than 1,000 million KZT.');
  }

  const categoryScoresBefore = computeCategoryScores(districts);
  const scoreBefore = computeAqoLS(categoryScoresBefore);

  const finalDistricts = applyInitiativesToDistricts(districts, selected);
  const categoryScoresAfter = computeCategoryScores(finalDistricts);
  const scoreAfter = computeAqoLS(categoryScoresAfter);
  const imbalancePenalty =
    0.15 *
    (Math.max(
      categoryScoresAfter.transport,
      categoryScoresAfter.greening,
      categoryScoresAfter.social,
      categoryScoresAfter.safety,
      categoryScoresAfter.services,
    ) -
      Math.min(
        categoryScoresAfter.transport,
        categoryScoresAfter.greening,
        categoryScoresAfter.social,
        categoryScoresAfter.safety,
        categoryScoresAfter.services,
      ));

  return {
    isValid: errors.length === 0,
    errors,
    totalBudgetMlnKzt: TOTAL_BUDGET_MLN_KZT,
    spentMlnKzt: spent,
    remainingMlnKzt: TOTAL_BUDGET_MLN_KZT - spent,
    scoreBefore,
    scoreAfter,
    categoryScoresBefore,
    categoryScoresAfter,
    imbalancePenalty,
    districtResults: finalDistricts,
    selectedInitiatives: selected,
  };
}

export { initiatives, districts };
