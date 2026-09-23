import { z } from "zod";
import { districts, metrics } from "./catalog";
import type {
  Action,
  Analysis,
  District,
  Metric,
  SimulationResult,
} from "../types";

const finite = z.number().finite();
const districtId = z.enum(["yesil", "almaty", "saryarka", "baikonur", "nura"]);
const actionSchema = z
  .object({
    initiative: z.object({ id: z.string() }),
    districtId: districtId.optional(),
  })
  .transform((action) =>
    action.districtId
      ? { initiativeId: action.initiative.id, districtId: action.districtId }
      : { initiativeId: action.initiative.id },
  );
const districtSchema = z.object({
  id: districtId,
  metrics: z.record(z.string(), finite.min(0).max(100)),
  score: finite.optional(),
  criticalIssues: z
    .array(z.enum(["T1", "T2", "E1", "E2", "S1", "S2", "B1", "B2", "C1", "C2"]))
    .optional(),
});
const resultSchema = z.object({
  valid: z.literal(true),
  errors: z.array(z.string()),
  scoreBefore: finite,
  scoreAfter: finite,
  delta: finite,
  districtsBefore: z.array(z.unknown()),
  districtsAfter: z.array(z.unknown()),
  selectedActions: z.array(actionSchema),
  analysisData: z.record(z.string(), z.unknown()),
  recommendations: z.array(z.unknown()),
});
const analysisSchema = z.object({
  source: z.enum(["openai", "fallback"]),
  executiveSummary: z.string(),
  keyImprovements: z.array(z.string()),
  risks: z.array(z.string()),
  tradeoffs: z.array(z.string()),
  strategicRecommendations: z.array(z.string()),
  suggestedNextInvestments: z.array(z.string()),
});

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly issues: string[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readDistricts(input: unknown[]): District[] {
  const parsed = input.map((value) => {
    const row = districtSchema.parse(value);
    const baseline = districts.find((district) => district.id === row.id)!;
    if (!metrics.every((metric) => typeof row.metrics[metric.id] === "number"))
      throw new Error("Missing district metrics");
    return {
      ...baseline,
      metrics: row.metrics as Record<Metric, number>,
      score: row.score,
      criticalIssues: row.criticalIssues,
    };
  });
  if (
    parsed.length !== 5 ||
    new Set(parsed.map((district) => district.id)).size !== 5
  )
    throw new Error("Missing or duplicate districts");
  return parsed;
}

export function parseSimulation(
  value: unknown,
  actions: Action[],
): SimulationResult {
  const rejected = z
    .object({ valid: z.literal(false), errors: z.array(z.string()) })
    .safeParse(value);
  if (rejected.success)
    throw new ApiError("Сервер отклонил сценарий.", rejected.data.errors);
  try {
    const data = resultSchema.parse(value);
    const actionKey = (list: Action[]) =>
      list
        .map((action) => `${action.initiativeId}:${action.districtId ?? ""}`)
        .sort()
        .join("|");
    if (
      data.selectedActions.length !== 5 ||
      actionKey(data.selectedActions) !== actionKey(actions)
    )
      throw new Error("Result belongs to a different selection");
    return {
      ...data,
      districtsBefore: readDistricts(data.districtsBefore),
      districtsAfter: readDistricts(data.districtsAfter),
    };
  } catch {
    throw new ApiError(
      "Ответ сервера не соответствует контракту симуляции. Результаты не показаны, чтобы не вводить вас в заблуждение.",
    );
  }
}

export function parseAnalysis(value: unknown): Analysis {
  const parsed = analysisSchema.safeParse(value);
  if (!parsed.success)
    throw new ApiError("AI вернул ответ в неподдерживаемом формате.");
  const data = parsed.data;
  return {
    source: data.source,
    executive_summary: data.executiveSummary,
    key_improvements: data.keyImprovements,
    risks: data.risks,
    tradeoffs: data.tradeoffs,
    strategic_recommendations: data.strategicRecommendations,
    suggested_next_investments: data.suggestedNextInvestments,
  };
}

async function post(
  path: string,
  body: unknown,
  signal: AbortSignal,
): Promise<unknown> {
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new ApiError(
      "Не удалось связаться с сервером. Проверьте подключение и доступность API.",
    );
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    if (response.ok)
      throw new ApiError(
        "Сервер вернул нечитаемый ответ. Расчёт не показан. Повторите попытку; выбранные меры сохранятся.",
      );
  }
  if (!response.ok) {
    const details = z.object({ errors: z.array(z.string()) }).safeParse(data);
    throw new ApiError(
      response.status === 429
        ? "Слишком много запросов. Подождите немного и повторите попытку."
        : response.status >= 500
          ? "Сервис временно недоступен. Повторите запрос через некоторое время."
          : "Сервер не принял сценарий. Проверьте указанные причины и измените выбранные меры.",
      details.success ? details.data.errors : [],
    );
  }
  return data;
}

export const simulate = async (actions: Action[], signal: AbortSignal) =>
  parseSimulation(await post("/simulate", { actions }, signal), actions);
export const analyze = async (actions: Action[], signal: AbortSignal) =>
  parseAnalysis(await post("/analysis", { actions }, signal));

export function recommendationText(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const action =
    typeof item.action === "string"
      ? item.action
      : typeof item.title === "string"
        ? item.title
        : null;
  return action
    ? `${action}${typeof item.rationale === "string" ? ` — ${item.rationale}` : ""}`
    : null;
}

export function fallbackAnalysis(result: SimulationResult): Analysis {
  return {
    source: "fallback",
    executive_summary:
      "AI-разбор недоступен. Числовые результаты симуляции сохранены. Ниже приведены рекомендации, рассчитанные сервером; новые эффекты и инвестиции не добавляются.",
    key_improvements: [],
    risks: [],
    tradeoffs: [],
    strategic_recommendations: result.recommendations
      .map(recommendationText)
      .filter((item): item is string => item !== null),
    suggested_next_investments: [],
  };
}

export function analyticNumber(
  result: SimulationResult | null,
  key: string,
): number | null {
  const value = result?.analysisData[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
