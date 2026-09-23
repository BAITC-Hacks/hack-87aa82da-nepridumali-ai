type ScoreCardProps = {
  label: string;
  value: number;
  tone?: 'good' | 'neutral' | 'alert';
};

export function ScoreCard({ label, value, tone = 'good' }: ScoreCardProps) {
  const toneClasses = {
    good: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    neutral: 'border-sky-200 bg-sky-50 text-sky-900',
    alert: 'border-amber-200 bg-amber-50 text-amber-900',
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value.toFixed(1)}</p>
    </div>
  );
}
