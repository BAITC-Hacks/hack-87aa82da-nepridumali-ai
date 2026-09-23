type BudgetBarProps = {
  spent: number;
  remaining: number;
  total: number;
};

export function BudgetBar({ spent, remaining, total }: BudgetBarProps) {
  const ratio = total === 0 ? 0 : (spent / total) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-700">
        <span>Использованный бюджет</span>
        <span>{spent.toFixed(0)} / {total.toFixed(0)} млн KZT</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
          style={{ width: `${Math.min(ratio, 100)}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-sm text-slate-600">
        <span>Остаток: {remaining.toFixed(0)} млн KZT</span>
        <span>{ratio.toFixed(0)}%</span>
      </div>
    </div>
  );
}
