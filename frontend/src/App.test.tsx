// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { analyze, ApiError, simulate } from "./lib/api";
import { districts } from "./lib/catalog";
import type { Action, Analysis, SimulationResult } from "./types";

vi.mock("./lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./lib/api")>()),
  simulate: vi.fn(),
  analyze: vi.fn(),
}));
vi.mock("./components/ImpactChart", () => ({
  default: () => null,
  DistrictDetail: () => null,
  ComparisonChart: () => null,
  CategoryImpactChart: () => null,
  allocation: () => [],
}));

const fallback: Analysis = {
  source: "fallback",
  executive_summary: "Резервный ответ сервера",
  key_improvements: [],
  risks: [],
  tradeoffs: [],
  strategic_recommendations: ["Рекомендация сервера"],
  suggested_next_investments: [],
};
function result(actions: Action[]): SimulationResult {
  return {
    valid: true,
    errors: [],
    scoreBefore: 52.56,
    scoreAfter: 61.23,
    delta: 8.67,
    districtsBefore: districts,
    districtsAfter: districts,
    selectedActions: actions,
    analysisData: { criticalIssueCount: 2, improvedDistrictCount: 3 },
    recommendations: ["Рекомендация сервера"],
  };
}
type User = ReturnType<typeof userEvent.setup>;
const run = () =>
  screen.getByRole("button", {
    name: "Запустить симуляцию",
  }) as HTMLButtonElement;
const selected = () =>
  screen.getByRole("complementary", { name: "Выбранные решения" });
async function add(user: User, id: string, district?: string) {
  if (district)
    await user.selectOptions(
      screen.getByRole("combobox", { name: `Район для ${id}` }),
      district,
    );
  await user.click(screen.getByRole("button", { name: `Добавить ${id}` }));
}
async function chooseValid(user: User) {
  await add(user, "M1", "nura");
  await add(user, "M4", "yesil");
  await add(user, "M7", "nura");
  await add(user, "M10", "baikonur");
  await add(user, "M12");
}
beforeEach(() => {
  vi.mocked(simulate).mockImplementation(async (actions) => result(actions));
  vi.mocked(analyze).mockResolvedValue(fallback);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("scenario editing", () => {
  it("announces a district conflict at both affected measures and blocks simulation immediately", async () => {
    const user = userEvent.setup();
    render(<App />);
    await chooseValid(user);
    const district = screen.getByRole("combobox", {
      name: "Район выбранной инициативы M4",
    });
    await user.selectOptions(district, "nura");
    expect(district.getAttribute("aria-invalid")).toBe("true");
    expect(
      screen
        .getByRole("combobox", {
          name: "Район выбранной инициативы M7",
        })
        .getAttribute("aria-invalid"),
    ).toBe("true");
    expect(
      document.getElementById(district.getAttribute("aria-describedby")!)
        ?.textContent,
    ).toContain("«Нура»");
    expect(run().disabled).toBe(true);
    expect(simulate).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole("link", { name: /Исправить выбор/ })
        .getAttribute("href"),
    ).toBe("#selected-scenario");
    await user.selectOptions(district, "yesil");
    expect(district.getAttribute("aria-invalid")).toBe("false");
    expect(run().disabled).toBe(false);
  });
  it("preserves the current measure when cancelling, and replaces atomically with the correct budget", async () => {
    const user = userEvent.setup();
    render(<App />);
    await chooseValid(user);
    const edit = screen.getByRole("button", { name: /Заменить M1:/ });
    await user.click(edit);
    const picker = screen.getByRole("combobox", {
      name: "Новая мера вместо M1",
    });
    expect(document.activeElement).toBe(picker);
    await user.selectOptions(picker, "M3");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "83",
    );
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(edit);
    expect(
      screen.queryByRole("combobox", { name: "Новая мера вместо M1" }),
    ).toBeNull();
    await user.click(edit);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Новая мера вместо M1" }),
      "M3",
    );
    await user.click(screen.getByRole("button", { name: "Применить замену" }));
    expect(within(selected()).getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByRole("button", { name: /Заменить M1:/ })).toBeNull();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "95",
    );
    expect(run().disabled).toBe(false);
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /Заменить M3:/ }),
    );
    await user.click(run());
    expect(vi.mocked(simulate).mock.calls[0][0][0]).toEqual({
      initiativeId: "M3",
      districtId: "nura",
    });
  });
  it("keeps the original selection when a replacement would exceed the budget", async () => {
    const user = userEvent.setup();
    render(<App />);
    await chooseValid(user);
    await user.click(screen.getByRole("button", { name: /Заменить M10:/ }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Новая мера вместо M10" }),
      "M3",
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Применить замену",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.getByText(/Бюджет превышен на 1\./)).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "83",
    );
  });
  it("removes a measure with a labelled control, restores keyboard focus and disables incomplete calculation", async () => {
    const user = userEvent.setup();
    render(<App />);
    await chooseValid(user);
    await user.click(screen.getByRole("button", { name: /Удалить M1:/ }));
    expect(run().disabled).toBe(true);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "65",
    );
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /Заменить M4:/ }),
    );
    for (const id of ["M4", "M7", "M10", "M12"])
      await user.click(
        screen.getByRole("button", { name: new RegExp(`Удалить ${id}:`) }),
      );
    expect(document.activeElement).toBe(
      within(selected()).getByRole("heading", { name: /Ваш сценарий/ }),
    );
  });
  it("preserves category and five-decision blocks with an accessible reason", async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, "M1", "nura");
    await add(user, "M2");
    await add(user, "M4", "yesil");
    await add(user, "M10", "baikonur");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Район для M3" }),
      "yesil",
    );
    const blocked = screen.getByRole("button", {
      name: "Добавить M3",
    }) as HTMLButtonElement;
    expect(blocked.disabled).toBe(true);
    expect(
      document.getElementById(blocked.getAttribute("aria-describedby")!)
        ?.textContent,
    ).toContain("не больше 2");
    await add(user, "M12");
    expect(
      (
        screen.getByRole("button", {
          name: "Добавить M14",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});

describe("API and analysis feedback", () => {
  it("keeps errors visible after navigating during a request and retries without losing selections", async () => {
    let rejectRequest!: (error: Error) => void;
    vi.mocked(simulate).mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectRequest = reject;
        }),
    );
    const user = userEvent.setup();
    render(<App />);
    await chooseValid(user);
    await user.click(run());
    await user.click(screen.getByRole("button", { name: /02.*Аналитика/ }));
    rejectRequest(new ApiError("Не удалось связаться с сервером."));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("выбранные меры и районы сохранены");
    await waitFor(() => expect(document.activeElement).toBe(alert));
    await user.click(screen.getByRole("button", { name: "Повторить расчёт" }));
    await screen.findByRole("heading", { name: "Город после ваших решений" });
    expect(vi.mocked(simulate).mock.calls[1][0]).toEqual(
      vi.mocked(simulate).mock.calls[0][0],
    );
    expect(vi.mocked(analyze).mock.calls[0][0]).toEqual(
      vi.mocked(simulate).mock.calls[0][0],
    );
  });
  it("only displays scores returned by simulate and explains server fallback", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText("Появится после симуляции")).toBeTruthy();
    expect(screen.queryByText("52,56")).toBeNull();
    await chooseValid(user);
    await user.click(run());
    await screen.findByText("Резервный ответ сервера");
    expect(screen.getAllByText("61,23")).toHaveLength(2);
    expect(screen.getByText(/AI-разбор временно недоступен/)).toBeTruthy();
  });
  it("keeps simulation results on analysis failure and retries only analysis", async () => {
    vi.mocked(analyze).mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();
    render(<App />);
    await chooseValid(user);
    await user.click(run());
    await screen.findByText(/AI-разбор не загрузился\./);
    expect(screen.getAllByText("61,23")).toHaveLength(2);
    vi.mocked(analyze).mockResolvedValueOnce({
      ...fallback,
      source: "openai",
      executive_summary: "Успешный повтор анализа",
    });
    await user.click(
      screen.getByRole("button", { name: "Повторить AI-анализ" }),
    );
    await screen.findByText("Успешный повтор анализа");
    expect(simulate).toHaveBeenCalledTimes(1);
    expect(analyze).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/AI-разбор временно недоступен/)).toBeNull();
  });
});
