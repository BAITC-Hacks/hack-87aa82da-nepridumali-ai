import { formatNumber, metrics, signed, spentBudget } from "../lib/catalog";
import {
  allocation,
  CategoryImpactChart,
  ComparisonChart,
} from "./ImpactChart";
import type { SavedScenario } from "../types";

export default function ScenarioComparison({
  a,
  b,
  onRestore,
}: {
  a: SavedScenario | null;
  b: SavedScenario | null;
  onRestore: (scenario: SavedScenario) => void;
}) {
  if (!a || !b)
    return (
      <section className="empty-state">
        <span className="empty-symbol">A / B</span>
        <h2>Два подхода к одному городу</h2>
        <p>
          Рассчитайте сценарий и сохраните его как A. Измените решения, снова
          запустите симуляцию и сохраните результат как B.
        </p>
        <div className="row">
          <span className="tag">A: {a ? "сохранён" : "не сохранён"}</span>
          <span className="tag">B: {b ? "сохранён" : "не сохранён"}</span>
        </div>
      </section>
    );
  const leftBudget = allocation(a.actions);
  const rightBudget = allocation(b.actions);
  return (
    <section className="comparison">
      <div className="comparison-kpis">
        {[a, b].map((scenario) => (
          <article className="panel" key={scenario.name}>
            <span className="eyebrow">Сценарий {scenario.name}</span>
            <strong className="comparison-score">
              {formatNumber(scenario.result.scoreAfter)}
            </strong>
            <p>Бюджет: {spentBudget(scenario.actions)} / 100</p>
            <button
              type="button"
              className="text-button"
              onClick={() => onRestore(scenario)}
            >
              Вернуться к решениям {scenario.name}
            </button>
          </article>
        ))}
        <article className="panel comparison-delta">
          <span className="eyebrow">B относительно A</span>
          <strong
            className={
              b.result.scoreAfter < a.result.scoreAfter
                ? "negative"
                : "positive"
            }
          >
            {signed(b.result.scoreAfter - a.result.scoreAfter)}
          </strong>
          <p>Разница итогового индекса</p>
        </article>
      </div>
      <div className="analytics-grid">
        <ComparisonChart
          title="Районы: A против B"
          beforeLabel="A"
          afterLabel="B"
          rows={a.result.districtsAfter.flatMap((left) => {
            const right = b.result.districtsAfter.find(
              (district) => district.id === left.id,
            );
            return left.score !== undefined && right?.score !== undefined
              ? [{ name: left.name, before: left.score, after: right.score }]
              : [];
          })}
        />
        <ComparisonChart
          title="Бюджет: A против B"
          beforeLabel="A"
          afterLabel="B"
          rows={leftBudget.map((row, index) => ({
            name: row.name,
            before: row.value,
            after: rightBudget[index].value,
          }))}
        />
        <div className="full-width">
          <CategoryImpactChart
            title="Категории: A против B"
            beforeLabel="A"
            afterLabel="B"
            before={a.result.districtsAfter}
            after={b.result.districtsAfter}
          />
        </div>
      </div>
      <section className="panel">
        <h3>Разница метрик по районам</h3>
        <p className="muted">В каждой ячейке: результат A → результат B.</p>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Сравнение метрик сценариев"
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Район</th>
                {metrics.map((metric) => (
                  <th key={metric.id} scope="col">
                    <abbr title={metric.name}>{metric.id}</abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {a.result.districtsAfter.map((left) => {
                const right = b.result.districtsAfter.find(
                  (district) => district.id === left.id,
                );
                return (
                  <tr key={left.id}>
                    <th scope="row">{left.name}</th>
                    {metrics.map((metric) => (
                      <td key={metric.id}>
                        {formatNumber(left.metrics[metric.id])} →{" "}
                        {right ? formatNumber(right.metrics[metric.id]) : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
