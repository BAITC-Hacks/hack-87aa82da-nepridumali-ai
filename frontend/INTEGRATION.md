# Frontend integration

This frontend implements the revised specification from
[`feat/simulation-core`, commit `95e841a`](https://github.com/BAITC-Hacks/hack-87aa82da-nepridumali-ai/blob/95e841a/PROJECT_SPEC.md):
Vite + React, budget 100, 14 initiatives and five synthetic districts.
The API adapter targets the actual Express implementation in
[`feat/simulation-core-v2`, commit `ba1ecb5`](https://github.com/BAITC-Hacks/hack-87aa82da-nepridumali-ai/tree/ba1ecb5/backend).
Shared specifications and backend files are not modified by this frontend task.

## Run and verify

Use Node.js 20.19+ in the 20.x line, or Node.js 22.12+ (including 24.x).
From `frontend/`:

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Start the team's backend separately. The development server proxies `/simulate`
and `/analysis` to `http://127.0.0.1:4000`, matching its default port. Set
`API_PROXY_TARGET` before starting Vite to use another local backend.
In deployment, set the public build variable `VITE_API_URL` to the HTTPS backend
origin without endpoint paths. The backend must allow the frontend origin via
CORS. Never put an OpenAI key in Vite variables.

For Vercel, use `frontend` as Root Directory, `npm run build`, and `dist` as output.
Views use in-memory state and do not require routing rewrites. Scenario A/B
snapshots reset on page reload.

## API boundary

`src/lib/api.ts` is the single integration boundary. There is no local simulator
and no substituted API response in application code. `*.test.ts` fixtures are
only used by tests.

`POST /simulate` sends `{ "actions": [{ "initiativeId": "M7", "districtId": "nura" }] }`.
Only a valid complete selection can be submitted. City actions omit `districtId`.
The adapter accepts the backend's expanded `selectedActions` entries, each
containing `initiative` and an optional `districtId`, then projects them to IDs
for the UI. It verifies that the response belongs to the submitted actions.
Invalid responses, including HTTP 400 with `{ valid: false, errors: [...] }`,
remain visible errors and never become a displayed simulation result.

Both district arrays must contain all five districts and ten finite metrics
in the 0–100 range. Backend scores, including negative scores, are not clamped,
recomputed or replaced. District scores and `criticalIssues` come from the server.
KPI cards use `analysisData.criticalIssueCount` and `improvedDistrictCount`.

The backend does not currently expose its aggregate category scores. Instead of
duplicating their formula, the category chart shows the two original metric
values per district for a selectable category. A/B comparison uses the same
projection. The critical chart takes the union of server-marked critical metric
IDs before and after, so resolved issues remain visible. It does not recalculate
the threshold or critical count.

Display catalog data in `catalog.ts` is transcribed exactly from the selected
specification. Cost totals, differences between supplied values and immediate
form validation are frontend concerns. District/city scoring, realized effects,
synergies, critical classification and recommendations remain server concerns.

`POST /analysis` receives the original, unmodified simulation response. Its
camelCase fields (`executiveSummary`, `keyImprovements`, `strategicRecommendations`,
`suggestedNextInvestments`) are validated and projected to presentation fields.
The six analysis sections accept strings/string arrays only. On timeout, HTTP
failure or malformed analysis, the frontend preserves the simulation and shows
only the existing server recommendations. It does not invent investments.

## Integration notes

The root specification on `main` still predates this frontend. The integrator
must promote the selected v2 specification and backend branch together with this
frontend. If installing from the team's root npm workspace, regenerate the root
lockfile after merging the frontend dependencies. The frontend lockfile supports
standalone `npm ci` from this directory.

The OpenAI success response is contract-tested without making paid requests.
The backend's no-key fallback is exercised with its actual server implementation.
