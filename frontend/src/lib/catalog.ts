import type { Category, District, Initiative, Metric } from "../types";

// Display data transcribed from PROJECT_SPEC.md at simulation-core/95e841a.
// This module contains no scoring, simulation, or realized-effect formulas.
export const TOTAL_BUDGET = 100;
export const BASELINE_SCORE = 52.56;
export const HORIZON_QUARTERS = 8;
export const categories: { id: Category; name: string }[] = [
  { id: "transport", name: "Транспорт" },
  { id: "ecology", name: "Экология" },
  { id: "social", name: "Социальная сфера" },
  { id: "safety", name: "Безопасность" },
  { id: "services", name: "Городские сервисы" },
];
export const metrics: { id: Metric; name: string; category: Category }[] = [
  { id: "T1", name: "Свободные дороги", category: "transport" },
  { id: "T2", name: "Доступность транспорта", category: "transport" },
  { id: "E1", name: "Озеленение", category: "ecology" },
  { id: "E2", name: "Качество воздуха", category: "ecology" },
  { id: "S1", name: "Школы и детсады", category: "social" },
  { id: "S2", name: "Первичная медицина", category: "social" },
  { id: "B1", name: "Безопасность улиц", category: "safety" },
  { id: "B2", name: "Безопасность дорог", category: "safety" },
  { id: "C1", name: "Надёжность ЖКХ", category: "services" },
  { id: "C2", name: "Скорость работы с обращениями", category: "services" },
];
export const districts: District[] = [
  {
    id: "yesil",
    name: "Есиль",
    populationShare: 0.27,
    metrics: {
      T1: 45,
      T2: 62,
      E1: 68,
      E2: 72,
      S1: 48,
      S2: 55,
      B1: 78,
      B2: 60,
      C1: 75,
      C2: 70,
    },
  },
  {
    id: "almaty",
    name: "Алматы",
    populationShare: 0.24,
    metrics: {
      T1: 40,
      T2: 75,
      E1: 50,
      E2: 55,
      S1: 60,
      S2: 65,
      B1: 62,
      B2: 52,
      C1: 50,
      C2: 60,
    },
  },
  {
    id: "saryarka",
    name: "Сарыарка",
    populationShare: 0.2,
    metrics: {
      T1: 50,
      T2: 70,
      E1: 42,
      E2: 40,
      S1: 62,
      S2: 68,
      B1: 58,
      B2: 55,
      C1: 45,
      C2: 55,
    },
  },
  {
    id: "baikonur",
    name: "Байконур",
    populationShare: 0.13,
    metrics: {
      T1: 52,
      T2: 68,
      E1: 55,
      E2: 50,
      S1: 58,
      S2: 60,
      B1: 52,
      B2: 58,
      C1: 55,
      C2: 58,
    },
  },
  {
    id: "nura",
    name: "Нура",
    populationShare: 0.16,
    metrics: {
      T1: 55,
      T2: 40,
      E1: 45,
      E2: 65,
      S1: 38,
      S2: 35,
      B1: 55,
      B2: 50,
      C1: 60,
      C2: 50,
    },
  },
];
export const initiatives: Initiative[] = [
  {
    id: "M1",
    category: "transport",
    name: "Выделенные полосы для автобусов",
    scope: "district",
    cost: 18,
    lag: 2,
    effects: { T1: 6, T2: 9 },
  },
  {
    id: "M2",
    category: "transport",
    name: "Умные светофоры",
    scope: "city",
    cost: 22,
    lag: 2,
    effects: { T1: 4, B2: 3 },
  },
  {
    id: "M3",
    category: "transport",
    name: "Линия ЛРТ / расширение",
    scope: "district",
    cost: 30,
    lag: 4,
    effects: { T1: 16, T2: 20, E2: 4 },
  },
  {
    id: "M4",
    category: "ecology",
    name: "Парк / сквер",
    scope: "district",
    cost: 15,
    lag: 2,
    effects: { E1: 12, E2: 3, B1: 2 },
  },
  {
    id: "M5",
    category: "ecology",
    name: "Перевод частного сектора на чистое топливо",
    scope: "district",
    cost: 25,
    lag: 3,
    effects: { E2: 14, C1: 4 },
  },
  {
    id: "M6",
    category: "ecology",
    name: "Городская программа озеленения и ветрозащитных полос",
    scope: "city",
    cost: 20,
    lag: 4,
    effects: { E1: 5, E2: 3 },
  },
  {
    id: "M7",
    category: "social",
    name: "Школа + детсад",
    scope: "district",
    cost: 24,
    lag: 3,
    effects: { S1: 16 },
  },
  {
    id: "M8",
    category: "social",
    name: "Центр семейного здоровья / поликлиника",
    scope: "district",
    cost: 20,
    lag: 3,
    effects: { S2: 14 },
  },
  {
    id: "M9",
    category: "social",
    name: "Дворовые спорт-хабы",
    scope: "district",
    cost: 10,
    lag: 1,
    effects: { S1: 3, S2: 3, B1: 3 },
  },
  {
    id: "M10",
    category: "safety",
    name: "Освещение и камеры",
    scope: "district",
    cost: 12,
    lag: 1,
    effects: { B1: 12, B2: 2 },
  },
  {
    id: "M11",
    category: "safety",
    name: "Безопасные переходы и школьные зоны",
    scope: "district",
    cost: 10,
    lag: 1,
    effects: { B2: 12, T1: -2 },
  },
  {
    id: "M12",
    category: "services",
    name: "Единая цифровая платформа обращений",
    scope: "city",
    cost: 14,
    lag: 1,
    effects: { C2: 5 },
  },
  {
    id: "M13",
    category: "services",
    name: "Модернизация тепло- и водосетей",
    scope: "district",
    cost: 28,
    lag: 4,
    effects: { C1: 18, E2: 2 },
  },
  {
    id: "M14",
    category: "services",
    name: "Аварийные бригады ЖКХ + раннее оповещение",
    scope: "city",
    cost: 16,
    lag: 1,
    effects: { C1: 5, C2: 2 },
  },
];
export const initiativeById = new Map(
  initiatives.map((item) => [item.id, item]),
);
export const formatNumber = (value: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value);
export const signed = (value: number) =>
  `${value > 0 ? "+" : ""}${formatNumber(value)}`;
export const spentBudget = (actions: ActionLike[]) =>
  actions.reduce(
    (sum, action) => sum + (initiativeById.get(action.initiativeId)?.cost ?? 0),
    0,
  );
interface ActionLike {
  initiativeId: string;
}
