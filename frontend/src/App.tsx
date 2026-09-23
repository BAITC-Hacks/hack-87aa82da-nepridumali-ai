import { useEffect, useRef, useState } from "react";
import BudgetBar from "./components/BudgetBar";
import CategoryCard from "./components/CategoryCard";
import ScoreCard from "./components/ScoreCard";
import ImpactChart, { DistrictDetail } from "./components/ImpactChart";
import AnalysisPanel from "./components/AnalysisPanel";
import ScenarioComparison from "./components/ScenarioComparison";
import {
  analyticNumber,
  analyze,
  ApiError,
  fallbackAnalysis,
  simulate,
} from "./lib/api";
import {
  BASELINE_SCORE,
  categories,
  districts,
  formatNumber,
  HORIZON_QUARTERS,
  initiativeById,
  initiatives,
  signed,
  spentBudget,
  TOTAL_BUDGET,
} from "./lib/catalog";
import { validateActions } from "./lib/validation";
import type {
  Action,
  Analysis,
  Category,
  DistrictId,
  SavedScenario,
  SimulationResult,
} from "./types";

type View = "plan" | "results" | "compare";

export default function App() {
  const [actions, setActions] = useState<Action[]>([]);
  const [districtChoices, setDistrictChoices] = useState<
    Partial<Record<string, DistrictId | "">>
  >({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [scope, setScope] = useState("all");
  const [sort, setSort] = useState("catalog");
  const [view, setView] = useState<View>("plan");
  const [focusedDistrict, setFocusedDistrict] = useState<DistrictId>("nura");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [scenarioA, setScenarioA] = useState<SavedScenario | null>(null);
  const [scenarioB, setScenarioB] = useState<SavedScenario | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const generation = useRef(0);
  const simulationController = useRef<AbortController | null>(null);
  const analysisController = useRef<AbortController | null>(null);
  const viewHeading = useRef<HTMLHeadingElement>(null);
  const previousView = useRef(view);
  const spent = spentBudget(actions);
  const issues = validateActions(actions);
  const valid = issues.length === 0;
  const filtered = initiatives
    .filter((initiative) => {
      const searchable =
        `${initiative.id} ${initiative.name} ${categories.find((item) => item.id === initiative.category)?.name}`.toLocaleLowerCase(
          "ru",
        );
      return (
        (category === "all" || category === initiative.category) &&
        (scope === "all" || initiative.scope === scope) &&
        searchable.includes(query.trim().toLocaleLowerCase("ru"))
      );
    })
    .sort((left, right) =>
      sort === "cost-asc"
        ? left.cost - right.cost
        : sort === "cost-desc"
          ? right.cost - left.cost
          : sort === "lag"
            ? left.lag - right.lag
            : Number(left.id.slice(1)) - Number(right.id.slice(1)),
    );

  useEffect(
    () => () => {
      generation.current += 1;
      simulationController.current?.abort();
      analysisController.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (previousView.current !== view) viewHeading.current?.focus();
    previousView.current = view;
  }, [view]);

  function changeActions(next: Action[]) {
    generation.current += 1;
    simulationController.current?.abort();
    analysisController.current?.abort();
    simulationController.current = null;
    analysisController.current = null;
    setActions(next);
    setResult(null);
    setAnalysis(null);
    setErrors([]);
    setAnalysisError(null);
    setLoading(false);
    setAnalyzing(false);
    setAnnouncement("");
  }

  function addAction(initiativeId: string) {
    const initiative = initiativeById.get(initiativeId);
    if (
      !initiative ||
      actions.length >= 5 ||
      actions.some((action) => action.initiativeId === initiativeId)
    )
      return;
    const districtId = districtChoices[initiativeId];
    if (initiative.scope === "district" && !districtId) return;
    changeActions([
      ...actions,
      initiative.scope === "district"
        ? { initiativeId, districtId: districtId as DistrictId }
        : { initiativeId },
    ]);
  }

  async function requestAnalysis(scenario: SimulationResult, version: number) {
    analysisController.current?.abort();
    const controller = new AbortController();
    analysisController.current = controller;
    const isCurrent = () =>
      generation.current === version &&
      analysisController.current === controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await analyze(scenario, controller.signal);
      if (isCurrent()) setAnalysis(response);
    } catch {
      if (isCurrent()) {
        setAnalysis(fallbackAnalysis(scenario));
        setAnalysisError(
          "AI-анализ сейчас недоступен. Показаны сохранённые результаты и рекомендации симулятора.",
        );
      }
    } finally {
      clearTimeout(timeout);
      if (isCurrent()) setAnalyzing(false);
    }
  }

  async function runSimulation() {
    if (!valid || simulationController.current) return;
    const version = ++generation.current;
    const controller = new AbortController();
    simulationController.current = controller;
    analysisController.current?.abort();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const submitted = structuredClone(actions);
    setLoading(true);
    setResult(null);
    setAnalysis(null);
    setErrors([]);
    setAnalysisError(null);
    setAnalyzing(false);
    try {
      const response = await simulate(submitted, controller.signal);
      if (version !== generation.current) return;
      setResult(response);
      setView("results");
      setAnnouncement("Сценарий рассчитан. Результаты доступны.");
      void requestAnalysis(response, version);
    } catch (error) {
      if (version === generation.current)
        setErrors(
          controller.signal.aborted
            ? [
                "Сервер не ответил за 20 секунд. Решения сохранены — попробуйте ещё раз.",
              ]
            : error instanceof ApiError
              ? [error.message, ...error.issues]
              : ["Не удалось выполнить симуляцию. Попробуйте ещё раз."],
        );
    } finally {
      clearTimeout(timeout);
      if (version === generation.current) {
        simulationController.current = null;
        setLoading(false);
      }
    }
  }

  function saveScenario(name: "A" | "B") {
    if (!result) return;
    const snapshot: SavedScenario = structuredClone({ result, actions, name });
    if (name === "A") setScenarioA(snapshot);
    else setScenarioB(snapshot);
    setAnnouncement(
      `Сценарий ${name} сохранён${(name === "A" && scenarioA) || (name === "B" && scenarioB) ? " заново" : ""}.`,
    );
  }

  function restoreScenario(scenario: SavedScenario) {
    changeActions(structuredClone(scenario.actions));
    setDistrictChoices(
      Object.fromEntries(
        scenario.actions
          .filter((action) => action.districtId)
          .map((action) => [action.initiativeId, action.districtId!]),
      ),
    );
    setView("plan");
    setAnnouncement(
      `Решения сценария ${scenario.name} восстановлены. Для новых результатов запустите симуляцию.`,
    );
  }

  const beforeDistrict =
    result?.districtsBefore.find(
      (district) => district.id === focusedDistrict,
    ) ?? districts.find((district) => district.id === focusedDistrict)!;
  const afterDistrict = result?.districtsAfter.find(
    (district) => district.id === focusedDistrict,
  );
  const criticalCount = analyticNumber(result, "criticalIssueCount");
  const improvedCount = analyticNumber(result, "improvedDistrictCount");
  const heading =
    view === "plan"
      ? "Пять решений. Один город."
      : view === "results"
        ? "Результат ваших решений"
        : "Сравнение сценариев";

  return (
    <div className="app-shell">
      <a href="#workspace" className="skip-link">
        Перейти к рабочей области
      </a>
      <header className="site-header">
        <a className="brand" href="#">
          <span className="brand-mark">A</span>
          <span>
            Akim <strong>for 5 Hours</strong>
          </span>
        </a>
        <span className="header-subtitle">Лаборатория городских решений</span>
        <span className="live-badge">
          <i />
          Синтетическая модель
        </span>
      </header>
      <main>
        <section className="hero">
          <div>
            <span className="eyebrow">Астана · стратегический симулятор</span>
            <h1>
              Akim for <span>5 Hours</span>
            </h1>
            <p>
              Каким будет ваш город? Распределите бюджет между пятью решениями и
              сравните их влияние на жизнь районов.
            </p>
            <div className="hero-chips">
              <span>5 районов</span>
              <span>14 инициатив</span>
              <span>{HORIZON_QUARTERS} кварталов</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="sun" />
            <span className="building one" />
            <span className="building two" />
            <span className="tower" />
            <span className="building three" />
            <span className="building four" />
            <span className="ground" />
            <span className="art-caption">Будущее складывается из решений</span>
          </div>
        </section>
        <p className="data-notice">
          ⓘ Все районы, показатели и бюджет в модели синтетические. Они не
          отражают реальную статистику Астаны.
        </p>
        <section className="kpi-grid" aria-label="Основные показатели">
          <article>
            <span>Индекс качества жизни</span>
            <strong>
              {formatNumber(result?.scoreAfter ?? BASELINE_SCORE)}
            </strong>
            <small>
              {result
                ? `До: ${formatNumber(result.scoreBefore)} · ${signed(result.delta)}`
                : "Исходный AQoLS по спецификации"}
            </small>
          </article>
          <article>
            <span>Бюджет использован</span>
            <strong>
              {spent}
              <small> / {TOTAL_BUDGET}</small>
            </strong>
            <small>Фиксированный виртуальный бюджет</small>
          </article>
          <article>
            <span>Бюджет остался</span>
            <strong className={spent > TOTAL_BUDGET ? "negative" : "positive"}>
              {TOTAL_BUDGET - spent}
            </strong>
            <small>{actions.length} из 5 решений выбрано</small>
          </article>
          <article>
            <span>Критические показатели</span>
            <strong>
              {criticalCount === null ? "—" : formatNumber(criticalCount)}
            </strong>
            <small>
              {criticalCount === null
                ? "Ожидаем показатель от сервера"
                : "По результатам симуляции"}
            </small>
          </article>
          <article>
            <span>Улучшенных районов</span>
            <strong>
              {improvedCount === null ? "—" : formatNumber(improvedCount)}
            </strong>
            <small>
              {improvedCount === null
                ? "Ожидаем показатель от сервера"
                : "Из пяти районов города"}
            </small>
          </article>
        </section>
        <nav className="view-nav" aria-label="Разделы симулятора">
          {(
            [
              { id: "plan", label: "01  Решения" },
              { id: "results", label: "02  Аналитика" },
              { id: "compare", label: "03  Сравнение A / B" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => setView(item.id)}
            >
              {item.label}
              {item.id === "compare" && (scenarioA || scenarioB) && (
                <span className="nav-count">
                  {Number(!!scenarioA) + Number(!!scenarioB)}
                </span>
              )}
            </button>
          ))}
        </nav>
        <section id="workspace" className="workspace">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {view === "plan"
                  ? "Ваши приоритеты"
                  : view === "results"
                    ? "Эффект на горизонте 8 кварталов"
                    : "Два подхода к развитию"}
              </span>
              <h2 ref={viewHeading} tabIndex={-1}>
                {heading}
              </h2>
            </div>
            {view === "plan" && (
              <button
                type="button"
                className="text-button"
                disabled={!actions.length}
                onClick={() => changeActions([])}
              >
                Сбросить решения
              </button>
            )}
          </div>
          <p className="sr-only" role="status">
            {announcement}
          </p>
          {view === "plan" && (
            <>
              <div className="planning-grid">
                <div className="catalog-column">
                  <p className="section-intro">
                    Выберите ровно 5 инициатив минимум из 3 категорий. Не больше
                    2 решений в одной категории.
                  </p>
                  <div className="filters">
                    <label className="search-field">
                      <span className="sr-only">Поиск инициатив</span>
                      <span aria-hidden="true">⌕</span>
                      <input
                        type="search"
                        placeholder="Название, категория или M1…"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </label>
                    <label className="field-label">
                      Охват
                      <select
                        aria-label="Охват"
                        value={scope}
                        onChange={(event) => setScope(event.target.value)}
                      >
                        <option value="all">Все инициативы</option>
                        <option value="city">Весь город</option>
                        <option value="district">Один район</option>
                      </select>
                    </label>
                    <label className="field-label">
                      Сортировка
                      <select
                        aria-label="Сортировка"
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                      >
                        <option value="catalog">По каталогу</option>
                        <option value="cost-asc">Сначала дешевле</option>
                        <option value="cost-desc">Сначала дороже</option>
                        <option value="lag">По сроку эффекта</option>
                      </select>
                    </label>
                  </div>
                  <div className="category-filters" aria-label="Категории">
                    <button
                      type="button"
                      aria-pressed={category === "all"}
                      onClick={() => setCategory("all")}
                    >
                      Все <span>14</span>
                    </button>
                    {categories.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={category === item.id}
                        onClick={() => setCategory(item.id)}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                  <div className="catalog-count" role="status">
                    Найдено инициатив: {filtered.length}
                  </div>
                  <div className="catalog-grid">
                    {filtered.map((initiative) => (
                      <CategoryCard
                        key={initiative.id}
                        initiative={initiative}
                        selected={actions.some(
                          (action) => action.initiativeId === initiative.id,
                        )}
                        full={actions.length >= 5}
                        districtId={districtChoices[initiative.id] ?? ""}
                        onDistrict={(id) =>
                          setDistrictChoices((previous) => ({
                            ...previous,
                            [initiative.id]: id,
                          }))
                        }
                        onAdd={() => addAction(initiative.id)}
                      />
                    ))}
                  </div>
                  {!filtered.length && (
                    <div className="empty-state">
                      <h3>Ничего не найдено</h3>
                      <p>Попробуйте другое название или снимите фильтры.</p>
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setCategory("all");
                          setScope("all");
                        }}
                      >
                        Сбросить фильтры
                      </button>
                    </div>
                  )}
                </div>
                <aside
                  className="selection-sidebar"
                  aria-label="Выбранные решения"
                >
                  <div className="sticky-panel">
                    <BudgetBar spent={spent} count={actions.length} />
                    <section className="selection-box">
                      <h3>
                        Ваш сценарий <span>{actions.length} / 5</span>
                      </h3>
                      {actions.length ? (
                        <ol className="selected-list">
                          {actions.map((action) => {
                            const initiative = initiativeById.get(
                              action.initiativeId,
                            )!;
                            return (
                              <li key={action.initiativeId}>
                                <div className="selected-item-title">
                                  <span className="mini-id">
                                    {initiative.id}
                                  </span>
                                  <strong>{initiative.name}</strong>
                                  <button
                                    type="button"
                                    className="remove-button"
                                    aria-label={`Удалить ${initiative.id}`}
                                    onClick={() =>
                                      changeActions(
                                        actions.filter(
                                          (item) =>
                                            item.initiativeId !==
                                            action.initiativeId,
                                        ),
                                      )
                                    }
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="selected-item-meta">
                                  <span>{initiative.cost} из бюджета</span>
                                  {initiative.scope === "district" ? (
                                    <label>
                                      <span className="sr-only">
                                        Район выбранной инициативы{" "}
                                        {initiative.id}
                                      </span>
                                      <select
                                        aria-label={`Район выбранной инициативы ${initiative.id}`}
                                        value={action.districtId ?? ""}
                                        onChange={(event) => {
                                          const id = event.target
                                            .value as DistrictId;
                                          changeActions(
                                            actions.map((item) =>
                                              item.initiativeId ===
                                              action.initiativeId
                                                ? { ...item, districtId: id }
                                                : item,
                                            ),
                                          );
                                          setDistrictChoices((previous) => ({
                                            ...previous,
                                            [initiative.id]: id,
                                          }));
                                        }}
                                      >
                                        {districts.map((district) => (
                                          <option
                                            key={district.id}
                                            value={district.id}
                                          >
                                            {district.name}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  ) : (
                                    <span>Весь город</span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      ) : (
                        <p className="selection-empty">
                          Добавьте инициативы из каталога. Для районных проектов
                          сначала выберите район.
                        </p>
                      )}
                      <div className="validation-box" aria-live="polite">
                        {issues.length ? (
                          <ul>
                            {issues.map((issue) => (
                              <li key={issue}>{issue}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="positive">✓ Сценарий готов к расчёту</p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="button primary run-button"
                        disabled={!valid || loading}
                        onClick={() => void runSimulation()}
                      >
                        {loading ? (
                          <>
                            <span className="spinner" />
                            Рассчитываем…
                          </>
                        ) : (
                          <>
                            Запустить симуляцию{" "}
                            <span aria-hidden="true">↗</span>
                          </>
                        )}
                      </button>
                      {errors.length > 0 && (
                        <div className="notice error" role="alert">
                          <strong>Не удалось рассчитать сценарий</strong>
                          <ul>
                            {errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="helper">
                        Симуляция считает показатели.
                        <br />
                        AI помогает понять результат.
                      </p>
                    </section>
                    <section className="rules-note">
                      <h4>Связи между решениями</h4>
                      <p>M1 + M2, M10 + M12 и M5 + M6 дают синергии.</p>
                      <p>
                        M1 и M3 несовместимы. M4 + M7 и M5 + M13 нельзя выбрать
                        в одном районе.
                      </p>
                    </section>
                  </div>
                </aside>
              </div>
              <section className="districts-section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Отправная точка</span>
                    <h2>Пять районов — разные потребности</h2>
                  </div>
                </div>
                <div className="district-cards">
                  {districts.map((district) => (
                    <button
                      type="button"
                      key={district.id}
                      className={`district-card ${focusedDistrict === district.id ? "active" : ""}`}
                      aria-pressed={focusedDistrict === district.id}
                      onClick={() => setFocusedDistrict(district.id)}
                    >
                      <span className="row">
                        <strong>{district.name}</strong>
                        <span>↗</span>
                      </span>
                      <span>
                        {formatNumber(district.populationShare * 100)}%
                        населения модели
                      </span>
                      <span className="district-preview">
                        T1 <b>{district.metrics.T1}</b> · E1{" "}
                        <b>{district.metrics.E1}</b> · S1{" "}
                        <b>{district.metrics.S1}</b>
                      </span>
                    </button>
                  ))}
                </div>
                <DistrictDetail
                  before={districts.find(
                    (district) => district.id === focusedDistrict,
                  )!}
                />
              </section>
            </>
          )}
          {view === "results" &&
            (result ? (
              <>
                <div className="result-top">
                  <ScoreCard result={result} />
                  <section className="panel save-panel">
                    <span className="eyebrow">Сохраните подход</span>
                    <h3>Какой сценарий лучше?</h3>
                    <p>
                      Сохраните результат, измените решения и сравните два
                      варианта.
                    </p>
                    <div className="save-buttons">
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => saveScenario("A")}
                      >
                        {scenarioA ? "Перезаписать A" : "Сохранить A"}
                      </button>
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => saveScenario("B")}
                      >
                        {scenarioB ? "Перезаписать B" : "Сохранить B"}
                      </button>
                    </div>
                    <p className="helper">
                      Сценарии хранятся в этой вкладке до обновления страницы.
                    </p>
                  </section>
                </div>
                <ImpactChart result={result} actions={actions} />
                <section className="panel">
                  <div className="row">
                    <h3>Рейтинг районов</h3>
                    <span className="tag">После решений</span>
                  </div>
                  <div
                    className="table-scroll"
                    tabIndex={0}
                    role="region"
                    aria-label="Таблица рейтинга районов"
                  >
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Место</th>
                          <th scope="col">Район</th>
                          <th scope="col">До</th>
                          <th scope="col">После</th>
                          <th scope="col">Изменение</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...result.districtsAfter]
                          .sort(
                            (a, b) =>
                              (b.score ?? -Infinity) - (a.score ?? -Infinity),
                          )
                          .map((district, index) => {
                            const before = result.districtsBefore.find(
                              (item) => item.id === district.id,
                            );
                            return (
                              <tr key={district.id}>
                                <td>
                                  {district.score === undefined
                                    ? "—"
                                    : index + 1}
                                </td>
                                <th scope="row">{district.name}</th>
                                <td>
                                  {before?.score === undefined
                                    ? "Нет в ответе"
                                    : formatNumber(before.score)}
                                </td>
                                <td>
                                  {district.score === undefined
                                    ? "Нет в ответе"
                                    : formatNumber(district.score)}
                                </td>
                                <td>
                                  {district.score !== undefined &&
                                  before?.score !== undefined
                                    ? signed(district.score - before.score)
                                    : "—"}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </section>
                <section className="districts-section">
                  <label className="field-label district-selector">
                    Подробный разбор района
                    <select
                      aria-label="Подробный разбор района"
                      value={focusedDistrict}
                      onChange={(event) =>
                        setFocusedDistrict(event.target.value as DistrictId)
                      }
                    >
                      {districts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <DistrictDetail
                    before={beforeDistrict}
                    after={afterDistrict}
                  />
                </section>
                <section className="panel">
                  <h3>Решения в этом расчёте</h3>
                  <div className="result-actions">
                    {result.selectedActions.map((action) => {
                      const initiative = initiativeById.get(
                        action.initiativeId,
                      )!;
                      return (
                        <article key={action.initiativeId}>
                          <span className="eyebrow">
                            {initiative.id} · {initiative.cost} из бюджета
                          </span>
                          <h4>{initiative.name}</h4>
                          <p>
                            {action.districtId
                              ? districts.find(
                                  (district) =>
                                    district.id === action.districtId,
                                )?.name
                              : "Весь город"}{" "}
                            · лаг {initiative.lag} кв.
                          </p>
                        </article>
                      );
                    })}
                  </div>
                </section>
                <AnalysisPanel
                  analysis={analysis}
                  loading={analyzing}
                  error={analysisError}
                  onRetry={() => {
                    if (!analyzing)
                      void requestAnalysis(result, generation.current);
                  }}
                />
              </>
            ) : (
              <section className="empty-state">
                <span className="empty-symbol">↗</span>
                <h3>
                  {loading
                    ? "Симулятор рассчитывает сценарий"
                    : "Посмотрите на эффект решений"}
                </h3>
                <p>
                  {loading
                    ? "Ожидаем ответ сервера. Это может занять несколько секунд."
                    : "Выберите пять инициатив и запустите симуляцию. Здесь появятся показатели районов, графики и стратегический разбор."}
                </p>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setView("plan")}
                >
                  К выбору решений
                </button>
              </section>
            ))}
          {view === "compare" && (
            <ScenarioComparison
              a={scenarioA}
              b={scenarioB}
              onRestore={restoreScenario}
            />
          )}
        </section>
      </main>
      <footer className="site-footer">
        <span>
          Akim for 5 Hours <span> / HackAlem</span>
        </span>
        <span>Синтетические данные · Горизонт 8 кварталов</span>
      </footer>
      {view === "plan" && (
        <div className="mobile-action-bar">
          <span>
            <strong>{spent} / 100</strong>
            <small>{actions.length} из 5 решений</small>
          </span>
          <button
            type="button"
            className="button primary"
            disabled={!valid || loading}
            onClick={() => void runSimulation()}
          >
            {loading ? "Расчёт…" : "Рассчитать"}
          </button>
        </div>
      )}
    </div>
  );
}
