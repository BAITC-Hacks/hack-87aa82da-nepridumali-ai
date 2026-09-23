export type DistrictId = "yesil" | "almaty" | "saryarka" | "baikonur" | "nura";
export type MetricCode = "T1" | "T2" | "E1" | "E2" | "S1" | "S2" | "B1" | "B2" | "C1" | "C2";
export type Category = "transport" | "ecology" | "social" | "safety" | "services";
export type InitiativeScope = "district" | "city";

export interface District {
  id: DistrictId;
  name: string;
  populationShare: number;
  profile: string;
  metrics: Record<MetricCode, number>;
}

export interface Initiative {
  id: string;
  category: Category;
  name: string;
  scope: InitiativeScope;
  cost: number;
  lag: number;
  effects: Partial<Record<MetricCode, number>>;
}

export interface ActionInput {
  initiativeId: string;
  districtId?: DistrictId;
}

export interface DistrictResult extends District {
  score: number;
  criticalIssues: MetricCode[];
  metricDelta: Record<MetricCode, number>;
}

export interface CategoryScore {
  category: Category;
  score: number;
}

export interface AnalysisData {
  weakestDistrict: {
    districtId: DistrictId;
    districtName: string;
    populationShare: number;
    score: number;
    criticalIssues: MetricCode[];
  };
  weakestCategory: CategoryScore;
  criticalIssueCount: number;
  improvedDistrictCount: number;
  budgetUsed: number;
  budgetRemaining: number;
}

export interface Recommendation {
  type: string;
  title: string;
  rationale: string;
  initiativeIds: string[];
}

export interface SimulationResult {
  valid: boolean;
  errors: string[];
  scoreBefore: number;
  scoreAfter: number | null;
  delta: number | null;
  districtsBefore: DistrictResult[];
  districtsAfter: DistrictResult[];
  selectedActions: Array<{
    initiative: Initiative;
    districtId?: DistrictId;
  }>;
  analysisData: AnalysisData | null;
  recommendations: Recommendation[];
}

export interface AiAnalysis {
  source: "openai" | "fallback";
  executiveSummary: string;
  keyImprovements: string[];
  risks: string[];
  tradeoffs: string[];
  strategicRecommendations: string[];
  suggestedNextInvestments: string[];
}
