import type { Category, Initiative } from "../app/page";
import { formatMoney } from "./BudgetBar";

interface CategoryCardProps {
  category: Category;
  title: string;
  description: string;
  index: number;
  initiatives: Initiative[];
  selectedId?: string;
  availableBudget: number;
  onSelect: (initiative: Initiative) => void;
}

export default function CategoryCard({
  category,
  title,
  description,
  index,
  initiatives,
  selectedId,
  availableBudget,
  onSelect,
}: CategoryCardProps) {
  return (
    <fieldset className="category-card">
      <legend>
        <span className="category-number">0{index + 1}</span>
        {title}
        <span className={`category-status ${selectedId ? "is-selected" : ""}`}>
          {selectedId ? "Выбрано ✓" : "Выберите одну"}
        </span>
      </legend>
      <p className="category-description">{description}</p>
      <div className="initiative-grid">
        {initiatives.map((initiative) => {
          const selected = selectedId === initiative.id;
          const overBudget = initiative.costMlnKzt > availableBudget;
          return (
            <label
              key={initiative.id}
              className={`initiative ${selected ? "selected" : ""} ${overBudget ? "unavailable" : ""}`}
            >
              <div className="initiative-top">
                <input
                  type="radio"
                  name={category}
                  value={initiative.id}
                  checked={selected}
                  disabled={overBudget && !selected}
                  onChange={() => onSelect(initiative)}
                  aria-describedby={`${initiative.id}-description ${initiative.id}-details`}
                />
                <span className="initiative-cost">
                  {formatMoney(initiative.costMlnKzt)} <small>млн ₸</small>
                </span>
              </div>
              <span className="initiative-title">{initiative.titleRu}</span>
              <span
                className="initiative-description"
                id={`${initiative.id}-description`}
              >
                {initiative.descriptionRu}
              </span>
              <span
                className="initiative-details"
                id={`${initiative.id}-details`}
              >
                <span>◷ {initiative.horizonRu}</span>
                <span className="tradeoff">
                  Компромисс: {initiative.tradeoffRu}
                </span>
                {overBudget && (
                  <span className="negative">
                    Не хватает{" "}
                    {formatMoney(initiative.costMlnKzt - availableBudget)} млн ₸
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
