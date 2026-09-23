import type { Category, CategoryScore, District, DistrictResult, DistrictScore, MetricCode, ScoreBreakdown } from "../types/index.js";

export const METRIC_CODES: MetricCode[] = ["T1", "T2", "E1", "E2", "S1", "S2", "B1", "B2", "C1", "C2"];

export const METRIC_WEIGHTS: Record<MetricCode, number> = {
  T1: 0.1,
  T2: 0.1,
  E1: 0.09,
  E2: 0.11,
  S1: 0.11,
  S2: 0.11,
  B1: 0.09,
  B2: 0.09,
  C1: 0.1,
  C2: 0.1
};

export const CATEGORY_METRICS: Record<Category, MetricCode[]> = {
  transport: ["T1", "T2"],
  ecology: ["E1", "E2"],
  social: ["S1", "S2"],
  safety: ["B1", "B2"],
  services: ["C1", "C2"]
};

const CATEGORIES = Object.keys(CATEGORY_METRICS) as Category[];

export function scoreDistrict(district: District): DistrictScore {
  const score = roundToTwo(
    METRIC_CODES.reduce((sum, metric) => sum + district.metrics[metric] * METRIC_WEIGHTS[metric], 0)
  );
  return {
    districtId: district.id,
    districtName: district.name,
    populationShare: district.populationShare,
    score,
    criticalIssues: METRIC_CODES.filter((metric) => district.metrics[metric] < 40)
  };
}

export function scoreDistricts(districts: District[]): ScoreBreakdown {
  const districtScores = districts.map(scoreDistrict);
  const cityAverage = roundToTwo(
    districtScores.reduce((sum, district) => sum + district.populationShare * district.score, 0)
  );
  const weakestDistrictScore = Math.min(...districtScores.map((district) => district.score));
  const criticalIssueCount = districtScores.reduce((sum, district) => sum + district.criticalIssues.length, 0);
  const score = roundToTwo(0.7 * cityAverage + 0.3 * weakestDistrictScore - criticalIssueCount);

  return {
    score,
    cityAverage,
    weakestDistrictScore,
    criticalIssueCount,
    districtScores,
    categoryScores: calculateCategoryScores(districts)
  };
}

export function toDistrictResults(before: District[], after: District[], scores: ScoreBreakdown): DistrictResult[] {
  return after.map((district) => {
    const baseline = before.find((item) => item.id === district.id);
    const districtScore = scores.districtScores.find((item) => item.districtId === district.id);
    if (!baseline || !districtScore) {
      throw new Error(`Missing scoring pair for district ${district.id}`);
    }
    return {
      ...district,
      score: districtScore.score,
      criticalIssues: districtScore.criticalIssues,
      metricDelta: METRIC_CODES.reduce<Record<MetricCode, number>>((delta, metric) => {
        delta[metric] = roundToTwo(district.metrics[metric] - baseline.metrics[metric]);
        return delta;
      }, emptyMetricRecord())
    };
  });
}

function calculateCategoryScores(districts: District[]): CategoryScore[] {
  return CATEGORIES.map((category) => {
    const metrics = CATEGORY_METRICS[category];
    const score = roundToTwo(
      districts.reduce((districtSum, district) => {
        const districtCategoryScore = metrics.reduce((sum, metric) => sum + district.metrics[metric], 0) / metrics.length;
        return districtSum + district.populationShare * districtCategoryScore;
      }, 0)
    );
    return { category, score };
  });
}

function emptyMetricRecord(): Record<MetricCode, number> {
  return {
    T1: 0,
    T2: 0,
    E1: 0,
    E2: 0,
    S1: 0,
    S2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
    C2: 0
  };
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(Math.max(value, min), max);
}

export function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
