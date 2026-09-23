export type DistrictId = "yesil" | "almaty" | "saryarka" | "baikonur" | "nura";

export type MetricCode =
  | "T1"
  | "T2"
  | "E1"
  | "E2"
  | "S1"
  | "S2"
  | "B1"
  | "B2"
  | "C1"
  | "C2";

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

export interface Synergy {
  initiativeIds: [string, string];
  districtSourceInitiativeId: string;
  bonus: Partial<Record<MetricCode, number>>;
}

export interface Conflict {
  initiativeIds: [string, string];
  scope: "global" | "sameDistrict";
  message: string;
}

export interface ActionInput {
  initiativeId: string;
  districtId?: DistrictId;
}

export interface SelectedAction {
  initiative: Initiative;
  districtId?: DistrictId;
}

export interface DistrictScore {
  districtId: DistrictId;
  districtName: string;
  populationShare: number;
  score: number;
  criticalIssues: MetricCode[];
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

export interface ScoreBreakdown {
  score: number;
  cityAverage: number;
  weakestDistrictScore: number;
  criticalIssueCount: number;
  districtScores: DistrictScore[];
  categoryScores: CategoryScore[];
}

export interface Recommendation {
  type: "weakestDistrict" | "weakestCategory" | "criticalIndicator" | "unusedBudget";
  title: string;
  rationale: string;
  initiativeIds: string[];
}

export interface AnalysisData {
  weakestDistrict: DistrictScore;
  weakestCategory: CategoryScore;
  criticalIssueCount: number;
  improvedDistrictCount: number;
  budgetUsed: number;
  budgetRemaining: number;
}

export interface SimulationResult {
  valid: boolean;
  errors: string[];
  scoreBefore: number;
  scoreAfter: number | null;
  delta: number | null;
  districtsBefore: DistrictResult[];
  districtsAfter: DistrictResult[];
  selectedActions: SelectedAction[];
  analysisData: AnalysisData | null;
  recommendations: Recommendation[];
}

export interface SingleReplacementAlternative {
  actions: ActionInput[];
  replacedAction: ActionInput;
  replacementAction: ActionInput;
  scoreAfter: number;
  delta: number;
}

export interface DataCatalog {
  districts: District[];
  initiatives: Initiative[];
  synergies: Synergy[];
  conflicts: Conflict[];
}
