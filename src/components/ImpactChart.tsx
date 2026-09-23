"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Category, ScenarioResult } from "../app/page";
import { formatScore } from "./ScoreCard";

interface ImpactChartProps {
  result: ScenarioResult;
  categories: ReadonlyArray<{
    id: Category;
    title: string;
    shortTitle: string;
  }>;
}

export default function ImpactChart({ result, categories }: ImpactChartProps) {
  const data = categories.map(({ id, shortTitle }) => ({
    name: shortTitle,
    before: result.categoryScoresBefore[id],
    after: result.categoryScoresAfter[id],
  }));
  return (
    <section className="surface impact-panel" aria-labelledby="impact-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Пять направлений</span>
          <h3 id="impact-title">Что изменилось</h3>
        </div>
        <div className="chart-legend">
          <span>
            <i className="before-dot" />
            До
          </span>
          <span>
            <i className="after-dot" />
            После
          </span>
        </div>
      </div>
      <p className="muted">
        Баллы категорий учитывают численность населения районов.
      </p>
      <div className="impact-chart" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={data}
            margin={{ top: 16, right: 8, left: -24, bottom: 8 }}
            accessibilityLayer={false}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e3e9e6"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#596963" }}
              interval={0}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) =>
                typeof value === "number"
                  ? formatScore(value)
                  : String(value ?? "")
              }
              cursor={{ fill: "#f0f5f2" }}
            />
            <Bar
              name="До"
              dataKey="before"
              fill="#c4d3cc"
              radius={[5, 5, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              name="После"
              dataKey="after"
              fill="#19745b"
              radius={[5, 5, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">Изменение баллов по категориям</caption>
          <thead>
            <tr>
              <th scope="col">Направление</th>
              <th scope="col">До</th>
              <th scope="col">После</th>
              <th scope="col">Изменение</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(({ id, title }) => {
              const delta =
                result.categoryScoresAfter[id] -
                result.categoryScoresBefore[id];
              return (
                <tr key={id}>
                  <th scope="row">{title}</th>
                  <td>{formatScore(result.categoryScoresBefore[id])}</td>
                  <td>{formatScore(result.categoryScoresAfter[id])}</td>
                  <td className={delta < 0 ? "negative" : "positive"}>
                    {delta > 0 ? "+" : ""}
                    {formatScore(delta)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
