export type AnalysisPriority = 'high' | 'medium' | 'low';

export interface AiAnalysis {
  source: 'openai' | 'fallback';
  executive_summary: string;
  strengths: string[];
  risks: string[];
  tradeoffs: string[];
  recommendations: Array<{
    priority: AnalysisPriority;
    action: string;
    rationale: string;
  }>;
  district_notes: Array<{
    district: string;
    note: string;
  }>;
}
