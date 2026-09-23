import type { AiAnalysis } from "../app/page";

interface AnalysisPanelProps {
  analysis: AiAnalysis | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const priorityLabels = {
  high: "Высокий приоритет",
  medium: "Средний приоритет",
  low: "Низкий приоритет",
};

export default function AnalysisPanel({
  analysis,
  loading,
  error,
  onRetry,
}: AnalysisPanelProps) {
  return (
    <section
      className="surface analysis-panel"
      aria-labelledby="analysis-title"
      aria-busy={loading}
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">Объяснение сценария</span>
          <h3 id="analysis-title">Взгляд на ваши решения</h3>
        </div>
        <span className="pill">
          {loading
            ? "Подготовка…"
            : analysis?.source === "openai"
              ? "AI-анализ"
              : "Резервный анализ"}
        </span>
      </div>
      <p className="muted">
        Анализ объясняет готовые результаты. Числовые показатели рассчитывает
        симулятор.
      </p>
      {loading && (
        <p className="loading-message" role="status">
          <span className="spinner" />
          Анализируем сильные стороны и компромиссы…
        </p>
      )}
      {error && (
        <div className="notice" role="status">
          <p>{error}</p>
          <button
            type="button"
            className="text-button"
            onClick={onRetry}
            disabled={loading}
          >
            Повторить AI-анализ
          </button>
        </div>
      )}
      {analysis && (
        <>
          {analysis.source === "fallback" && (
            <p className="fallback-note">
              Показан резервный разбор без обращения к AI.
            </p>
          )}
          <p className="analysis-summary">{analysis.executive_summary}</p>
          <div className="analysis-grid">
            {(
              [
                { title: "Сильные стороны", items: analysis.strengths },
                { title: "Риски", items: analysis.risks },
                { title: "Компромиссы", items: analysis.tradeoffs },
              ] as const
            ).map(({ title, items }) => (
              <div key={title}>
                <h4>{title}</h4>
                {items.length ? (
                  <ul>
                    {items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Нет дополнительных замечаний.</p>
                )}
              </div>
            ))}
          </div>
          <h4>Рекомендации</h4>
          <div className="recommendations">
            {analysis.recommendations.map((recommendation, index) => (
              <article key={index}>
                <span className="recommendation-index">{index + 1}</span>
                <div>
                  <span className="eyebrow">
                    {priorityLabels[recommendation.priority]}
                  </span>
                  <h5>{recommendation.action}</h5>
                  <p>{recommendation.rationale}</p>
                </div>
              </article>
            ))}
          </div>
          {!!analysis.district_notes.length && (
            <>
              <h4>По районам</h4>
              <div className="district-notes">
                {analysis.district_notes.map((note, index) => (
                  <p key={index}>
                    <strong>{note.district}</strong>
                    <span>{note.note}</span>
                  </p>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
