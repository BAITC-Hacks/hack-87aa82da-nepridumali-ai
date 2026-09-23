import { formatNumber, TOTAL_BUDGET } from "../lib/catalog";

export default function BudgetBar({
  spent,
  count,
}: {
  spent: number;
  count: number;
}) {
  const remaining = TOTAL_BUDGET - spent;
  return (
    <section className="budget-box" aria-label="Бюджет сценария">
      <div className="row">
        <span className="eyebrow">Ресурсы города</span>
        <span className="tag">Бюджет 100</span>
      </div>
      <div className="budget-value">
        {formatNumber(spent)}
        <span> / {TOTAL_BUDGET}</span>
      </div>
      <div
        className="budget-track"
        role="progressbar"
        aria-label="Использовано бюджета"
        aria-valuemin={0}
        aria-valuemax={TOTAL_BUDGET}
        aria-valuenow={Math.min(TOTAL_BUDGET, spent)}
        aria-valuetext={`Потрачено ${spent}, осталось ${remaining}`}
      >
        <span
          className={remaining < 0 ? "over" : ""}
          style={{ width: `${Math.min(100, spent)}%` }}
        />
      </div>
      <div className="row budget-meta" aria-live="polite">
        <span>
          Осталось{" "}
          <strong className={remaining < 0 ? "negative" : ""}>
            {formatNumber(remaining)}
          </strong>
        </span>
        <span>
          Решений <strong>{count} / 5</strong>
        </span>
      </div>
    </section>
  );
}
