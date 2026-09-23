import { CATEGORY_ORDER, computeAqoLS } from '@/src/lib/simulator';
import type { AiAnalysis } from '@/src/types/analysis';
import type { ScenarioResult } from '@/src/types';

export function buildFallbackAnalysis(scenario: ScenarioResult): AiAnalysis {
  const selectedCategories = scenario.selectedInitiatives.map((initiative) => initiative.category);
  const strongestCategory = Object.entries(scenario.categoryScoresAfter).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'services';
  const weakestCategory = Object.entries(scenario.categoryScoresAfter).sort((a, b) => a[1] - b[1])[0]?.[0] ?? 'transport';

  const summary =
    scenario.isValid
      ? `Выбранный сценарий удерживает бюджет в рамках лимита и повышает общее качество жизни до ${scenario.scoreAfter.toFixed(1)}.`
      : 'Сценарий невалиден: бюджет или распределение инициатив не соответствуют требованиям.';

  const strengths = scenario.selectedInitiatives.length
    ? scenario.selectedInitiatives.map((initiative) => `${initiative.titleRu} усиливает ${initiative.category} и повышает качество среды в ключевых районах.`)
    : ['Сценарий пока не содержит валидного набора инициатив.'];

  const risks = [
    `Категория ${weakestCategory} выглядит наиболее уязвимой точкой в сценарии.`,
    scenario.isValid
      ? 'Если не поддержать баланс между категориями, эффект может быть смещён в одну сторону.'
      : 'Отсутствие полного набора инициатив снижает устойчивость результата.',
  ];

  const tradeoffs = scenario.selectedInitiatives.map((initiative) => {
    const categoryLabel = initiative.category;
    return `${initiative.titleRu} даёт заметный эффект по ${categoryLabel}, но требует поддержания операционной модели и распределения ресурсов.`;
  });

  const recommendations = [
    {
      priority: 'high' as const,
      action: 'Укрепить слабое направление в сценарии.',
      rationale: `Наиболее уязвимая категория: ${weakestCategory}. Для устойчивого роста лучше добавить поддержку в этом направлении и удержать баланс по всем пяти блокам.`,
    },
    {
      priority: 'medium' as const,
      action: 'Поддержать лидирующее направление.',
      rationale: `Категория ${strongestCategory} уже показывает сильнейший результат; важно сохранить её темп и не допустить перегруза бюджета.`,
    },
    {
      priority: 'low' as const,
      action: 'Скорректировать бюджетный запас.',
      rationale: `Остаток бюджета составляет ${scenario.remainingMlnKzt.toFixed(0)} млн KZT, его лучше использовать на точечные улучшения, а не на дополнительные крупные вложения.`,
    },
  ];

  const district_notes = scenario.districtResults.map((district) => ({
    district: district.nameRu,
    note: `Район ${district.nameRu} показывает стабильный набор индикаторов; основная концентрация усилий наблюдается в ${selectedCategories.join(', ') ?? 'основных категориях'} .`,
  }));

  return {
    source: 'fallback',
    executive_summary: summary,
    strengths,
    risks,
    tradeoffs,
    recommendations,
    district_notes,
  };
}
