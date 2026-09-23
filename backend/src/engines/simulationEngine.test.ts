import { describe, expect, it } from "vitest";
import { loadData } from "../data/loadData.js";
import { runSimulation } from "./simulationEngine.js";

const catalog = loadData();

const demoActions = [
  { initiativeId: "M7", districtId: "nura" },
  { initiativeId: "M8", districtId: "nura" },
  { initiativeId: "M10", districtId: "nura" },
  { initiativeId: "M12" },
  { initiativeId: "M5", districtId: "saryarka" }
];

describe("simulation engine", () => {
  it("matches the documented baseline score", () => {
    const invalid = runSimulation({ actions: [] }, catalog);
    expect(invalid.scoreBefore).toBe(52.56);
  });

  it("runs a valid scenario with lag effects and synergy", () => {
    const result = runSimulation({ actions: demoActions }, catalog);
    const nura = result.districtsAfter.find((district) => district.id === "nura");

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.scoreAfter).toBeGreaterThan(result.scoreBefore);
    expect(result.selectedActions).toHaveLength(5);
    expect(nura?.metrics.S1).toBe(48);
    expect(nura?.metrics.S2).toBe(43.75);
    expect(nura?.metrics.B1).toBe(67.5);
  });

  it("rejects duplicate, over-budget, category, scope, and conflict violations", () => {
    const result = runSimulation({
      actions: [
        { initiativeId: "M1", districtId: "yesil" },
        { initiativeId: "M1", districtId: "almaty" },
        { initiativeId: "M2" },
        { initiativeId: "M3", districtId: "nura" },
        { initiativeId: "M12", districtId: "nura" }
      ]
    }, catalog);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes("больше одного раза"))).toBe(true);
    expect(result.errors.some((error) => error.includes("M1 и M3"))).toBe(true);
    expect(result.errors.some((error) => error.includes("район указывать нельзя"))).toBe(true);
    expect(result.scoreAfter).toBeNull();
  });

  it("clamps metric values to 100", () => {
    const result = runSimulation({
      actions: [
        { initiativeId: "M3", districtId: "nura" },
        { initiativeId: "M4", districtId: "nura" },
        { initiativeId: "M8", districtId: "nura" },
        { initiativeId: "M10", districtId: "nura" },
        { initiativeId: "M14" }
      ]
    }, catalog);

    for (const district of result.districtsAfter) {
      for (const value of Object.values(district.metrics)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });
});
