import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { DistrictResult, MetricCode, SimulationResult } from "../types/index.js";
import { metricLabels } from "../lib/format.js";

interface ChartsProps {
  result: SimulationResult;
  activeDistrict?: DistrictResult;
}

const metrics: MetricCode[] = ["T1", "T2", "E1", "E2", "S1", "S2", "B1", "B2", "C1", "C2"];

export function Charts({ result, activeDistrict }: ChartsProps) {
  const districtScoreData = result.districtsAfter.map((district) => {
    const before = result.districtsBefore.find((item) => item.id === district.id);
    return {
      name: district.name,
      before: before?.score ?? 0,
      after: district.score
    };
  });

  const radarData = activeDistrict
    ? metrics.map((metric) => ({
      metric,
      label: metricLabels[metric],
      value: activeDistrict.metrics[metric]
    }))
    : [];

  const metricChangeData = activeDistrict
    ? metrics.map((metric) => ({
      metric,
      delta: activeDistrict.metricDelta[metric]
    }))
    : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-line bg-white p-4">
        <h3 className="font-semibold text-ink">District Score Comparison</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={districtScoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="before" fill="#94a3b8" name="Before" />
              <Bar dataKey="after" fill="#0f766e" name="After" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-4">
        <h3 className="font-semibold text-ink">Before vs After</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={districtScoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="before" stroke="#64748b" name="Before" />
              <Line type="monotone" dataKey="after" stroke="#0f766e" name="After" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {activeDistrict && (
        <>
          <section className="rounded-lg border border-line bg-white p-4">
            <h3 className="font-semibold text-ink">{activeDistrict.name}: Radar Chart</h3>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar dataKey="value" fill="#0f766e" fillOpacity={0.25} stroke="#0f766e" />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-4">
            <h3 className="font-semibold text-ink">{activeDistrict.name}: Metric Changes</h3>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricChangeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="delta" fill="#b45309" name="Delta" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
