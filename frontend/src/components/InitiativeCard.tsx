import type { ActionInput, District, Initiative } from "../types/index.js";
import { categoryLabels, formatEffect } from "../lib/format.js";

interface InitiativeCardProps {
  initiative: Initiative;
  districts: District[];
  selectedAction?: ActionInput;
  onToggle: (initiative: Initiative) => void;
  onDistrictChange: (initiativeId: string, districtId: string) => void;
}

export function InitiativeCard({ initiative, districts, selectedAction, onToggle, onDistrictChange }: InitiativeCardProps) {
  const selected = Boolean(selectedAction);

  return (
    <article className={`rounded-lg border p-4 ${selected ? "border-teal bg-teal/5" : "border-line bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500">{categoryLabels[initiative.category]}</div>
          <h3 className="mt-1 text-sm font-semibold text-ink">{initiative.id}. {initiative.name}</h3>
        </div>
        <button
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${selected ? "bg-slate-200 text-ink" : "bg-teal text-white"}`}
          onClick={() => onToggle(initiative)}
        >
          {selected ? "Убрать" : "Выбрать"}
        </button>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-slate-500">Стоимость</dt>
          <dd className="font-semibold">{initiative.cost}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Лаг</dt>
          <dd className="font-semibold">{initiative.lag} кв.</dd>
        </div>
        <div>
          <dt className="text-slate-500">Охват</dt>
          <dd className="font-semibold">{initiative.scope === "city" ? "Город" : "Район"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Эффекты</dt>
          <dd className="font-semibold">{formatEffect(initiative.effects)}</dd>
        </div>
      </dl>
      {selected && initiative.scope === "district" && (
        <label className="mt-3 block text-sm">
          <span className="text-slate-600">Район</span>
          <select
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
            value={selectedAction?.districtId ?? ""}
            onChange={(event) => onDistrictChange(initiative.id, event.target.value)}
          >
            <option value="">Выберите район</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>{district.name}</option>
            ))}
          </select>
        </label>
      )}
    </article>
  );
}
