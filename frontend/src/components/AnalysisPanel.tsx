import type { Analysis } from "../types";

export default function AnalysisPanel({
  analysis,
  loading,
  error,
  onRetry,
}: {
  analysis: Analysis | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const sections = analysis
    ? ([
        ["Ключевые улучшения", analysis.key_improvements],
        ["Риски", analysis.risks],
        ["Компромиссы", analysis.tradeoffs],
        ["Стратегические рекомендации", analysis.strategic_recommendations],
        ["Следующие инвестиции", analysis.suggested_next_investments],
      ] as const)
    : [];
  return (
    <section
      className="panel analysis-panel"
      aria-labelledby="analysis-title"
      aria-busy={loading}
    >
      <div className="row">
        <div>
          <span className="eyebrow">Urban Development Strategic Advisor</span>
          <h2 id="analysis-title">Стратегический разбор</h2>
        </div>
        <span className="tag">
          {loading
            ? "Подготовка"
            : analysis?.source === "openai"
              ? "OpenAI"
              : "Резервный режим"}
        </span>
      </div>
      <p className="muted">
        AI объясняет готовые результаты и рекомендации сервера. Числа не
        пересчитываются.
      </p>
      {loading && (
        <p className="loading" role="status">
          <span className="spinner" />
          Готовим стратегический разбор…
        </p>
      )}
      {error && (
        <p className="notice warning" role="status">
          {error}
        </p>
      )}
      {analysis?.source === "fallback" && (
        <div className="row fallback-status">
          <span role="status">
            AI-разбор временно недоступен. Показан резервный разбор: оценка и
            показатели рассчитаны симулятором и остаются действительными.
          </span>
          <button
            type="button"
            className="text-button"
            disabled={loading}
            onClick={onRetry}
          >
            Повторить AI-анализ
          </button>
        </div>
      )}
      {analysis && (
        <>
          <p className="executive-summary">{analysis.executive_summary}</p>
          <div className="analysis-grid">
            {sections.map(([title, items]) => (
              <section key={title}>
                <h3>{title}</h3>
                {items.length ? (
                  <ul>
                    {items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">
                    В ответе сервера нет дополнительных сведений.
                  </p>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
