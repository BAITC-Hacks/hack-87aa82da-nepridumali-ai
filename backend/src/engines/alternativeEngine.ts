import type { ActionInput, DataCatalog, SingleReplacementAlternative } from "../types/index.js";
import { runSimulation } from "./simulationEngine.js";
import { validateActions } from "./validationEngine.js";

const MAX_ALTERNATIVES = 3;

/**
 * Returns the best valid scenarios formed by replacing exactly one selected initiative.
 */
export function findBestSingleReplacementAlternatives(
  input: unknown,
  catalog: DataCatalog
): SingleReplacementAlternative[] {
  const validation = validateActions(input, catalog);
  if (validation.errors.length > 0) {
    return [];
  }

  const selectedInitiativeIds = new Set(validation.actions.map((action) => action.initiativeId));
  const alternatives: SingleReplacementAlternative[] = [];

  for (let index = 0; index < validation.actions.length; index += 1) {
    const replacedAction = validation.actions[index];
    if (!replacedAction) {
      continue;
    }

    for (const initiative of catalog.initiatives) {
      if (selectedInitiativeIds.has(initiative.id)) {
        continue;
      }

      for (const replacementAction of replacementActionsFor(initiative.id, initiative.scope, catalog)) {
        const actions = validation.actions.map(cloneAction);
        actions[index] = replacementAction;

        const simulation = runSimulation({ actions }, catalog);
        if (!simulation.valid || simulation.scoreAfter === null || simulation.delta === null) {
          continue;
        }

        alternatives.push({
          actions: actions.map(cloneAction),
          replacedAction: cloneAction(replacedAction),
          replacementAction: cloneAction(replacementAction),
          scoreAfter: simulation.scoreAfter,
          delta: simulation.delta
        });
      }
    }
  }

  return alternatives
    .sort(compareAlternatives)
    .slice(0, MAX_ALTERNATIVES);
}

function replacementActionsFor(
  initiativeId: string,
  scope: "district" | "city",
  catalog: DataCatalog
): ActionInput[] {
  if (scope === "city") {
    return [{ initiativeId }];
  }

  return catalog.districts.map((district) => ({ initiativeId, districtId: district.id }));
}

function cloneAction(action: ActionInput): ActionInput {
  return action.districtId
    ? { initiativeId: action.initiativeId, districtId: action.districtId }
    : { initiativeId: action.initiativeId };
}

function compareAlternatives(
  left: SingleReplacementAlternative,
  right: SingleReplacementAlternative
): number {
  if (right.scoreAfter !== left.scoreAfter) {
    return right.scoreAfter - left.scoreAfter;
  }

  if (left.replacementAction.initiativeId !== right.replacementAction.initiativeId) {
    return left.replacementAction.initiativeId.localeCompare(right.replacementAction.initiativeId);
  }

  const leftDistrict = left.replacementAction.districtId ?? "";
  const rightDistrict = right.replacementAction.districtId ?? "";
  if (leftDistrict !== rightDistrict) {
    return leftDistrict.localeCompare(rightDistrict);
  }

  return left.replacedAction.initiativeId.localeCompare(right.replacedAction.initiativeId);
}
