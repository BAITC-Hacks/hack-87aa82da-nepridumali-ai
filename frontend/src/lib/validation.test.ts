import { describe, expect, it } from "vitest";
import type { Action } from "../types";
import { initiatives, spentBudget } from "./catalog";
import { validateActions } from "./validation";

const valid: Action[] = [
  { initiativeId: "M1", districtId: "nura" },
  { initiativeId: "M4", districtId: "yesil" },
  { initiativeId: "M7", districtId: "nura" },
  { initiativeId: "M10", districtId: "baikonur" },
  { initiativeId: "M12" },
];

describe("client selection feedback", () => {
  it("accepts five actions across categories and omits district for city scope", () => {
    expect(validateActions(valid)).toEqual([]);
    expect(spentBudget(valid)).toBe(83);
    expect(initiatives).toHaveLength(14);
  });
  it("allows two initiatives in a category when at least three categories are represented", () => {
    expect(
      validateActions([
        { initiativeId: "M1", districtId: "yesil" },
        { initiativeId: "M2" },
        { initiativeId: "M4", districtId: "yesil" },
        { initiativeId: "M10", districtId: "yesil" },
        { initiativeId: "M12" },
      ]),
    ).toEqual([]);
  });
  it("accepts the exact budget boundary", () => {
    const actions: Action[] = [
      { initiativeId: "M3", districtId: "nura" },
      { initiativeId: "M4", districtId: "yesil" },
      { initiativeId: "M5", districtId: "nura" },
      { initiativeId: "M11", districtId: "yesil" },
      { initiativeId: "M8", districtId: "nura" },
    ];
    expect(spentBudget(actions)).toBe(100);
    expect(validateActions(actions)).toEqual([]);
  });
  it("rejects over-budget selections", () => {
    expect(
      validateActions([
        { initiativeId: "M3", districtId: "nura" },
        { initiativeId: "M5", districtId: "nura" },
        { initiativeId: "M7", districtId: "nura" },
        { initiativeId: "M10", districtId: "nura" },
        { initiativeId: "M13", districtId: "yesil" },
      ]).join(" "),
    ).toContain("Бюджет превышен");
  });
  it("rejects global and same-district conflicts", () => {
    expect(
      validateActions([
        { initiativeId: "M1", districtId: "yesil" },
        { initiativeId: "M3", districtId: "nura" },
        ...valid.slice(2),
      ]).join(" "),
    ).toContain("M1 и M3");
    expect(
      validateActions(
        valid.map((action) =>
          action.initiativeId === "M4"
            ? { ...action, districtId: "nura" }
            : action,
        ),
      ).join(" "),
    ).toContain("M4 и M7");
    expect(
      validateActions([
        { initiativeId: "M5", districtId: "nura" },
        { initiativeId: "M13", districtId: "nura" },
        ...valid.slice(2),
      ]).join(" "),
    ).toContain("M5 и M13");
  });
  it("validates count, duplicate, category coverage and category limit", () => {
    expect(validateActions(valid.slice(0, 4)).join(" ")).toContain("ровно 5");
    expect(
      validateActions([valid[0], valid[0], ...valid.slice(2)]).join(" "),
    ).toContain("повторяться");
    const actions: Action[] = [
      { initiativeId: "M1", districtId: "yesil" },
      { initiativeId: "M2" },
      { initiativeId: "M3", districtId: "nura" },
      { initiativeId: "M4", districtId: "yesil" },
      { initiativeId: "M5", districtId: "nura" },
    ];
    expect(validateActions(actions).join(" ")).toContain("минимум 3 категории");
    expect(validateActions(actions).join(" ")).toContain("не больше 2");
  });
  it("rejects unknown initiatives and wrong district scope", () => {
    expect(
      validateActions([{ initiativeId: "M99" }, ...valid.slice(1)]).join(" "),
    ).toContain("Неизвестная инициатива");
    expect(
      validateActions([{ initiativeId: "M1" }, ...valid.slice(1)]).join(" "),
    ).toContain("выберите район");
    expect(
      validateActions([
        ...valid.slice(0, 4),
        { initiativeId: "M12", districtId: "nura" },
      ]).join(" "),
    ).toContain("не привязана");
  });
});
