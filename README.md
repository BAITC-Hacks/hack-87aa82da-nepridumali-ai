# Akim for 5 Hours

AI City Management Simulator for the HackAlem hackathon case.

## Overview

The app lets a user act as a city mayor, select exactly five initiatives within a 100-unit budget, and see how those decisions change district indicators and the Astana Quality of Life Score. The backend performs every numerical calculation deterministically. OpenAI is used only to explain already-calculated results.

## Architecture

```text
frontend/  React, Vite, TypeScript, Tailwind CSS, Recharts
backend/   Node.js, Express, TypeScript
data/      Local JSON datasets generated from the case documents
```

The backend separates routes from business logic:

- validation engine
- simulation engine
- scoring engine
- recommendation engine
- AI analysis engine

## Setup

```bash
npm run setup
npm run dev
```

Frontend runs on `http://localhost:5173`.
Backend runs on `http://localhost:4000`.

## Environment Variables

Backend:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
```

Frontend:

```bash
VITE_API_URL=http://localhost:4000
```

## Local Development

```bash
npm run dev
npm run test
npm run build
```

The root package starts both apps. `backend/` and `frontend/` each have their
own committed lockfile, so dependency installation stays reproducible without
depending on npm workspace resolution.

## API Documentation

### POST `/simulate`

Request:

```json
{
  "actions": [
    { "initiativeId": "M7", "districtId": "nura" },
    { "initiativeId": "M8", "districtId": "nura" },
    { "initiativeId": "M10", "districtId": "nura" },
    { "initiativeId": "M12" },
    { "initiativeId": "M5", "districtId": "saryarka" }
  ]
}
```

Response includes validation errors, score before, score after, delta, district changes, selected actions, analysis data, and deterministic recommendations.

### POST `/analysis`

Request body uses the same action list as `/simulate`. The backend recalculates the
scenario before sending its result to the AI, so a browser cannot provide altered
scores or indicators. The AI explains strengths, weaknesses, tradeoffs, risks,
strategic recommendations, and suggested next investments without recalculating
metrics. If the API key is unavailable or a structured AI response cannot be
validated, the frontend continues to show the deterministic server analysis.

## Deployment

### Vercel

Deploy `frontend/` as the Vercel project root and set `VITE_API_URL` to the Render backend URL.

### Render

Deploy `backend/` as a Node service. Set `OPENAI_API_KEY`, `PORT`, and `FRONTEND_ORIGIN`.

## Screenshots

Add screenshots of the dashboard, simulation output, district detail view, and scenario comparison after deployment.

## Judging Criteria Alignment

- **Task fit:** exact district dataset, initiatives, validation rules, synergies, conflicts, and scoring formula from the case.
- **Technical implementation:** modular deterministic backend and responsive analytics frontend.
- **Reproducibility:** documented setup, API, and deployment.
- **Practical value:** decision-support dashboard with scenario comparison and recommendations.
- **Presentation quality:** KPI cards, charts, district analytics, and AI strategic explanation.
