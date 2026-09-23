import {
  categories,
  districts,
  formatNumber,
  metrics,
  signed,
} from "../lib/catalog";
import type { DistrictId, Initiative } from "../types";

interface Props {
  initiative: Initiative;
  selected: boolean;
  full: boolean;
  blockReason: string | null;
  districtId: DistrictId | "";
  onDistrict: (id: DistrictId | "") => void;
  onAdd: () => void;
}

export default function CategoryCard({
  initiative,
  selected,
  full,
  blockReason,
  districtId,
  onDistrict,
  onAdd,
}: Props) {
  return (
    <article
      className={`initiative-card ${selected ? "selected" : ""}`}
      aria-labelledby={`${initiative.id}-title`}
    >
      <div className="row">
        <span className={`category-tag ${initiative.category}`}>
          {
            categories.find((category) => category.id === initiative.category)
              ?.name
          }
        </span>
        <span className="initiative-id">{initiative.id}</span>
      </div>
      <h3 id={`${initiative.id}-title`}>{initiative.name}</h3>
      <div className="initiative-facts">
        <strong>
          {formatNumber(initiative.cost)} <small>из бюджета</small>
        </strong>
        <span>◷ Лаг: {initiative.lag} кв.</span>
      </div>
      <p className="scope-label">
        {initiative.scope === "city"
          ? "◎ Весь город · все 5 районов"
          : "⌖ Один выбранный район"}
      </p>
      <div className="effect-list" aria-label="Полные эффекты до учёта лага">
        {Object.entries(initiative.effects).map(([code, effect]) => (
          <span
            key={code}
            title={metrics.find((metric) => metric.id === code)?.name}
            className={effect < 0 ? "effect negative" : "effect"}
          >
            <abbr title={metrics.find((metric) => metric.id === code)?.name}>
              {code}
            </abbr>
            <strong>{signed(effect)}</strong>
          </span>
        ))}
      </div>
      <p className="effect-note">
        Эффекты до учёта лага. Реализованный эффект рассчитывает сервер на
        горизонте 8 кварталов.
      </p>
      <div className="initiative-actions">
        {initiative.scope === "district" && (
          <label className="field-label">
            Район для {initiative.id}
            <select
              aria-label={`Район для ${initiative.id}`}
              value={districtId}
              onChange={(event) =>
                onDistrict(event.target.value as DistrictId | "")
              }
              disabled={selected}
            >
              <option value="">Выберите район</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          className={selected ? "button selected-button" : "button secondary"}
          disabled={selected || full || Boolean(blockReason)}
          aria-label={
            selected
              ? `${initiative.id} уже в сценарии`
              : `Добавить ${initiative.id}`
          }
          aria-describedby={
            !selected && blockReason
              ? `${initiative.id}-block-reason`
              : undefined
          }
          onClick={onAdd}
        >
          {selected ? "✓ В сценарии" : `Добавить ${initiative.id}`}
        </button>
        {!selected && blockReason && (
          <p
            className="initiative-block-reason"
            id={`${initiative.id}-block-reason`}
          >
            {blockReason}
          </p>
        )}
      </div>
    </article>
  );
}
