import { formatNumber, signed } from "../lib/catalog";
import type { SimulationResult } from "../types";

export default function ScoreCard({ result }: { result: SimulationResult }) {
  return (
    <section className="score-card">
      <span className="eyebrow">Astana Quality of Life Score</span>
      <h3>Город после ваших решений</h3>
      <div className="score-pair">
        <div>
          <span>До</span>
          <strong>{formatNumber(result.scoreBefore)}</strong>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <span>После</span>
          <strong>{formatNumber(result.scoreAfter)}</strong>
        </div>
      </div>
      <div className="row">
        <span className={`score-delta ${result.delta < 0 ? "down" : ""}`}>
          {signed(result.delta)} пункта
        </span>
        <span className="score-source">Детерминированный расчёт сервера</span>
      </div>
    </section>
  );
}
