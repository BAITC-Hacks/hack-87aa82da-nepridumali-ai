import { useMemo, useState } from "react";
import districtsData from "../../data/districts.json";
import initiativesData from "../../data/initiatives.json";
import { analyze, simulate } from "./lib/api.js";
import { categoryLabels, formatEffect, metricLabels } from "./lib/format.js";
import { Charts } from "./components/Charts.js";
import { DistrictCard } from "./components/DistrictCard.js";
import { InitiativeCard } from "./components/InitiativeCard.js";
import { KpiCard } from "./components/KpiCard.js";
import type { ActionInput, AiAnalysis, Category, District, DistrictId, Initiative, SimulationResult } from "./types/index.js";
import conflictsData from "../../data/conflicts.json";

const districts = districtsData as District[];
const initiatives = initiativesData as Initiative[];
const conflicts = conflictsData as Array<{ initiativeIds: [string, string]; scope: "global" | "sameDistrict"; message: string }>;

export default function App() {
  const [actions, setActions] = useState<ActionInput[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [sort, setSort] = useState<"cost" | "category" | "lag">("category");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [activeDistrictId, setActiveDistrictId] = useState<DistrictId>("nura");
  const [scenarioA, setScenarioA] = useState<SimulationResult | null>(null);
  const [scenarioB, setScenarioB] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredInitiatives = useMemo(() => {
    return initiatives
      .filter((initiative) => category === "all" || initiative.category === category)
      .filter((initiative) => `${initiative.id} ${initiative.name}`.toLowerCase().includes(query.toLowerCase()))
      .sort((left, right) => {
        if (sort === "cost") return left.cost - right.cost;
        if (sort === "lag") return left.lag - right.lag;
        return left.category.localeCompare(right.category);
      });
  }, [category, query, sort]);

  const usedBudget = actions.reduce((sum, action) => {
    const initiative = initiatives.find((item) => item.id === action.initiativeId);
    return sum + (initiative?.cost ?? 0);
  }, 0);

  const activeDistrict = result?.districtsAfter.find((district) => district.id === activeDistrictId);
  const localErrors = useMemo(() => validateDraft(actions), [actions]);
  const errors = result?.errors.length ? result.errors : localErrors;

  function toggleInitiative(initiative: Initiative) {
    setActions((current) => {
      const exists = current.some((action) => action.initiativeId === initiative.id);
      if (exists) {
        return current.filter((action) => action.initiativeId !== initiative.id);
      }
      return [...current, { initiativeId: initiative.id }];
    });
  }

  function changeDistrict(initiativeId: string, districtId: string) {
    setActions((current) =>
      current.map((action) =>
        action.initiativeId === initiativeId ? { ...action, districtId: districtId as DistrictId } : action
      )
    );
  }

  async function runScenario() {
    setLoading(true);
    setAnalysis(null);
    try {
      const simulation = await simulate(actions);
      setResult(simulation);
      if (simulation.valid) {
        const ai = await analyze(simulation);
        setAnalysis(ai);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-panel text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Urban analytics platform</p>
          <h1 className="mt-2 text-3xl font-semibold">Akim for 5 Hours</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Select five city initiatives, validate the budget and constraints, then compare how the scenario changes district metrics and the Astana Quality of Life Score.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6">
        <section className="grid gap-4 md:grid-cols-5">
          <KpiCard label="Current Score" value={result?.scoreAfter ?? result?.scoreBefore ?? 52.56} detail="Astana Quality of Life Score" />
          <KpiCard label="Budget Used" value={usedBudget} detail="of 100 budget units" />
          <KpiCard label="Budget Remaining" value={100 - usedBudget} detail="unused budget gives no bonus" />
          <KpiCard label="Critical Issues" value={result?.analysisData?.criticalIssueCount ?? 2} detail="metrics below 40" />
          <KpiCard label="Improved Districts" value={result?.analysisData?.improvedDistrictCount ?? 0} detail="after simulation" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <aside className="rounded-lg border border-line bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Initiative Catalog</h2>
              <span className="rounded-md bg-panel px-2 py-1 text-sm">{actions.length}/5</span>
            </div>
            <div className="mt-4 grid gap-3">
              <input
                className="rounded-md border border-line px-3 py-2"
                placeholder="Search initiative"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <select className="rounded-md border border-line px-3 py-2" value={category} onChange={(event) => setCategory(event.target.value as Category | "all")}>
                  <option value="all">All categories</option>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <select className="rounded-md border border-line px-3 py-2" value={sort} onChange={(event) => setSort(event.target.value as "cost" | "category" | "lag")}>
                  <option value="category">Sort by category</option>
                  <option value="cost">Sort by cost</option>
                  <option value="lag">Sort by lag</option>
                </select>
              </div>
            </div>
            <div className="mt-4 grid max-h-[760px] gap-3 overflow-auto pr-1">
              {filteredInitiatives.map((initiative) => (
                <InitiativeCard
                  key={initiative.id}
                  initiative={initiative}
                  districts={districts}
                  selectedAction={actions.find((action) => action.initiativeId === initiative.id)}
                  onToggle={toggleInitiative}
                  onDistrictChange={changeDistrict}
                />
              ))}
            </div>
          </aside>

          <section className="grid gap-6">
            <div className="rounded-lg border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Selected Initiatives</h2>
                  <p className="text-sm text-slate-600">Budget, validation, and simulation controls</p>
                </div>
                <button
                  className="rounded-md bg-teal px-4 py-2 font-semibold text-white disabled:opacity-50"
                  disabled={loading}
                  onClick={runScenario}
                >
                  {loading ? "Running..." : "Run Simulation"}
                </button>
              </div>
              <div className="mt-4 grid gap-2">
                {actions.length === 0 && <p className="text-sm text-slate-600">No initiatives selected.</p>}
                {actions.map((action) => {
                  const initiative = initiatives.find((item) => item.id === action.initiativeId);
                  const district = districts.find((item) => item.id === action.districtId);
                  return initiative ? (
                    <div key={initiative.id} className="flex items-center justify-between rounded-md bg-panel px-3 py-2 text-sm">
                      <span>{initiative.id}. {initiative.name}</span>
                      <span>{initiative.cost} · {district?.name ?? "город"}</span>
                    </div>
                  ) : null;
                })}
              </div>
              {errors.length > 0 && (
                <div className="mt-4 rounded-md border border-amber/40 bg-amber/10 p-3">
                  <h3 className="font-semibold text-amber">Validation errors</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm text-amber">
                    {errors.map((error) => <li key={error}>{error}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {result && (
              <>
                <section className="grid gap-3 md:grid-cols-5">
                  {result.districtsAfter.map((district) => (
                    <DistrictCard
                      key={district.id}
                      district={district}
                      active={district.id === activeDistrictId}
                      onOpen={() => setActiveDistrictId(district.id)}
                    />
                  ))}
                </section>

                <Charts result={result} activeDistrict={activeDistrict} />

                <section className="rounded-lg border border-line bg-white p-4">
                  <h2 className="text-lg font-semibold">District Comparison Table</h2>
                  <div className="mt-4 overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-line text-left">
                          <th className="py-2">District</th>
                          <th>Score</th>
                          {Object.keys(metricLabels).map((metric) => <th key={metric}>{metric}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {result.districtsAfter.map((district) => (
                          <tr key={district.id} className="border-b border-line">
                            <td className="py-2 font-semibold">{district.name}</td>
                            <td>{district.score}</td>
                            {Object.keys(metricLabels).map((metric) => (
                              <td key={metric}>{district.metrics[metric as keyof typeof district.metrics]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-line bg-white p-4">
                    <h2 className="text-lg font-semibold">Deterministic Recommendations</h2>
                    <div className="mt-3 grid gap-3">
                      {result.recommendations.map((recommendation) => (
                        <article key={recommendation.title} className="rounded-md bg-panel p-3">
                          <h3 className="font-semibold">{recommendation.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">{recommendation.rationale}</p>
                          <p className="mt-2 text-xs font-semibold text-teal">{recommendation.initiativeIds.join(", ") || "No fitting initiative"}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-line bg-white p-4">
                    <h2 className="text-lg font-semibold">AI Strategic Analysis</h2>
                    {analysis ? (
                      <div className="mt-3 grid gap-3 text-sm">
                        <p>{analysis.executiveSummary}</p>
                        <List title="Key Improvements" items={analysis.keyImprovements} />
                        <List title="Risks" items={analysis.risks} />
                        <List title="Tradeoffs" items={analysis.tradeoffs} />
                        <List title="Strategic Recommendations" items={analysis.strategicRecommendations} />
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-600">Run a valid simulation to generate analysis.</p>
                    )}
                  </div>
                </section>

                <section className="rounded-lg border border-line bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Scenario Comparison</h2>
                    <div className="flex gap-2">
                      <button className="rounded-md border border-line px-3 py-2 text-sm" onClick={() => setScenarioA(result)}>Save Scenario A</button>
                      <button className="rounded-md border border-line px-3 py-2 text-sm" onClick={() => setScenarioB(result)}>Save Scenario B</button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <ComparisonCard title="Scenario A" scenario={scenarioA} />
                    <ComparisonCard title="Scenario B" scenario={scenarioB} />
                    <div className="rounded-md bg-panel p-3">
                      <div className="text-sm text-slate-500">Score Difference</div>
                      <div className="mt-2 text-2xl font-semibold">
                        {scenarioA?.scoreAfter !== null && scenarioA?.scoreAfter !== undefined && scenarioB?.scoreAfter !== null && scenarioB?.scoreAfter !== undefined
                          ? (scenarioB.scoreAfter - scenarioA.scoreAfter).toFixed(2)
                          : "—"}
                      </div>
                      <div className="mt-2 text-sm text-slate-600">Compare district, category, and budget allocation changes through the charts and selected actions.</div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function validateDraft(actions: ActionInput[]): string[] {
  const errors: string[] = [];
  if (actions.length !== 5) {
    errors.push("Нужно выбрать ровно 5 мероприятий.");
  }
  const usedBudget = actions.reduce((sum, action) => {
    const initiative = initiatives.find((item) => item.id === action.initiativeId);
    return sum + (initiative?.cost ?? 0);
  }, 0);
  if (usedBudget > 100) {
    errors.push(`Бюджет превышен: ${usedBudget} из 100.`);
  }

  const duplicateIds = actions
    .map((action) => action.initiativeId)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  for (const id of [...new Set(duplicateIds)]) {
    errors.push(`Мероприятие ${id} выбрано больше одного раза.`);
  }

  const categoryCounts = new Map<Category, number>();
  for (const action of actions) {
    const initiative = initiatives.find((item) => item.id === action.initiativeId);
    if (!initiative) {
      errors.push(`Мероприятие ${action.initiativeId} не найдено.`);
      continue;
    }
    categoryCounts.set(initiative.category, (categoryCounts.get(initiative.category) ?? 0) + 1);
    if (initiative.scope === "district" && !action.districtId) {
      errors.push(`Для мероприятия ${initiative.id} нужно выбрать район.`);
    }
    if (initiative.scope === "city" && action.districtId) {
      errors.push(`Для городского мероприятия ${initiative.id} район указывать нельзя.`);
    }
  }

  for (const [categoryName, count] of categoryCounts) {
    if (count > 2) {
      errors.push(`В направлении ${categoryName} выбрано больше 2 мероприятий.`);
    }
  }
  if (actions.length > 0 && categoryCounts.size < 3) {
    errors.push("Сценарий должен затрагивать минимум 3 направления.");
  }

  for (const conflict of conflicts) {
    const [firstId, secondId] = conflict.initiativeIds;
    const firstActions = actions.filter((action) => action.initiativeId === firstId);
    const secondActions = actions.filter((action) => action.initiativeId === secondId);
    if (firstActions.length === 0 || secondActions.length === 0) {
      continue;
    }
    if (conflict.scope === "global") {
      errors.push(conflict.message);
    }
    if (conflict.scope === "sameDistrict" && firstActions.some((first) => secondActions.some((second) => first.districtId === second.districtId))) {
      errors.push(conflict.message);
    }
  }

  return [...new Set(errors)];
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-1 list-disc pl-5 text-slate-600">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function ComparisonCard({ title, scenario }: { title: string; scenario: SimulationResult | null }) {
  return (
    <div className="rounded-md bg-panel p-3">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{scenario?.scoreAfter ?? "—"}</div>
      <div className="mt-2 text-sm text-slate-600">Budget: {scenario?.analysisData?.budgetUsed ?? "—"}</div>
    </div>
  );
}
