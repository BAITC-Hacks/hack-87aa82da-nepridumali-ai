export type Category =
  "transport" | "ecology" | "social" | "safety" | "services";
export type DistrictId = "yesil" | "almaty" | "saryarka" | "baikonur" | "nura";
export type Metric =
  "T1" | "T2" | "E1" | "E2" | "S1" | "S2" | "B1" | "B2" | "C1" | "C2";
export interface Initiative {
  id: string;
  category: Category;
  name: string;
  scope: "district" | "city";
  cost: number;
  lag: number;
  effects: Partial<Record<Metric, number>>;
}
export interface Action {
  initiativeId: string;
  districtId?: DistrictId;
}
export interface District {
  id: DistrictId;
  name: string;
  populationShare: number;
  metrics: Record<Metric, number>;
  score?: number;
  criticalIssues?: Metric[];
}
// Frontend projection of the new /simulate contract. All result numbers come
// from the backend. Optional analytics stay absent when the server omits them.
export interface SimulationResult {
  valid: true;
  errors: string[];
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
  districtsBefore: District[];
  districtsAfter: District[];
  selectedActions: Action[];
  analysisData: Record<string, unknown>;
  recommendations: unknown[];
  raw: Record<string, unknown>;
}
export interface Analysis {
  source: "openai" | "fallback";
  executive_summary: string;
  key_improvements: string[];
  risks: string[];
  tradeoffs: string[];
  strategic_recommendations: string[];
  suggested_next_investments: string[];
}
export interface SavedScenario {
  result: SimulationResult;
  actions: Action[];
  name: "A" | "B";
}
