import {
  categories,
  districts,
  initiativeById,
  spentBudget,
  TOTAL_BUDGET,
} from "./catalog";
import type { Action } from "../types";

export interface SelectionConflict {
  initiativeIds: [string, string];
  message: string;
}

export function selectionConflicts(actions: Action[]): SelectionConflict[] {
  const conflicts: SelectionConflict[] = [];
  if (
    actions.some((action) => action.initiativeId === "M1") &&
    actions.some((action) => action.initiativeId === "M3")
  ) {
    conflicts.push({
      initiativeIds: ["M1", "M3"],
      message:
        "M1 и M3 несовместимы в любых районах. Замените или удалите одну из этих мер.",
    });
  }
  for (const [left, right] of [
    ["M4", "M7"],
    ["M5", "M13"],
  ] as const) {
    const first = actions.find((action) => action.initiativeId === left);
    const second = actions.find((action) => action.initiativeId === right);
    if (first?.districtId && first.districtId === second?.districtId) {
      const district = districts.find(
        (item) => item.id === first.districtId,
      )?.name;
      conflicts.push({
        initiativeIds: [left, right],
        message: `${left} и ${right} несовместимы в районе «${district}». Выберите другой район, замените или удалите одну из мер.`,
      });
    }
  }
  return conflicts;
}

// Client-side form feedback only. /simulate remains the authoritative validator.
export function validateActions(
  actions: Action[],
  requireComplete = true,
): string[] {
  const errors: string[] = [];
  if ((requireComplete && actions.length !== 5) || actions.length > 5)
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
  if (requireComplete && represented.size < 3)
    errors.push("Нужно охватить минимум 3 категории.");
  for (const category of categories) {
    if (
      actions.filter(
        (action) =>
          initiativeById.get(action.initiativeId)?.category === category.id,
      ).length > 2
    )
      errors.push(`${category.name}: можно выбрать не больше 2 инициатив.`);
  }
  errors.push(
    ...selectionConflicts(actions).map((conflict) => conflict.message),
  );
  return errors;
}

export function selectionBlockReason(
  actions: Action[],
  candidate: Action,
  replacingId?: string,
): string | null {
  if (
    replacingId &&
    !actions.some((action) => action.initiativeId === replacingId)
  )
    return "Заменяемая мера уже удалена. Выберите её заново.";
  if (!replacingId && actions.length >= 5)
    return "Уже выбрано 5 решений. Замените или удалите меру в вашем сценарии.";
  const next = replacingId
    ? actions.map((action) =>
        action.initiativeId === replacingId ? candidate : action,
      )
    : [...actions, candidate];
  return validateActions(next, next.length === 5)[0] ?? null;
}
