import { z } from "zod";
import type { ActionInput, DataCatalog, DistrictId, SelectedAction } from "../types/index.js";

export const TOTAL_BUDGET = 100;

const actionSchema = z.object({
  initiativeId: z.string().min(1),
  districtId: z.enum(["yesil", "almaty", "saryarka", "baikonur", "nura"]).optional()
});

const requestSchema = z.object({
  actions: z.array(actionSchema)
});

export interface ValidationResult {
  actions: ActionInput[];
  selectedActions: SelectedAction[];
  errors: string[];
  totalCost: number;
}

export function validateActions(input: unknown, catalog: DataCatalog): ValidationResult {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      actions: [],
      selectedActions: [],
      errors: ["Неверный формат запроса."],
      totalCost: 0
    };
  }

  const actions = parsed.data.actions;
  const errors: string[] = [];
  const selectedActions: SelectedAction[] = [];
  const initiativeById = new Map(catalog.initiatives.map((initiative) => [initiative.id, initiative]));
  const districtIds = new Set(catalog.districts.map((district) => district.id));

  if (actions.length !== 5) {
    errors.push("Нужно выбрать ровно 5 мероприятий.");
  }

  const duplicateIds = findDuplicates(actions.map((action) => action.initiativeId));
  for (const duplicateId of duplicateIds) {
    errors.push(`Мероприятие ${duplicateId} выбрано больше одного раза.`);
  }

  for (const action of actions) {
    const initiative = initiativeById.get(action.initiativeId);
    if (!initiative) {
      errors.push(`Мероприятие ${action.initiativeId} не найдено.`);
      continue;
    }

    if (initiative.scope === "district" && !action.districtId) {
      errors.push(`Для мероприятия ${initiative.id} нужно выбрать район.`);
    }
    if (initiative.scope === "city" && action.districtId) {
      errors.push(`Для городского мероприятия ${initiative.id} район указывать нельзя.`);
    }
    if (action.districtId && !districtIds.has(action.districtId)) {
      errors.push(`Район ${action.districtId} не найден.`);
    }

    selectedActions.push(action.districtId
      ? { initiative, districtId: action.districtId as DistrictId }
      : { initiative });
  }

  const totalCost = selectedActions.reduce((sum, action) => sum + action.initiative.cost, 0);
  if (totalCost > TOTAL_BUDGET) {
    errors.push(`Бюджет превышен: ${totalCost} из ${TOTAL_BUDGET}.`);
  }

  const categoryCounts = new Map<string, number>();
  for (const selectedAction of selectedActions) {
    categoryCounts.set(
      selectedAction.initiative.category,
      (categoryCounts.get(selectedAction.initiative.category) ?? 0) + 1
    );
  }

  for (const [category, count] of categoryCounts) {
    if (count > 2) {
      errors.push(`В направлении ${category} выбрано больше 2 мероприятий.`);
    }
  }

  if (categoryCounts.size < 3 && selectedActions.length > 0) {
    errors.push("Сценарий должен затрагивать минимум 3 направления.");
  }

  for (const conflict of catalog.conflicts) {
    const [firstId, secondId] = conflict.initiativeIds;
    const firstActions = selectedActions.filter((action) => action.initiative.id === firstId);
    const secondActions = selectedActions.filter((action) => action.initiative.id === secondId);
    if (firstActions.length === 0 || secondActions.length === 0) {
      continue;
    }

    if (conflict.scope === "global") {
      errors.push(conflict.message);
      continue;
    }

    if (firstActions.some((first) => secondActions.some((second) => first.districtId === second.districtId))) {
      errors.push(conflict.message);
    }
  }

  return {
    actions: actions.map((action) => action.districtId
      ? { initiativeId: action.initiativeId, districtId: action.districtId as DistrictId }
      : { initiativeId: action.initiativeId }),
    selectedActions,
    errors,
    totalCost
  };
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return [...duplicates];
}
