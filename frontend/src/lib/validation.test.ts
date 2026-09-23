import { describe, expect, it } from "vitest";
import type { Action } from "../types";
import { initiatives, spentBudget } from "./catalog";
import {
  selectionBlockReason,
  selectionConflicts,
  validateActions,
} from "./validation";

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

describe("editing a selected scenario", () => {
  it("identifies both measures and the district after a district change", () => {
    const next = valid.map((action) =>
      action.initiativeId === "M4"
        ? { ...action, districtId: "nura" as const }
        : action,
    );
    expect(selectionConflicts(next)).toEqual([
      {
        initiativeIds: ["M4", "M7"],
        message: expect.stringContaining("«Нура»"),
      },
    ]);
    expect(selectionConflicts(valid)).toEqual([]);
  });
  it("checks replacements after removing the old measure and its cost", () => {
    expect(
      selectionBlockReason(
        valid,
        { initiativeId: "M3", districtId: "nura" },
        "M1",
      ),
    ).toBeNull();
    expect(spentBudget(valid)).toBe(83);
    expect(valid[0].initiativeId).toBe("M1");
  });
  it("blocks replacements that exceed budget or repeat an existing measure", () => {
    expect(
      selectionBlockReason(
        valid,
        { initiativeId: "M3", districtId: "nura" },
        "M10",
      ),
    ).toContain("Бюджет превышен");
    expect(
      selectionBlockReason(valid, { initiativeId: "M12" }, "M1"),
    ).toContain("повторяться");
  });
  it("keeps the category limit, coverage and five-decision limit", () => {
    const selection: Action[] = [
      { initiativeId: "M1", districtId: "nura" },
      { initiativeId: "M2" },
      { initiativeId: "M4", districtId: "yesil" },
      { initiativeId: "M10", districtId: "nura" },
    ];
    expect(
      selectionBlockReason(selection, {
        initiativeId: "M3",
        districtId: "yesil",
      }),
    ).toContain("не больше 2");
    expect(selectionBlockReason(valid, { initiativeId: "M14" })).toContain(
      "5 решений",
    );
    const threeCategories: Action[] = [
      ...selection.slice(0, 3),
      { initiativeId: "M6" },
      { initiativeId: "M12" },
    ];
    expect(
      selectionBlockReason(
        threeCategories,
        { initiativeId: "M5", districtId: "nura" },
        "M12",
      ),
    ).toContain("минимум 3 категории");
  });
  it("checks replacement district scope and same-district conflicts", () => {
    expect(selectionBlockReason(valid, { initiativeId: "M5" }, "M4")).toContain(
      "выберите район",
    );
    expect(
      selectionBlockReason(
        valid,
        { initiativeId: "M14", districtId: "nura" },
        "M12",
      ),
    ).toContain("не привязана");
    const selection: Action[] = [
      { initiativeId: "M5", districtId: "nura" },
      ...valid.slice(1),
    ];
    expect(
      selectionBlockReason(
        selection,
        { initiativeId: "M13", districtId: "nura" },
        "M7",
      ),
    ).toContain("M5 и M13");
  });
});
