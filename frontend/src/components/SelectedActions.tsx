import { useEffect, useRef, useState } from "react";
import {
  districts,
  initiativeById,
  initiatives,
  spentBudget,
} from "../lib/catalog";
import { selectionBlockReason, selectionConflicts } from "../lib/validation";
import type { Action, DistrictId } from "../types";

interface Props {
  actions: Action[];
  onChange: (actions: Action[], announcement: string) => void;
}

export default function SelectedActions({ actions, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replacementId, setReplacementId] = useState("");
  const [replacementDistrict, setReplacementDistrict] = useState<
    DistrictId | ""
  >("");
  const heading = useRef<HTMLHeadingElement>(null);
  const replacementSelect = useRef<HTMLSelectElement>(null);
  const editButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);
  const conflicts = selectionConflicts(actions);
  const replacement = initiativeById.get(replacementId);
  const candidate: Action =
    replacement?.scope === "district"
      ? {
          initiativeId: replacementId,
          districtId: replacementDistrict || undefined,
        }
      : { initiativeId: replacementId };
  const replacementReason =
    editingId && replacement
      ? selectionBlockReason(actions, candidate, editingId)
      : "Выберите новую меру. Текущая останется в сценарии до подтверждения.";

  useEffect(() => {
    if (editingId) replacementSelect.current?.focus();
  }, [editingId]);
  useEffect(() => {
    if (
      editingId &&
      !actions.some((action) => action.initiativeId === editingId)
    )
      setEditingId(null);
  }, [actions, editingId]);
  useEffect(() => {
    if (pendingFocus.current !== null) {
      (
        editButtons.current.get(pendingFocus.current) ?? heading.current
      )?.focus();
      pendingFocus.current = null;
    }
  }, [actions]);

  function openReplacement(action: Action) {
    setEditingId(action.initiativeId);
    setReplacementId("");
    setReplacementDistrict(action.districtId ?? "");
  }

  function cancelReplacement() {
    if (editingId) editButtons.current.get(editingId)?.focus();
    setEditingId(null);
  }

  function applyReplacement() {
    if (!editingId || !replacement || replacementReason) return;
    const next = actions.map((action) =>
      action.initiativeId === editingId ? candidate : action,
    );
    pendingFocus.current = candidate.initiativeId;
    setEditingId(null);
    onChange(
      next,
      `${editingId} заменена на ${candidate.initiativeId}. Бюджет: ${spentBudget(next)} из 100.`,
    );
  }

  return (
    <>
      <h3 ref={heading} tabIndex={-1}>
        Ваш сценарий <span>{actions.length} / 5</span>
      </h3>
      {actions.length ? (
        <ol className="selected-list">
          {actions.map((action, index) => {
            const initiative = initiativeById.get(action.initiativeId)!;
            const messages = conflicts.filter((conflict) =>
              conflict.initiativeIds.includes(action.initiativeId),
            );
            const conflictId = `${initiative.id}-conflict`;
            return (
              <li
                key={initiative.id}
                className={messages.length ? "has-conflict" : ""}
                aria-labelledby={`${initiative.id}-selected-title`}
              >
                <div className="selected-item-title">
                  <span className="mini-id">{initiative.id}</span>
                  <strong id={`${initiative.id}-selected-title`}>
                    {initiative.name}
                  </strong>
                </div>
                <div className="selected-item-meta">
                  <span>{initiative.cost} из бюджета</span>
                  {initiative.scope === "district" ? (
                    <label>
                      <span className="sr-only">
                        Район выбранной инициативы {initiative.id}
                      </span>
                      <select
                        aria-label={`Район выбранной инициативы ${initiative.id}`}
                        aria-invalid={messages.length > 0}
                        aria-describedby={
                          messages.length ? conflictId : undefined
                        }
                        value={action.districtId ?? ""}
                        onChange={(event) => {
                          const districtId = event.target.value as DistrictId;
                          const next = actions.map((item) =>
                            item.initiativeId === initiative.id
                              ? { ...item, districtId }
                              : item,
                          );
                          setEditingId(null);
                          const nextConflicts = selectionConflicts(next).filter(
                            (conflict) =>
                              conflict.initiativeIds.includes(initiative.id),
                          );
                          onChange(
                            next,
                            nextConflicts.length
                              ? nextConflicts
                                  .map((conflict) => conflict.message)
                                  .join(" ")
                              : `Район меры ${initiative.id} изменён. Конфликтов для этой меры нет.`,
                          );
                        }}
                      >
                        {districts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <span>Весь город</span>
                  )}
                </div>
                {messages.length > 0 && (
                  <p id={conflictId} className="action-conflict">
                    {messages.map((conflict) => conflict.message).join(" ")}
                  </p>
                )}
                <div className="selected-action-controls">
                  <button
                    type="button"
                    className="button secondary"
                    ref={(element) => {
                      if (element)
                        editButtons.current.set(initiative.id, element);
                      else editButtons.current.delete(initiative.id);
                    }}
                    aria-label={`Заменить ${initiative.id}: ${initiative.name}`}
                    aria-expanded={editingId === initiative.id}
                    aria-controls={
                      editingId === initiative.id
                        ? `${initiative.id}-replacement`
                        : undefined
                    }
                    onClick={() =>
                      editingId === initiative.id
                        ? cancelReplacement()
                        : openReplacement(action)
                    }
                  >
                    Заменить
                  </button>
                  <button
                    type="button"
                    className="button remove-action"
                    aria-label={`Удалить ${initiative.id}: ${initiative.name}`}
                    onClick={() => {
                      const next = actions.filter(
                        (item) => item.initiativeId !== initiative.id,
                      );
                      pendingFocus.current =
                        next[Math.min(index, next.length - 1)]?.initiativeId ??
                        "";
                      setEditingId(null);
                      onChange(
                        next,
                        `Мера ${initiative.id} удалена. Осталось решений: ${next.length} из 5.`,
                      );
                    }}
                  >
                    Удалить
                  </button>
                </div>
                {editingId === initiative.id && (
                  <div
                    className="replacement-editor"
                    id={`${initiative.id}-replacement`}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        cancelReplacement();
                      }
                    }}
                  >
                    <label className="field-label">
                      Новая мера вместо {initiative.id}
                      <select
                        ref={replacementSelect}
                        aria-label={`Новая мера вместо ${initiative.id}`}
                        value={replacementId}
                        aria-describedby={`${initiative.id}-replacement-help`}
                        onChange={(event) =>
                          setReplacementId(event.target.value)
                        }
                      >
                        <option value="">Выберите меру</option>
                        {initiatives
                          .filter(
                            (item) =>
                              !actions.some(
                                (selected) => selected.initiativeId === item.id,
                              ),
                          )
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.id} · {item.name} · {item.cost}
                            </option>
                          ))}
                      </select>
                    </label>
                    {replacement?.scope === "district" && (
                      <label className="field-label">
                        Район новой меры
                        <select
                          aria-label="Район новой меры"
                          value={replacementDistrict}
                          aria-describedby={`${initiative.id}-replacement-help`}
                          aria-invalid={!!replacementReason}
                          onChange={(event) =>
                            setReplacementDistrict(
                              event.target.value as DistrictId | "",
                            )
                          }
                        >
                          <option value="">Выберите район</option>
                          {districts.map((district) => (
                            <option key={district.id} value={district.id}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <p
                      id={`${initiative.id}-replacement-help`}
                      className={
                        replacementReason && replacement
                          ? "action-conflict"
                          : "replacement-help"
                      }
                      role="status"
                    >
                      {replacementReason ??
                        `После замены: ${spentBudget(actions.map((item) => (item.initiativeId === editingId ? candidate : item)))} из 100. Количество решений сохранится.`}
                    </p>
                    <div className="selected-action-controls">
                      <button
                        type="button"
                        className="button primary"
                        disabled={!!replacementReason}
                        onClick={applyReplacement}
                      >
                        Применить замену
                      </button>
                      <button
                        type="button"
                        className="button secondary"
                        onClick={cancelReplacement}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="selection-empty">
          Добавьте инициативы из каталога. Для районных проектов сначала
          выберите район.
        </p>
      )}
    </>
  );
}
