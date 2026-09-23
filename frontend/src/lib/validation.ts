import {
  categories,
  districts,
  initiativeById,
  spentBudget,
  TOTAL_BUDGET,
} from "./catalog";
import type { Action } from "../types";

// Client-side form feedback only. /simulate remains the authoritative validator.
export function validateActions(actions: Action[]): string[] {
  const errors: string[] = [];
  if (actions.length !== 5)
    errors.push(`Нужно ровно 5 решений. Сейчас: ${actions.length}.`);
  if (spentBudget(actions) > TOTAL_BUDGET)
    errors.push(
      `Бюджет превышен на ${spentBudget(actions) - TOTAL_BUDGET}. Удалите или замените инициативу.`,
    );
  if (
    new Set(actions.map((action) => action.initiativeId)).size !==
    actions.length
  )
    errors.push("Одна инициатива не может повторяться.");
  const represented = new Set<string>();
  for (const action of actions) {
    const initiative = initiativeById.get(action.initiativeId);
    if (!initiative) {
      errors.push(`Неизвестная инициатива: ${action.initiativeId}.`);
      continue;
    }
    represented.add(initiative.category);
    if (
      initiative.scope === "district" &&
      !districts.some((district) => district.id === action.districtId)
    )
      errors.push(`${initiative.id}: выберите район.`);
    if (initiative.scope === "city" && action.districtId !== undefined)
      errors.push(
        `${initiative.id}: общегородская инициатива не привязана к району.`,
      );
  }
  if (represented.size < 3) errors.push("Нужно охватить минимум 3 категории.");
  for (const category of categories) {
    if (
      actions.filter(
        (action) =>
          initiativeById.get(action.initiativeId)?.category === category.id,
      ).length > 2
    )
      errors.push(`${category.name}: можно выбрать не больше 2 инициатив.`);
  }
  if (
    actions.some((action) => action.initiativeId === "M1") &&
    actions.some((action) => action.initiativeId === "M3")
  )
    errors.push("M1 и M3 несовместимы в любых районах.");
  for (const [left, right] of [
    ["M4", "M7"],
    ["M5", "M13"],
  ]) {
    const first = actions.find((action) => action.initiativeId === left);
    const second = actions.find((action) => action.initiativeId === right);
    if (first?.districtId && first.districtId === second?.districtId)
      errors.push(`${left} и ${right} несовместимы в одном районе.`);
  }
  return errors;
}
