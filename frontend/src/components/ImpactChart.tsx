import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  categories,
  formatNumber,
  initiativeById,
  metrics,
  signed,
} from "../lib/catalog";
import type { Action, Category, District, SimulationResult } from "../types";

const colors = ["#237b65", "#86ad70", "#daa75c", "#6a88b2", "#a791b4"];
const tooltipValue = (value: unknown) =>
  typeof value === "number" ? formatNumber(value) : String(value ?? "");
type BarRow = { name: string; before: number; after: number };

export function ComparisonChart({
  title,
  rows,
  beforeLabel = "До",
  afterLabel = "После",
  emptyMessage = "Сервер не передал показатели для этого графика.",
}: {
  title: string;
  rows: BarRow[];
  beforeLabel?: string;
  afterLabel?: string;
  emptyMessage?: string;
}) {
  return (
    <section className="panel chart-panel">
      <div className="row">
        <h3>{title}</h3>
        <div className="legend">
          <span>
            <i />
            {beforeLabel}
          </span>
          <span>
            <i />
            {afterLabel}
          </span>
        </div>
      </div>
      {rows.length ? (
        <>
          <div
            className="chart"
            style={{ height: Math.max(210, rows.length * 52) }}
            aria-hidden="true"
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                layout="vertical"
                data={rows}
                margin={{ top: 12, right: 15, bottom: 0, left: 0 }}
                accessibilityLayer={false}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="#e2e9e4"
                  strokeDasharray="3 3"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={85}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={tooltipValue} />
                <Bar
                  dataKey="before"
                  name={beforeLabel}
                  fill="#c6d5ca"
                  radius={[0, 3, 3, 0]}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="after"
                  name={afterLabel}
                  fill="#237b65"
                  radius={[0, 3, 3, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label={title}
          >
            <table>
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr>
                  <th scope="col">Показатель</th>
                  <th scope="col">{beforeLabel}</th>
                  <th scope="col">{afterLabel}</th>
                  <th scope="col">Δ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name}>
                    <th scope="row">{row.name}</th>
                    <td>{formatNumber(row.before)}</td>
                    <td>{formatNumber(row.after)}</td>
                    <td
                      className={
                        row.after < row.before ? "negative" : "positive"
                      }
                    >
                      {signed(row.after - row.before)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="empty-note">{emptyMessage}</p>
      )}
    </section>
  );
}

export function CategoryImpactChart({
  before,
  after,
  title = "Влияние по категориям",
  beforeLabel = "До",
  afterLabel = "После",
}: {
  before: District[];
  after: District[];
  title?: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [category, setCategory] = useState<Category>("transport");
  const categoryMetrics = metrics.filter(
    (metric) => metric.category === category,
  );
  const rows = before.flatMap((district) => {
    const updated = after.find((item) => item.id === district.id);
    return updated
      ? categoryMetrics.map((metric) => ({
          name: `${district.name} ${metric.id}`,
          before: district.metrics[metric.id],
          after: updated.metrics[metric.id],
        }))
      : [];
  });
  return (
    <div className="category-impact">
      <label className="field-label category-selector">
        Категория графика
        <select
          aria-label={`${title}: категория`}
          value={category}
          onChange={(event) => setCategory(event.target.value as Category)}
        >
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <p className="muted category-metric-labels">
        {categoryMetrics
          .map((metric) => `${metric.id} — ${metric.name}`)
          .join(" · ")}
      </p>
      <ComparisonChart
        title={title}
        rows={rows}
        beforeLabel={beforeLabel}
        afterLabel={afterLabel}
      />
    </div>
  );
}

export function allocation(actions: Action[]) {
  return categories.map((category) => ({
    name: category.name,
    value: actions.reduce((sum, action) => {
      const initiative = initiativeById.get(action.initiativeId);
      return sum + (initiative?.category === category.id ? initiative.cost : 0);
    }, 0),
  }));
}

export function BudgetChart({ actions }: { actions: Action[] }) {
  const data = allocation(actions);
  return (
    <section className="panel chart-panel">
      <h3>Распределение бюджета</h3>
      <div className="chart donut" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart accessibilityLayer={false}>
            <Pie
              data={data.filter((row) => row.value > 0)}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={3}
              isAnimationActive={false}
              rootTabIndex={-1}
            >
              {data
                .filter((row) => row.value > 0)
                .map((row) => (
                  <Cell
                    key={row.name}
                    fill={
                      colors[data.findIndex((item) => item.name === row.name)]
                    }
                  />
                ))}
            </Pie>
            <Tooltip formatter={tooltipValue} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <dl className="allocation-list">
        {data.map((row, index) => (
          <div key={row.name}>
            <dt>
              <i style={{ background: colors[index] }} />
              {row.name}
            </dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DistrictDetail({
  before,
  after,
}: {
  before: District;
  after?: District;
}) {
  const data = metrics.map((metric) => ({
    name: metric.id,
    before: before.metrics[metric.id],
    after: after?.metrics[metric.id],
  }));
  return (
    <section className="panel district-detail">
      <div className="row">
        <div>
          <span className="eyebrow">Профиль района</span>
          <h3>{before.name}</h3>
        </div>
        <span className="tag">
          {formatNumber(before.populationShare * 100)}% населения
        </span>
      </div>
      <div className="district-detail-grid">
        <div>
          <div className="chart radar" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <RadarChart
                data={data}
                outerRadius="65%"
                accessibilityLayer={false}
              >
                <PolarGrid stroke="#d9e3dc" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar
                  dataKey="before"
                  name="До"
                  stroke="#8ea795"
                  fill="#c6d5ca"
                  fillOpacity={0.3}
                  isAnimationActive={false}
                />
                {after && (
                  <Radar
                    dataKey="after"
                    name="После"
                    stroke="#237b65"
                    fill="#237b65"
                    fillOpacity={0.18}
                    isAnimationActive={false}
                  />
                )}
                <Tooltip formatter={tooltipValue} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="muted">Шкала 0–100. Чем выше показатель, тем лучше.</p>
          {before.score !== undefined && (
            <p className="district-score">
              Индекс района: {formatNumber(before.score)}
              {after?.score !== undefined && (
                <>
                  {" "}
                  → <strong>{formatNumber(after.score)}</strong>{" "}
                  <span className="positive">
                    ({signed(after.score - before.score)})
                  </span>
                </>
              )}
            </p>
          )}
        </div>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label={`Метрики района ${before.name}`}
        >
          <table>
            <caption className="sr-only">Метрики района {before.name}</caption>
            <thead>
              <tr>
                <th scope="col">Метрика</th>
                <th scope="col">До</th>
                {after && (
                  <>
                    <th scope="col">После</th>
                    <th scope="col">Δ</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.id}>
                  <th scope="row">
                    <span className="metric-code">{metric.id}</span>
                    {metric.name}
                  </th>
                  <td>{formatNumber(before.metrics[metric.id])}</td>
                  {after && (
                    <>
                      <td>{formatNumber(after.metrics[metric.id])}</td>
                      <td
                        className={
                          after.metrics[metric.id] < before.metrics[metric.id]
                            ? "negative"
                            : "positive"
                        }
                      >
                        {signed(
                          after.metrics[metric.id] - before.metrics[metric.id],
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function ImpactChart({
  result,
  actions,
}: {
  result: SimulationResult;
  actions: Action[];
}) {
  const districtRows = result.districtsBefore.flatMap((before) => {
    const after = result.districtsAfter.find(
      (district) => district.id === before.id,
    );
    return before.score !== undefined && after?.score !== undefined
      ? [{ name: before.name, before: before.score, after: after.score }]
      : [];
  });
  // Only visualize the backend's critical-metric selection; the client does not
  // duplicate N_crit or any scoring/threshold calculation.
  const criticalRows: BarRow[] = result.districtsBefore.flatMap((before) => {
    const after = result.districtsAfter.find((item) => item.id === before.id);
    if (!after) return [];
    return [
      ...new Set([
        ...(before.criticalIssues ?? []),
        ...(after.criticalIssues ?? []),
      ]),
    ].map((metric) => ({
      name: `${before.name} ${metric}`,
      before: before.metrics[metric],
      after: after.metrics[metric],
    }));
  });
  const hasCriticalData = [
    ...result.districtsBefore,
    ...result.districtsAfter,
  ].every((district) => district.criticalIssues !== undefined);
  return (
    <div className="analytics-grid">
      <ComparisonChart
        title="Индекс: до и после"
        rows={[
          {
            name: "AQoLS",
            before: result.scoreBefore,
            after: result.scoreAfter,
          },
        ]}
      />
      <ComparisonChart title="Сравнение районов" rows={districtRows} />
      <BudgetChart actions={actions} />
      <ComparisonChart
        title="Критические показатели"
        rows={criticalRows}
        emptyMessage={
          hasCriticalData
            ? "Критических показателей до и после сценария нет."
            : undefined
        }
      />
      <div className="full-width">
        <CategoryImpactChart
          before={result.districtsBefore}
          after={result.districtsAfter}
        />
      </div>
    </div>
  );
}
