import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  detail: string;
}

export function KpiCard({ label, value, detail }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{detail}</div>
    </div>
  );
}
