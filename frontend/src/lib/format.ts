import type { Category, MetricCode } from "../types/index.js";

export const metricLabels: Record<MetricCode, string> = {
  T1: "Разгрузка дорог",
  T2: "Доступность ОТ",
  E1: "Озеленение",
  E2: "Качество воздуха",
  S1: "Школы и детсады",
  S2: "Поликлиники",
  B1: "Безопасность улиц",
  B2: "Безопасность дорог",
  C1: "Надежность ЖКХ",
  C2: "Скорость обращений"
};

export const categoryLabels: Record<Category, string> = {
  transport: "Транспорт",
  ecology: "Экология",
  social: "Соцсфера",
  safety: "Безопасность",
  services: "Сервисы"
};

export function formatEffect(effects: Partial<Record<MetricCode, number>>): string {
  return Object.entries(effects)
    .map(([metric, value]) => `${metric} ${value > 0 ? "+" : ""}${value}`)
    .join(", ");
}
