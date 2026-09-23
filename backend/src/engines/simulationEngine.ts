import type { DataCatalog, District, DistrictId, MetricCode, SelectedAction, SimulationResult } from "../types/index.js";
import { clamp, roundToTwo, scoreDistricts, toDistrictResults } from "./scoringEngine.js";
import { TOTAL_BUDGET, validateActions } from "./validationEngine.js";
import { buildRecommendations } from "./recommendationEngine.js";

const HORIZON_QUARTERS = 8;

export function runSimulation(input: unknown, catalog: DataCatalog): SimulationResult {
  const validation = validateActions(input, catalog);
  const baselineDistricts = cloneDistricts(catalog.districts);
  const beforeScore = scoreDistricts(baselineDistricts);
  const districtsBefore = toDistrictResults(baselineDistricts, baselineDistricts, beforeScore);

  if (validation.errors.length > 0) {
    return {
      valid: false,
      errors: validation.errors,
      scoreBefore: beforeScore.score,
      scoreAfter: null,
      delta: null,
      districtsBefore,
      districtsAfter: districtsBefore,
      selectedActions: validation.selectedActions,
      analysisData: null,
      recommendations: []
    };
  }

  const districtsAfter = applyActions(baselineDistricts, validation.selectedActions, catalog);
  const afterScore = scoreDistricts(districtsAfter);
  const districtResultsAfter = toDistrictResults(baselineDistricts, districtsAfter, afterScore);
  const improvedDistrictCount = districtResultsAfter.filter((district) => {
    const before = districtsBefore.find((item) => item.id === district.id);
    return before ? district.score > before.score : false;
  }).length;
  const weakestDistrict = afterScore.districtScores.reduce((weakest, district) =>
    district.score < weakest.score ? district : weakest
  );
  const weakestCategory = afterScore.categoryScores.reduce((weakest, category) =>
    category.score < weakest.score ? category : weakest
  );
  const recommendations = buildRecommendations({
    catalog,
    selectedActions: validation.selectedActions,
    districtsAfter: districtResultsAfter,
    analysisData: {
      weakestDistrict,
      weakestCategory,
      criticalIssueCount: afterScore.criticalIssueCount,
      improvedDistrictCount,
      budgetUsed: validation.totalCost,
      budgetRemaining: TOTAL_BUDGET - validation.totalCost
    }
  });

  return {
    valid: true,
    errors: [],
    scoreBefore: beforeScore.score,
    scoreAfter: afterScore.score,
    delta: roundToTwo(afterScore.score - beforeScore.score),
    districtsBefore,
    districtsAfter: districtResultsAfter,
    selectedActions: validation.selectedActions,
    analysisData: {
      weakestDistrict,
      weakestCategory,
      criticalIssueCount: afterScore.criticalIssueCount,
      improvedDistrictCount,
      budgetUsed: validation.totalCost,
      budgetRemaining: TOTAL_BUDGET - validation.totalCost
    },
    recommendations
  };
}

function applyActions(baseDistricts: District[], selectedActions: SelectedAction[], catalog: DataCatalog): District[] {
  const districts = cloneDistricts(baseDistricts);

  for (const action of selectedActions) {
    const realizedShare = (HORIZON_QUARTERS - action.initiative.lag) / HORIZON_QUARTERS;
    const targets = action.initiative.scope === "city"
      ? districts
      : districts.filter((district) => district.id === action.districtId);

    for (const district of targets) {
      for (const [metric, effect] of Object.entries(action.initiative.effects) as Array<[MetricCode, number]>) {
        district.metrics[metric] = clamp(district.metrics[metric] + effect * realizedShare);
      }
    }
  }

  applySynergies(districts, selectedActions, catalog);
  return districts.map((district) => ({
    ...district,
    metrics: Object.fromEntries(
      Object.entries(district.metrics).map(([metric, value]) => [metric, roundToTwo(value)])
    ) as Record<MetricCode, number>
  }));
}

function applySynergies(districts: District[], selectedActions: SelectedAction[], catalog: DataCatalog): void {
  for (const synergy of catalog.synergies) {
    const [firstId, secondId] = synergy.initiativeIds;
    const hasBoth = selectedActions.some((action) => action.initiative.id === firstId)
      && selectedActions.some((action) => action.initiative.id === secondId);
    if (!hasBoth) {
      continue;
    }

    const sourceAction = selectedActions.find((action) => action.initiative.id === synergy.districtSourceInitiativeId);
    if (!sourceAction?.districtId) {
      continue;
    }

    const targetDistrict = districts.find((district) => district.id === sourceAction.districtId);
    if (!targetDistrict) {
      continue;
    }

    for (const [metric, bonus] of Object.entries(synergy.bonus) as Array<[MetricCode, number]>) {
      targetDistrict.metrics[metric] = clamp(targetDistrict.metrics[metric] + bonus);
    }
  }
}

function cloneDistricts(districts: District[]): District[] {
  return districts.map((district) => ({
    ...district,
    metrics: { ...district.metrics },
    id: district.id as DistrictId
  }));
}
