import type { AnalysisData, DataCatalog, DistrictResult, MetricCode, Recommendation, SelectedAction } from "../types/index.js";
import { CATEGORY_METRICS } from "./scoringEngine.js";

interface RecommendationInput {
  catalog: DataCatalog;
  selectedActions: SelectedAction[];
  districtsAfter: DistrictResult[];
  analysisData: AnalysisData;
}

export function buildRecommendations(input: RecommendationInput): Recommendation[] {
  const selectedIds = new Set(input.selectedActions.map((action) => action.initiative.id));
  const recommendations: Recommendation[] = [];

  recommendations.push({
    type: "weakestDistrict",
    title: `Усилить район ${input.analysisData.weakestDistrict.districtName}`,
    rationale: `Самый низкий районный балл после сценария: ${input.analysisData.weakestDistrict.score}.`,
    initiativeIds: findInitiativesForDistrict(input, input.analysisData.weakestDistrict.districtId)
  });

  const weakestMetrics = CATEGORY_METRICS[input.analysisData.weakestCategory.category];
  recommendations.push({
    type: "weakestCategory",
    title: `Поддержать направление ${input.analysisData.weakestCategory.category}`,
    rationale: `Это самое слабое направление после расчета: ${input.analysisData.weakestCategory.score}.`,
    initiativeIds: input.catalog.initiatives
      .filter((initiative) => !selectedIds.has(initiative.id))
      .filter((initiative) => weakestMetrics.some((metric) => initiative.effects[metric] !== undefined))
      .slice(0, 3)
      .map((initiative) => initiative.id)
  });

  const criticalMetrics = input.districtsAfter.flatMap((district) =>
    district.criticalIssues.map((metric) => ({ district, metric }))
  );
  const [firstCritical] = criticalMetrics;
  if (firstCritical) {
    recommendations.push({
      type: "criticalIndicator",
      title: `Закрыть критический показатель ${firstCritical.metric} в районе ${firstCritical.district.name}`,
      rationale: "Показатели ниже 40 напрямую снижают итоговый Score через штраф N_crit.",
      initiativeIds: findInitiativesForMetric(input.catalog, selectedIds, firstCritical.metric)
    });
  }

  if (input.analysisData.budgetRemaining > 0) {
    recommendations.push({
      type: "unusedBudget",
      title: "Использовать остаток бюджета точечно",
      rationale: `Остаток бюджета: ${input.analysisData.budgetRemaining}. Он не дает бонуса сам по себе.`,
      initiativeIds: input.catalog.initiatives
        .filter((initiative) => !selectedIds.has(initiative.id))
        .filter((initiative) => initiative.cost <= input.analysisData.budgetRemaining)
        .slice(0, 3)
        .map((initiative) => initiative.id)
    });
  }

  return recommendations;
}

function findInitiativesForDistrict(input: RecommendationInput, districtId: string): string[] {
  const selectedIds = new Set(input.selectedActions.map((action) => action.initiative.id));
  const district = input.districtsAfter.find((item) => item.id === districtId);
  const metricsToImprove = district?.criticalIssues.length ? district.criticalIssues : (["T1", "T2", "E1", "E2", "S1", "S2", "B1", "B2", "C1", "C2"] as MetricCode[]);
  return input.catalog.initiatives
    .filter((initiative) => !selectedIds.has(initiative.id))
    .filter((initiative) => metricsToImprove.some((metric) => initiative.effects[metric] !== undefined))
    .slice(0, 3)
    .map((initiative) => initiative.id);
}

function findInitiativesForMetric(catalog: DataCatalog, selectedIds: Set<string>, metric: MetricCode): string[] {
  return catalog.initiatives
    .filter((initiative) => !selectedIds.has(initiative.id))
    .filter((initiative) => initiative.effects[metric] !== undefined)
    .slice(0, 3)
    .map((initiative) => initiative.id);
}
