# Akim for 5 Hours — AI City Management Simulator

## 1. Product

Project name: **Akim for 5 Hours — AI City Management Simulator**

We are building a production-ready MVP for the HackAlem hackathon case.

The user acts as a city mayor and allocates a fixed virtual budget across city initiatives. The app simulates how selected initiatives affect synthetic district indicators and returns:

- updated district indicators;
- updated district scores;
- updated city indicators;
- Astana Quality of Life Score before and after;
- deterministic recommendations;
- AI-generated strategic analysis.

The product must feel like a professional urban analytics dashboard for city administrators.

## 2. Source Of Truth

The attached documents are the single source of truth for:

- districts;
- population shares;
- district metrics;
- initiatives;
- initiative costs;
- initiative effects;
- initiative lags;
- synergies;
- incompatibilities;
- validation rules;
- scoring formulas;
- weights.

Do not invent, simplify, replace, estimate, or modify the simulation rules or dataset.

## 3. Tech Stack

Frontend:

- React
- Vite
- TypeScript
- Tailwind CSS
- Recharts

Backend:

- Node.js
- Express
- TypeScript

AI:

- OpenAI API

Database:

- None

Data storage:

- Local JSON files generated from the attached dataset.

Do not use:

- PostgreSQL
- MongoDB
- Docker
- authentication
- user accounts

Deployment:

- Frontend: Vercel
- Backend: Render

## 4. Repository Architecture

```text
frontend/
  src/
    components/
    pages/
    lib/
    types/
    App.tsx
    main.tsx

backend/
  src/
    routes/
      simulate.ts
      analysis.ts
    engines/
      validationEngine.ts
      simulationEngine.ts
      scoringEngine.ts
      recommendationEngine.ts
      aiAnalysisEngine.ts
    data/
      loadData.ts
    types/
      index.ts
    server.ts

data/
  districts.json
  initiatives.json
  synergies.json
  conflicts.json

README.md
```

Business logic must stay separate from Express routes.

## 5. Dataset

Generate these files from the attached documents:

- `data/districts.json`
- `data/initiatives.json`
- `data/synergies.json`
- `data/conflicts.json`

### Districts

Use exactly these synthetic districts:

| District | Population Share |
|---|---:|
| Есиль | 0.27 |
| Алматы | 0.24 |
| Сарыарка | 0.20 |
| Байконур | 0.13 |
| Нура | 0.16 |

District metrics use a 0-100 scale where higher is better.

Metrics:

| Code | Direction | Meaning |
|---|---|---|
| T1 | Transport | Road congestion relief |
| T2 | Transport | Public transport accessibility |
| E1 | Ecology | Greening |
| E2 | Ecology | Air quality |
| S1 | Social | Schools and kindergartens |
| S2 | Social | Clinics and primary healthcare |
| B1 | Safety | Street safety |
| B2 | Safety | Road safety |
| C1 | Services | Utility reliability |
| C2 | Services | Resident request resolution speed |

Baseline values:

| District | T1 | T2 | E1 | E2 | S1 | S2 | B1 | B2 | C1 | C2 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Есиль | 45 | 62 | 68 | 72 | 48 | 55 | 78 | 60 | 75 | 70 |
| Алматы | 40 | 75 | 50 | 55 | 60 | 65 | 62 | 52 | 50 | 60 |
| Сарыарка | 50 | 70 | 42 | 40 | 62 | 68 | 58 | 55 | 45 | 55 |
| Байконур | 52 | 68 | 55 | 50 | 58 | 60 | 52 | 58 | 55 | 58 |
| Нура | 55 | 40 | 45 | 65 | 38 | 35 | 55 | 50 | 60 | 50 |

## 6. Initiatives

Use exactly 14 initiatives from the dataset.

Each initiative must include:

- id;
- category;
- name;
- scope: `district` or `city`;
- cost;
- lag;
- effects.

Simulation horizon:

```ts
const HORIZON_QUARTERS = 8;
```

Realized effect share:

```ts
realizedEffect = (8 - lag) / 8;
```

Initiatives:

| ID | Category | Name | Scope | Cost | Lag | Effects |
|---|---|---|---|---:|---:|---|
| M1 | Transport | Выделенные полосы для автобусов | District | 18 | 2 | T1 +6, T2 +9 |
| M2 | Transport | Умные светофоры | City | 22 | 2 | T1 +4, B2 +3 |
| M3 | Transport | Линия ЛРТ / расширение | District | 30 | 4 | T1 +16, T2 +20, E2 +4 |
| M4 | Ecology | Парк / сквер | District | 15 | 2 | E1 +12, E2 +3, B1 +2 |
| M5 | Ecology | Перевод частного сектора на чистое топливо | District | 25 | 3 | E2 +14, C1 +4 |
| M6 | Ecology | Городская программа озеленения и ветрозащитных полос | City | 20 | 4 | E1 +5, E2 +3 |
| M7 | Social | Школа + детсад | District | 24 | 3 | S1 +16 |
| M8 | Social | Центр семейного здоровья / поликлиника | District | 20 | 3 | S2 +14 |
| M9 | Social | Дворовые спорт-хабы | District | 10 | 1 | S1 +3, S2 +3, B1 +3 |
| M10 | Safety | Освещение и камеры | District | 12 | 1 | B1 +12, B2 +2 |
| M11 | Safety | Безопасные переходы и школьные зоны | District | 10 | 1 | B2 +12, T1 -2 |
| M12 | Services | Единая цифровая платформа обращений | City | 14 | 1 | C2 +5 |
| M13 | Services | Модернизация тепло- и водосетей | District | 28 | 4 | C1 +18, E2 +2 |
| M14 | Services | Аварийные бригады ЖКХ + раннее оповещение | City | 16 | 1 | C1 +5, C2 +2 |

## 7. Synergies

Apply synergy bonuses only when both initiatives are selected.

Synergy bonuses are fixed and are not scaled by lag.

| Pair | Bonus |
|---|---|
| M1 + M2 | T1 +2 in M1 district |
| M10 + M12 | B1 +2 in M10 district |
| M5 + M6 | E2 +2 in M5 district |

## 8. Incompatibilities

Invalid selections:

- M1 and M3 cannot both be selected anywhere.
- M4 and M7 cannot both be selected in the same district.
- M5 and M13 cannot both be selected in the same district.

## 9. Validation Rules

Budget:

```ts
const TOTAL_BUDGET = 100;
```

A scenario is invalid when:

- selected action count is not exactly 5;
- total cost exceeds 100;
- the same initiative is selected more than once;
- more than 2 initiatives are selected from one category;
- fewer than 3 categories are represented;
- an initiative ID does not exist;
- a district-scoped initiative has no district;
- a city-scoped initiative has a district;
- incompatibility rules are violated.

For invalid scenarios, the backend must return validation errors and must not calculate a final score.

Order of actions has no effect.

## 10. Simulation Formula

For each selected initiative:

- city-scoped effects apply to all districts;
- district-scoped effects apply only to the selected district;
- effects are multiplied by `(8 - lag) / 8`;
- synergy bonuses are applied after initiative effects;
- all metric values are clamped to `[0, 100]`.

New indicator value:

```ts
I_next[d][k] = clamp(
  I_base[d][k] + sum(realizedEffects[d][k]) + synergyBonuses[d][k],
  0,
  100
);
```

Metric weights:

| Metric | Weight |
|---|---:|
| T1 | 0.10 |
| T2 | 0.10 |
| E1 | 0.09 |
| E2 | 0.11 |
| S1 | 0.11 |
| S2 | 0.11 |
| B1 | 0.09 |
| B2 | 0.09 |
| C1 | 0.10 |
| C2 | 0.10 |

District score:

```ts
D_d = sum(metricWeight[k] * I_d[k]);
```

Population-weighted city score:

```ts
D_avg = sum(populationShare[d] * D_d);
```

Critical issue count:

```ts
N_crit = count(districtMetricValue < 40);
```

Final Astana Quality of Life Score:

```ts
Score = 0.7 * D_avg + 0.3 * min(D_d) - N_crit;
```

Baseline score without actions:

```ts
52.56
```

## 11. Backend API

### POST `/simulate`

Input:

```json
{
  "actions": [
    {
      "initiativeId": "M7",
      "districtId": "nura"
    }
  ]
}
```

City-scoped initiatives must omit `districtId`.

Response:

```json
{
  "valid": true,
  "errors": [],
  "scoreBefore": 52.56,
  "scoreAfter": 56.5,
  "delta": 3.94,
  "districtsBefore": [],
  "districtsAfter": [],
  "selectedActions": [],
  "analysisData": {},
  "recommendations": []
}
```

### POST `/analysis`

Uses OpenAI API.

The AI receives only backend-calculated results and deterministic recommendations.

The AI must not calculate, alter, or invent numbers.

AI role:

```text
Urban Development Strategic Advisor
```

The response must include:

1. Executive Summary
2. Key Improvements
3. Risks
4. Tradeoffs
5. Strategic Recommendations
6. Suggested Next Investments

## 12. Deterministic Recommendation Engine

Before calling OpenAI, backend must calculate deterministic recommendations from simulation results.

The recommendation engine should identify:

- weakest district;
- weakest category;
- critical indicators;
- unused budget opportunities;
- initiatives that could improve weak areas.

Recommendations must be based only on dataset initiatives and calculated metrics.

## 13. Frontend Requirements

The frontend must be a modern responsive dashboard.

Page title:

```text
Akim for 5 Hours
```

Top KPI cards:

- Current Astana Quality of Life Score
- Budget Used
- Budget Remaining
- Number of Critical Issues
- Number of Improved Districts

The UI must include:

- district cards;
- current indicators;
- initiative catalog;
- initiative filtering;
- initiative sorting;
- initiative search;
- district selection for district-scoped initiatives;
- immediate validation errors;
- selected initiatives panel;
- budget usage display;
- Run Simulation button.

Each initiative card must show:

- name;
- category;
- cost;
- effects;
- scope;
- lag;
- expected impact.

## 14. Analytics Views

After simulation, show:

- Score Before
- Score After
- Improvement Delta
- district comparison table
- district rankings
- metric changes
- budget allocation

Use Recharts for:

- District Score Comparison Chart
- Before vs After Chart
- Category Impact Chart
- Budget Allocation Chart
- Critical Metrics Chart
- district detail radar chart

Each district detail view must show:

- district score;
- population share;
- current metrics;
- updated metrics;
- improvement amount;
- radar chart;
- metric breakdown;
- before/after comparison.

## 15. Scenario Comparison

Users must be able to:

- save Scenario A;
- save Scenario B;
- compare scenarios.

Comparison view must show:

- score difference;
- district differences;
- category differences;
- budget allocation differences.

Scenario comparison is frontend state only. No database is used.

## 16. README Requirements

README must include:

- project overview;
- architecture;
- setup;
- installation;
- environment variables;
- local development;
- deployment to Vercel;
- deployment to Render;
- API documentation;
- screenshots section;
- judging criteria alignment.

## 17. Quality Requirements

The repository must be hackathon-ready.

Requirements:

- TypeScript everywhere;
- clean architecture;
- modular backend engines;
- reusable frontend components;
- responsive design;
- professional dashboard UI;
- no placeholders;
- no TODO comments;
- no unfinished code;
- no pseudocode;
- no fake API responses.

The app must be demo-ready without manual setup beyond documented installation and environment variables.

## 18. Judging Alignment

The MVP must demonstrate:

- task fit and working core scenario;
- technical quality and architecture;
- reproducibility from README;
- practical value as a decision-support platform;
- polished presentation quality;
- clear AI value without allowing AI to calculate simulation numbers.
