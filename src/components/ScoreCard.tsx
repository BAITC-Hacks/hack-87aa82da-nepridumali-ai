import type { ScenarioResult } from "../app/page";

export const formatScore = (value: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value);

export default function ScoreCard({ result }: { result: ScenarioResult }) {
  const difference = result.scoreAfter - result.scoreBefore;
  return (
    <section className="score-card" aria-labelledby="score-title">
      <div>
        <span className="eyebrow">Индекс качества жизни</span>
        <h3 id="score-title">Ваш вклад в город</h3>
        <p>AQoLS · от 0 до 100</p>
      </div>
      <div className="score-comparison">
        <div>
          <span>До решений</span>
          <strong>{formatScore(result.scoreBefore)}</strong>
        </div>
        <span className="score-arrow" aria-hidden="true">
          →
        </span>
        <div>
          <span>После решений</span>
          <strong>{formatScore(result.scoreAfter)}</strong>
        </div>
      </div>
      <div className="score-footer">
        <span className={`score-delta ${difference < 0 ? "decrease" : ""}`}>
          {difference > 0 ? "+" : ""}
          {formatScore(difference)} пункта
        </span>
        <span>Штраф за дисбаланс: {formatScore(result.imbalancePenalty)}</span>
      </div>
    </section>
  );
}
