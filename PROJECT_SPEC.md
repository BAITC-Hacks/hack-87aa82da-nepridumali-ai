# AQM Impact Lab — Shared Project Specification

## 1. Product

Project name: **AQM Impact Lab — «Аким на 5 часов»**

We are building an AI-assisted city-budget simulation for the HackAlemAI hackathon.

A city manager receives the same fixed virtual budget and must make exactly five decisions:
1. Transport
2. Urban greening
3. Social infrastructure
4. Safety
5. City services

The product calculates deterministic effects on synthetic city districts and returns an **Astana Quality of Life Score (AQoLS)** with an AI explanation of strengths, risks, trade-offs, and recommendations.

UI language: Russian.
Source code language: English.
All city data is synthetic. Do not make claims about real Astana statistics or budget values.

## 2. Must-have acceptance criteria

The app must:

- Give every user a fixed budget of **1,000 million KZT**.
- Require exactly one initiative in every one of five categories.
- Prevent a scenario from exceeding the budget.
- Show selected initiatives, spent budget, and remaining budget.
- Calculate a deterministic AQoLS from 0 to 100.
- Show before/after results for all five categories.
- Explain the scenario’s strengths, risks, trade-offs, and improvement recommendations.
- Use OpenAI only for natural-language analysis.
- Never let the LLM calculate, modify, or invent numerical simulation results.
- Work in fallback mode when `OPENAI_API_KEY` is absent or OpenAI is unavailable.
- Be documented and reproducible from README.

## 3. Tech stack

- Next.js, App Router
- TypeScript
- Tailwind CSS
- Recharts
- Zod
- Vitest
- OpenAI API through a server-only API route
- No database
- No authentication
- No external data dependency
- No secrets committed to Git

## 4. Repository architecture

```text
src/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts
│   ├── page.tsx
│   └── layout.tsx
├── components/
│   ├── BudgetBar.tsx
│   ├── CategoryCard.tsx
│   ├── ScoreCard.tsx
│   ├── ImpactChart.tsx
│   └── AnalysisPanel.tsx
├── data/
│   ├── districts.ts
│   └── initiatives.ts
├── lib/
│   ├── simulator.ts
│   └── fallback-analysis.ts
├── types/
│   ├── index.ts
│   └── analysis.ts
└── lib/
    └── simulator.test.ts

README.md
.env.example
PROJECT_SPEC.md
```

## 5. Shared domain contract

```ts
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
```

Do not change shared type names, field names, or category identifiers without approval from the team integrator.

## 6. Simulation rules

Fixed city budget:

```ts
const TOTAL_BUDGET_MLN_KZT = 1000;
```

The five score weights:

```ts
const SCORE_WEIGHTS = {
  transport: 0.27,
  greening: 0.20,
  social: 0.22,
  safety: 0.18,
  services: 0.13,
};
```

Category scores must be population-weighted:

\[
I_k = \frac{\sum_{d=1}^{n} population_d \times score_{d,k}}{\sum_{d=1}^{n} population_d}
\]

Base score:

\[
BaseScore =
0.27T + 0.20G + 0.22S + 0.18B + 0.13C
\]

Imbalance penalty:

\[
Penalty = 0.15 \times (\max(T,G,S,B,C) - \min(T,G,S,B,C))
\]

Final score:

\[
AQoLS = clamp(BaseScore - Penalty, 0, 100)
\]

All district indicators must be clamped to 0–100.

A selection is invalid when:

- There are not exactly five selected initiatives.
- Any category is missing.
- More than one initiative is selected in a category.
- An initiative ID does not exist.
- Total selected cost is greater than 1,000 million KZT.

## 7. AI analysis rules

The AI route receives only an already calculated `ScenarioResult`.

The AI may:

- Explain strengths.
- Describe risks and trade-offs.
- Give recommendations using only initiatives in the supplied catalog.
- Create concise district-level notes.
- Respond in Russian.

The AI must not:

- Recalculate AQoLS.
- Change budget amounts.
- Invent districts, initiatives, prices, statistics, or numeric effects.
- Claim synthetic data represents actual Astana data.
- Provide unsupported factual claims.

Expected output:

```ts
export interface AiAnalysis {
  source: "openai" | "fallback";
  executive_summary: string;
  strengths: string[];
  risks: string[];
  tradeoffs: string[];
  recommendations: Array<{
    priority: "high" | "medium" | "low";
    action: string;
    rationale: string;
  }>;
  district_notes: Array<{
    district: string;
    note: string;
  }>;
}
```

If API access fails, return a valid deterministic fallback `AiAnalysis`, never a broken page.

## 8. Git workflow

- `main` is the integration/demo branch.
- No one pushes directly to `main` except the integrator.
- Every person works only in their own branch.
- One task = one focused commit or a small set of related commits.
- Before merging into `main`, run lint, typecheck, tests, and build.
- Never commit `.env`, `.env.local`, API tokens, or generated secrets.
- Push meaningful progress at least once per hour.

Branches:

```text
feat/simulation-core
feat/ai-analysis
feat/frontend-dashboard
```

## 9. Definition of done

A feature is done only when:

- It is implemented without breaking shared contracts.
- It has been verified with relevant tests or commands.
- It handles obvious invalid/error states.
- It is committed and pushed to the correct branch.
- It is described in README if a user or judge needs to understand it.

Run before release:

```bash
npm run lint
npm run test
npm run build
```

## 10. Demo scenario

1. Start with budget of 1,000 million KZT.
2. Choose one initiative in all five categories.
3. Show live budget usage and budget-limit protection.
4. Calculate and show AQoLS before and after.
5. Show category before/after graph and district changes.
6. Show AI explanation: strengths, risks, trade-offs, recommendations.
7. Change one decision and show that Score and analysis change.

