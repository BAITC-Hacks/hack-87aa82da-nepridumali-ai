import { createRequire } from "node:module";
import type { Conflict, DataCatalog, District, Initiative, Synergy } from "../types/index.js";

const require = createRequire(import.meta.url);
const districtsJson = require("../../../data/districts.json") as unknown;
const initiativesJson = require("../../../data/initiatives.json") as unknown;
const synergiesJson = require("../../../data/synergies.json") as unknown;
const conflictsJson = require("../../../data/conflicts.json") as unknown;

export function loadData(): DataCatalog {
  return {
    districts: districtsJson as District[],
    initiatives: initiativesJson as Initiative[],
    synergies: synergiesJson as Synergy[],
    conflicts: conflictsJson as Conflict[]
  };
}
