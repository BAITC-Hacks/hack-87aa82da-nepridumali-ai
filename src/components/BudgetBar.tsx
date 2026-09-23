interface BudgetBarProps {
  total: number;
  spent: number;
  selectedCount: number;
}

export const formatMoney = (value: number) =>
  new Intl.NumberFormat("ru-RU").format(value);

export default function BudgetBar({
  total,
  spent,
  selectedCount,
}: BudgetBarProps) {
  const remaining = total - spent;
  const percentage = Math.min(100, Math.max(0, (spent / total) * 100));

  return (
    <section className="budget-panel" aria-labelledby="budget-title">
      <div className="section-heading">
        <span className="eyebrow" id="budget-title">
          Бюджет вашего города
        </span>
        <span className="pill">млн ₸</span>
      </div>
      <div className="budget-total">
        {formatMoney(total)}
        <span> млн ₸</span>
      </div>
      <p className="muted">Фиксированный бюджет на пять решений</p>
      <div
        className="budget-track"
        role="progressbar"
        aria-label="Использовано бюджета"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(total, spent)}
        aria-valuetext={`${formatMoney(spent)} из ${formatMoney(total)} миллионов тенге`}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
      <dl className="budget-details" aria-live="polite" aria-atomic="true">
        <div>
          <dt>Распределено</dt>
          <dd>
            {formatMoney(spent)} <small>млн ₸</small>
          </dd>
        </div>
        <div>
          <dt>Осталось</dt>
          <dd className={remaining < 0 ? "negative" : "positive"}>
            {formatMoney(remaining)} <small>млн ₸</small>
          </dd>
        </div>
      </dl>
      {remaining < 0 && (
        <p className="notice error" role="alert">
          Бюджет превышен на {formatMoney(-remaining)} млн ₸. Выберите менее
          затратные инициативы.
        </p>
      )}
      <div className="selection-progress">
        <span>Решений принято</span>
        <strong>{selectedCount} / 5</strong>
      </div>
      <div className="selection-dots" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className={index < selectedCount ? "filled" : ""} />
        ))}
      </div>
    </section>
  );
}
