"use client";

import { useEffect, useRef, useState } from "react";
import BudgetBar, { formatMoney } from "../components/BudgetBar";
import CategoryCard from "../components/CategoryCard";
import ScoreCard, { formatScore } from "../components/ScoreCard";
import ImpactChart from "../components/ImpactChart";
import AnalysisPanel from "../components/AnalysisPanel";
import "./dashboard.css";

// TEMPORARY INTEGRATION BOUNDARY: shared files do not exist yet.
// Replace these type-only declarations with imports from ../types and
// ../types/analysis when the integrator supplies them. Fields match PROJECT_SPEC.
export type Category =
  "transport" | "greening" | "social" | "safety" | "services";
type DistrictId = "altyn" | "saryarka" | "yesil" | "baiterek";
interface District {
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
  district_notes: Array<{ district: string; note: string }>;
}

const categories: ReadonlyArray<{
  id: Category;
  title: string;
  shortTitle: string;
  description: string;
}> = [
  {
    id: "transport",
    title: "Транспорт",
    shortTitle: "Транспорт",
    description: "Как сделать ежедневные поездки удобнее?",
  },
  {
    id: "greening",
    title: "Озеленение",
    shortTitle: "Зелень",
    description: "Больше пространства для прогулок и отдыха.",
  },
  {
    id: "social",
    title: "Социальная инфраструктура",
    shortTitle: "Соцсфера",
    description: "Город, в котором есть место каждому.",
  },
  {
    id: "safety",
    title: "Безопасность",
    shortTitle: "Безопасность",
    description: "Спокойные улицы и внимание к жителям.",
  },
  {
    id: "services",
    title: "Городские сервисы",
    shortTitle: "Сервисы",
    description: "Повседневные вопросы решаются проще.",
  },
];

// UI-only placeholders, not the simulation catalog. No effects or scores are
// fabricated. Replace the entire adapter with the shared catalog, budget,
// simulator and fallback-analysis exports; no other component needs changing.
// Verified simulation-core integration exports:
//   initiatives from ../data/initiatives; districts from ../data/districts;
//   TOTAL_BUDGET_MLN_KZT and simulateScenario from ../lib/simulator.
// Wire simulate as async (ids) => simulateScenario(ids), provide districts,
// remove previewOptions, and set preview:false once those files are integrated.
const previewOptions: Record<
  Category,
  Array<[string, string, number, string, string]>
> = {
  transport: [
    [
      "Удобные остановки",
      "Обновление мест ожидания общественного транспорта.",
      120,
      "Ближайший сезон",
      "Маршрутная сеть остаётся прежней.",
    ],
    [
      "Приоритет автобусам",
      "Выделенные полосы на выбранных городских улицах.",
      220,
      "Поэтапное внедрение",
      "Потребуется перераспределить дорожное пространство.",
    ],
    [
      "Обновление транспорта",
      "Замена части подвижного состава.",
      340,
      "Долгосрочный проект",
      "Высокие первоначальные затраты.",
    ],
  ],
  greening: [
    [
      "Зелёные дворы",
      "Посадки и небольшие зоны отдыха рядом с домом.",
      90,
      "Ближайший сезон",
      "Охват ограничен выбранными дворами.",
    ],
    [
      "Скверы для жителей",
      "Обновление небольших общественных пространств.",
      170,
      "Поэтапное внедрение",
      "Нужен регулярный уход за посадками.",
    ],
    [
      "Большой городской парк",
      "Новое пространство для прогулок и отдыха.",
      290,
      "Долгосрочный проект",
      "Средства сосредоточены на одном объекте.",
    ],
  ],
  social: [
    [
      "Доступная среда",
      "Адаптация входов и маршрутов у социальных объектов.",
      130,
      "Поэтапное внедрение",
      "Вместимость учреждений не увеличивается.",
    ],
    [
      "Центры соседства",
      "Общественные помещения для занятий и встреч.",
      230,
      "Поэтапное внедрение",
      "Потребуется постоянная программа мероприятий.",
    ],
    [
      "Новый социальный центр",
      "Многофункциональное пространство для жителей.",
      360,
      "Долгосрочный проект",
      "Строительство требует времени и ресурсов.",
    ],
  ],
  safety: [
    [
      "Светлые маршруты",
      "Освещение пешеходных путей и переходов.",
      100,
      "Ближайший сезон",
      "Охват ограничен выбранными маршрутами.",
    ],
    [
      "Безопасные переходы",
      "Обновление пешеходных переходов и подходов к ним.",
      180,
      "Поэтапное внедрение",
      "Во время работ возможны временные ограничения.",
    ],
    [
      "Комплексная безопасность",
      "Обновление общественных пространств и инфраструктуры безопасности.",
      280,
      "Долгосрочный проект",
      "Нужна координация нескольких городских служб.",
    ],
  ],
  services: [
    [
      "Обращения жителей",
      "Удобный канал обратной связи с городскими службами.",
      70,
      "Ближайший сезон",
      "Результат зависит от скорости реакции служб.",
    ],
    [
      "Сервисы рядом",
      "Обновление точек обслуживания жителей.",
      150,
      "Поэтапное внедрение",
      "Потребуется обучение сотрудников.",
    ],
    [
      "Единое окно города",
      "Объединение повседневных городских услуг.",
      250,
      "Долгосрочный проект",
      "Интеграция процессов займёт время.",
    ],
  ],
};

interface DashboardAdapter {
  preview: boolean;
  totalBudgetMlnKzt: number;
  initiatives: Initiative[];
  districts: District[];
  simulate: (selectedIds: string[]) => Promise<ScenarioResult>;
  analyze: (result: ScenarioResult, signal: AbortSignal) => Promise<AiAnalysis>;
  fallback: (result: ScenarioResult) => AiAnalysis;
}

function isAiAnalysis(value: unknown): value is AiAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Record<string, unknown>;
  const stringArray = (items: unknown): items is string[] =>
    Array.isArray(items) && items.every((item) => typeof item === "string");
  return (
    (analysis.source === "openai" || analysis.source === "fallback") &&
    typeof analysis.executive_summary === "string" &&
    stringArray(analysis.strengths) &&
    stringArray(analysis.risks) &&
    stringArray(analysis.tradeoffs) &&
    Array.isArray(analysis.recommendations) &&
    analysis.recommendations.every((item: unknown) => {
      if (!item || typeof item !== "object") return false;
      const recommendation = item as Record<string, unknown>;
      return (
        ["high", "medium", "low"].includes(String(recommendation.priority)) &&
        typeof recommendation.action === "string" &&
        typeof recommendation.rationale === "string"
      );
    }) &&
    Array.isArray(analysis.district_notes) &&
    analysis.district_notes.every((item: unknown) => {
      if (!item || typeof item !== "object") return false;
      const note = item as Record<string, unknown>;
      return typeof note.district === "string" && typeof note.note === "string";
    })
  );
}

const adapter: DashboardAdapter = {
  preview: true,
  totalBudgetMlnKzt: 1000,
  initiatives: categories.flatMap(({ id }) =>
    previewOptions[id].map(
      ([titleRu, descriptionRu, costMlnKzt, horizonRu, tradeoffRu], index) => ({
        id: `preview-${id}-${index + 1}`,
        category: id,
        titleRu,
        descriptionRu,
        costMlnKzt,
        horizonRu,
        tradeoffRu,
        effects: {},
      }),
    ),
  ),
  districts: [],
  simulate: async () => {
    throw new Error(
      "Симулятор ещё не подключён. Ваш выбор сохранён; расчёт AQoLS станет доступен после подключения модуля команды.",
    );
  },
  analyze: async (result, signal) => {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
      signal,
    });
    if (!response.ok) throw new Error("Analysis request failed");
    const analysis: unknown = await response.json();
    if (!isAiAnalysis(analysis)) throw new Error("Invalid analysis response");
    return analysis;
  },
  fallback: (result) => ({
    source: "fallback",
    executive_summary:
      "Резервный разбор выбранных решений. Сопоставьте изменения категорий и районов с затратами и сроками инициатив.",
    strengths: [
      "Сценарий охватывает все направления и прошёл проверку симулятора.",
    ],
    risks: [
      "Синтетическая модель не учитывает все условия реализации городских проектов.",
    ],
    tradeoffs: result.selectedInitiatives.map(
      (initiative) => `${initiative.titleRu}: ${initiative.tradeoffRu}`,
    ),
    recommendations: result.selectedInitiatives.map((initiative) => ({
      priority: "medium",
      action: `Проверьте условия реализации: «${initiative.titleRu}»`,
      rationale: `Горизонт: ${initiative.horizonRu}. ${initiative.tradeoffRu}`,
    })),
    district_notes: result.districtResults.map((district) => ({
      district: district.nameRu,
      note: "Сопоставьте показатели района с исходными значениями в таблице результатов.",
    })),
  }),
};

export default function Home() {
  const [selection, setSelection] = useState<Partial<Record<Category, string>>>(
    {},
  );
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const analysisController = useRef<AbortController | null>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const selected = categories.flatMap(({ id }) =>
    adapter.initiatives.filter(
      (initiative) =>
        initiative.category === id && initiative.id === selection[id],
    ),
  );
  const spent = selected.reduce(
    (sum, initiative) => sum + initiative.costMlnKzt,
    0,
  );
  const valid =
    selected.length === categories.length && spent <= adapter.totalBudgetMlnKzt;

  useEffect(
    () => () => {
      requestVersion.current += 1;
      analysisController.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (result) resultsHeading.current?.focus();
  }, [result]);

  function clearResults() {
    requestVersion.current += 1;
    analysisController.current?.abort();
    setResult(null);
    setAnalysis(null);
    setError(null);
    setAnalysisError(null);
    setCalculating(false);
    setAnalyzing(false);
  }

  function selectInitiative(initiative: Initiative) {
    const currentCost =
      selected.find((item) => item.category === initiative.category)
        ?.costMlnKzt ?? 0;
    if (
      spent - currentCost + initiative.costMlnKzt >
      adapter.totalBudgetMlnKzt
    ) {
      setError(
        "Для этого решения недостаточно бюджета. Измените выбор в других категориях.",
      );
      return;
    }
    clearResults();
    setSelection((previous) => ({
      ...previous,
      [initiative.category]: initiative.id,
    }));
  }

  async function requestAnalysis(scenario: ScenarioResult, version: number) {
    analysisController.current?.abort();
    const controller = new AbortController();
    analysisController.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const nextAnalysis = await adapter.analyze(scenario, controller.signal);
      if (requestVersion.current === version) setAnalysis(nextAnalysis);
    } catch {
      if (requestVersion.current === version) {
        setAnalysis(adapter.fallback(scenario));
        setAnalysisError(
          "AI-анализ сейчас недоступен. Результаты расчёта сохранены, показан резервный разбор.",
        );
      }
    } finally {
      clearTimeout(timeout);
      if (requestVersion.current === version) setAnalyzing(false);
    }
  }

  async function calculate() {
    if (!valid || calculating) return;
    const version = ++requestVersion.current;
    analysisController.current?.abort();
    setCalculating(true);
    setError(null);
    setResult(null);
    setAnalysis(null);
    setAnalysisError(null);
    try {
      const scenario = await adapter.simulate(
        selected.map((initiative) => initiative.id),
      );
      if (version !== requestVersion.current) return;
      if (!scenario.isValid)
        throw new Error(
          scenario.errors.join(" ") ||
            "Симулятор отклонил сценарий. Проверьте выбранные решения.",
        );
      setResult(scenario);
      void requestAnalysis(scenario, version);
    } catch (cause) {
      if (version === requestVersion.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Не удалось рассчитать сценарий. Попробуйте ещё раз.",
        );
    } finally {
      if (version === requestVersion.current) setCalculating(false);
    }
  }

  return (
    <div className="aqm-dashboard" lang="ru">
      <a className="skip-link" href="#decisions">
        Перейти к решениям
      </a>
      <header className="site-header">
        <a className="brand" href="#">
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <span>
            AQM <strong>Impact Lab</strong>
          </span>
        </a>
        <span className="header-caption">Лаборатория городских решений</span>
        <span className="simulation-badge">
          <i />
          Симуляция
        </span>
      </header>
      <main className="dashboard-main">
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">Астана · городской эксперимент</div>
            <h1>
              Аким на <span>5 часов.</span>
              <br />
              Каким будет ваш город?
            </h1>
            <p>
              Один бюджет. Пять решений. Распределите ресурсы и узнайте, как ваш
              выбор повлияет на качество жизни.
            </p>
            <div className="hero-tags">
              <span>01 Выберите инициативы</span>
              <span>02 Сравните результат</span>
              <span>03 Изучите анализ</span>
            </div>
          </div>
          <div className="city-art" aria-hidden="true">
            <span className="city-orbit" />
            <span className="city-sun" />
            <span className="building building-one" />
            <span className="building building-two" />
            <span className="city-tower" />
            <span className="building building-three" />
            <span className="building building-four" />
            <span className="city-ground" />
            <span className="city-art-caption">
              Будущее начинается с решений
            </span>
          </div>
        </section>
        <div className="data-disclaimer">
          <span aria-hidden="true">ⓘ</span>
          <p>
            Учебная модель: все данные, районы и суммы синтетические и не
            отражают реальную статистику или бюджет Астаны.
          </p>
        </div>
        {adapter.preview && (
          <p className="notice preview-notice">
            Предпросмотр интерфейса: каталог инициатив временный. Расчёт индекса
            ожидает подключения симулятора.
          </p>
        )}
        <div className="workspace-grid">
          <section id="decisions" aria-labelledby="decisions-title">
            <div className="section-heading decisions-heading">
              <div>
                <span className="eyebrow">Шаг 1 · Ваши приоритеты</span>
                <h2 id="decisions-title">Пять решений для города</h2>
              </div>
              <button
                type="button"
                className="text-button"
                disabled={!selected.length}
                onClick={() => {
                  clearResults();
                  setSelection({});
                }}
              >
                Сбросить выбор
              </button>
            </div>
            <p className="muted">
              Выберите по одной инициативе в каждой категории. Решения можно
              менять.
            </p>
            <div className="categories">
              {categories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category.id}
                  title={category.title}
                  description={category.description}
                  index={index}
                  initiatives={adapter.initiatives.filter(
                    (initiative) => initiative.category === category.id,
                  )}
                  selectedId={selection[category.id]}
                  availableBudget={
                    adapter.totalBudgetMlnKzt -
                    spent +
                    (selected.find(
                      (initiative) => initiative.category === category.id,
                    )?.costMlnKzt ?? 0)
                  }
                  onSelect={selectInitiative}
                />
              ))}
            </div>
          </section>
          <aside className="scenario-sidebar" aria-label="Ваш сценарий">
            <div className="sidebar-sticky">
              <BudgetBar
                total={adapter.totalBudgetMlnKzt}
                spent={spent}
                selectedCount={selected.length}
              />
              <section className="selection-panel">
                <h3>Ваши решения</h3>
                <ol>
                  {categories.map((category) => {
                    const initiative = selected.find(
                      (item) => item.category === category.id,
                    );
                    return (
                      <li key={category.id}>
                        <span
                          className={`decision-check ${initiative ? "checked" : ""}`}
                          aria-hidden="true"
                        >
                          {initiative ? "✓" : "·"}
                        </span>
                        <div>
                          <span>{category.title}</span>
                          <strong>
                            {initiative?.titleRu ?? "Ещё не выбрано"}
                          </strong>
                        </div>
                        {initiative && (
                          <span className="decision-price">
                            {formatMoney(initiative.costMlnKzt)}
                            <small>млн ₸</small>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
                <button
                  type="button"
                  className="calculate-button"
                  onClick={() => void calculate()}
                  disabled={!valid || calculating}
                  aria-describedby="calculate-help"
                >
                  {calculating ? (
                    <>
                      <span className="spinner" />
                      Рассчитываем…
                    </>
                  ) : (
                    <>
                      Рассчитать влияние <span aria-hidden="true">↗</span>
                    </>
                  )}
                </button>
                <p
                  id="calculate-help"
                  className="calculate-help"
                  aria-live="polite"
                >
                  {valid
                    ? "Всё готово: оцените эффект ваших решений"
                    : `Выберите инициативы во всех категориях (${selected.length} из 5)`}
                </p>
                {error && (
                  <p className="notice error" role="alert">
                    {error}
                  </p>
                )}
              </section>
              <p className="sidebar-note">
                Индекс рассчитывается по фиксированной модели.
                <br />
                AI помогает объяснить результат.
              </p>
            </div>
          </aside>
        </div>
        <section
          className="results-section"
          aria-labelledby="results-title"
          aria-busy={calculating}
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">Шаг 2 · Эффект решений</span>
              <h2 id="results-title" ref={resultsHeading} tabIndex={-1}>
                Ваш город после изменений
              </h2>
            </div>
            {result && <span className="pill">Сценарий рассчитан</span>}
          </div>
          {calculating ? (
            <div className="empty-results" role="status">
              <span className="spinner" />
              <h3>Рассчитываем влияние решений</h3>
              <p>Подготавливаем показатели категорий и районов.</p>
            </div>
          ) : !result ? (
            <div className="empty-results">
              <span className="empty-icon" aria-hidden="true">
                ↗
              </span>
              <h3>У каждого решения есть эффект</h3>
              <p>
                Выберите пять инициатив и рассчитайте сценарий.
                <br />
                Здесь появятся индекс качества жизни, изменения по районам и
                разбор ваших решений.
              </p>
              <span className="pill">AQoLS · 0–100</span>
            </div>
          ) : (
            <>
              <div className="results-grid">
                <ScoreCard result={result} />
                <section className="surface result-budget">
                  <span className="eyebrow">Итоговый бюджет</span>
                  <h3>Ресурсы распределены</h3>
                  <dl>
                    <div>
                      <dt>Бюджет</dt>
                      <dd>{formatMoney(result.totalBudgetMlnKzt)} млн ₸</dd>
                    </div>
                    <div>
                      <dt>Потрачено</dt>
                      <dd>{formatMoney(result.spentMlnKzt)} млн ₸</dd>
                    </div>
                    <div>
                      <dt>Осталось</dt>
                      <dd>{formatMoney(result.remainingMlnKzt)} млн ₸</dd>
                    </div>
                  </dl>
                </section>
              </div>
              <ImpactChart result={result} categories={categories} />
              <section className="surface district-panel">
                <span className="eyebrow">Локальный эффект</span>
                <h3>Изменения по районам</h3>
                <p className="muted">
                  В каждой ячейке: до → после. Шкала от 0 до 100.
                </p>
                <div className="table-scroll">
                  <table>
                    <caption className="sr-only">
                      Показатели районов до и после решений
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Район</th>
                        {categories.map((category) => (
                          <th key={category.id} scope="col">
                            {category.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.districtResults.map((district) => (
                        <tr key={district.id}>
                          <th scope="row">{district.nameRu}</th>
                          {categories.map(({ id }) => {
                            const before = adapter.districts.find(
                              (item) => item.id === district.id,
                            )?.indicators[id];
                            return (
                              <td key={id}>
                                {before === undefined
                                  ? "—"
                                  : formatScore(before)}{" "}
                                <span aria-hidden="true">→</span>
                                <span className="sr-only">после</span>{" "}
                                <strong>
                                  {formatScore(district.indicators[id])}
                                </strong>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!adapter.districts.length && (
                  <p className="muted">
                    Исходные показатели районов пока не подключены.
                  </p>
                )}
              </section>
              <section className="surface">
                <h3>Решения в рассчитанном сценарии</h3>
                <div className="result-decisions">
                  {result.selectedInitiatives.map((initiative) => (
                    <div key={initiative.id}>
                      <span className="eyebrow">
                        {
                          categories.find(
                            (category) => category.id === initiative.category,
                          )?.title
                        }
                      </span>
                      <h4>{initiative.titleRu}</h4>
                      <p>
                        {formatMoney(initiative.costMlnKzt)} млн ₸ ·{" "}
                        {initiative.horizonRu}
                      </p>
                      <p className="muted">{initiative.tradeoffRu}</p>
                    </div>
                  ))}
                </div>
              </section>
              <AnalysisPanel
                analysis={analysis}
                loading={analyzing}
                error={analysisError}
                onRetry={() => {
                  if (!analyzing)
                    void requestAnalysis(result, requestVersion.current);
                }}
              />
            </>
          )}
        </section>
      </main>
      <footer className="site-footer">
        <span>
          AQM Impact Lab <span className="muted">/ Аким на 5 часов</span>
        </span>
        <span>HackAlemAI · Синтетические данные</span>
      </footer>
    </div>
  );
}
