export type Category =
  | "transport"
  | "greening"
  | "social"
  | "safety"
  | "services";

export type DistrictId =
  | "altyn"
  | "saryarka"
  | "yesil"
  | "baiterek";

export interface District {
  id: DistrictId;
  nameRu: string;
  population: number;
  indicators: Record<Category, number>;
}

export interface Initiative {
  id: string;
  category: Category;
  titleRu: string;
  descriptionRu: string;
  costMlnKzt: number;
  effects: Partial<Record<DistrictId, Partial<Record<Category, number>>>>;
  tradeoffRu: string;
  horizonRu: string;
}

export interface ScenarioResult {
  isValid: boolean;
  errors: string[];
  totalBudgetMlnKzt: number;
  spentMlnKzt: number;
  remainingMlnKzt: number;
  scoreBefore: number;
  scoreAfter: number;
  categoryScoresBefore: Record<Category, number>;
  categoryScoresAfter: Record<Category, number>;
  imbalancePenalty: number;
  districtResults: District[];
  selectedInitiatives: Initiative[];
}
