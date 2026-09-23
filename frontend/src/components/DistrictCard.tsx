import type { DistrictResult } from "../types/index.js";

interface DistrictCardProps {
  district: DistrictResult;
  active: boolean;
  onOpen: () => void;
}

export function DistrictCard({ district, active, onOpen }: DistrictCardProps) {
  const delta = Object.values(district.metricDelta).reduce((sum, value) => sum + value, 0);
  return (
    <button
      className={`rounded-lg border p-4 text-left ${active ? "border-teal bg-white" : "border-line bg-white"}`}
      onClick={onOpen}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink">{district.name}</h3>
        <span className="rounded-md bg-panel px-2 py-1 text-sm font-semibold">{district.score}</span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{district.profile}</p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span>Доля населения: {(district.populationShare * 100).toFixed(0)}%</span>
        <span className={delta >= 0 ? "text-teal" : "text-amber"}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}</span>
      </div>
      <div className="mt-2 text-xs text-slate-500">Критических показателей: {district.criticalIssues.length}</div>
    </button>
  );
}
