import type { Initiative } from "../types/index.js";

export const initiatives: Initiative[] = [
  {
    id: "transport-brt-corridor",
    category: "transport",
    titleRu: "BRT-коридор на загруженных направлениях",
    descriptionRu: "Выделенные полосы, приоритет на перекрестках и обновленные остановки.",
    costMlnKzt: 260,
    effects: {
      altyn: { transport: 8, services: 2 },
      saryarka: { transport: 10 },
      yesil: { transport: 5 },
      baiterek: { transport: 7 }
    },
    tradeoffRu: "Во время работ возможны временные заторы и перенос парковочных мест.",
    horizonRu: "Среднесрочный эффект"
  },
  {
    id: "transport-bike-grid",
    category: "transport",
    titleRu: "Связанная сеть веломаршрутов",
    descriptionRu: "Безопасные велополосы между жилыми кварталами, школами и пересадочными узлами.",
    costMlnKzt: 145,
    effects: {
      altyn: { transport: 4, greening: 1 },
      saryarka: { transport: 5, safety: 1 },
      yesil: { transport: 4 },
      baiterek: { transport: 4, greening: 1 }
    },
    tradeoffRu: "Потребуется переразметка части улиц и настройка зимнего обслуживания.",
    horizonRu: "Краткосрочный эффект"
  },
  {
    id: "transport-express-buses",
    category: "transport",
    titleRu: "Экспресс-автобусы между районами",
    descriptionRu: "Маршруты с меньшим числом остановок и синхронизацией с пересадочными узлами.",
    costMlnKzt: 220,
    effects: {
      altyn: { transport: 6 },
      saryarka: { transport: 8, services: 1 },
      yesil: { transport: 6 },
      baiterek: { transport: 6, safety: 1 }
    },
    tradeoffRu: "Часть локальных поездок потребует пересадки на районные маршруты.",
    horizonRu: "Среднесрочный эффект"
  },
  {
    id: "greening-courtyard-shade",
    category: "greening",
    titleRu: "Теневые дворы и зеленые карманы",
    descriptionRu: "Деревья, дождевые сады и малые зоны отдыха в плотных жилых кварталах.",
    costMlnKzt: 170,
    effects: {
      altyn: { greening: 8, social: 2 },
      saryarka: { greening: 7 },
      yesil: { greening: 4 },
      baiterek: { greening: 9, safety: 1 }
    },
    tradeoffRu: "Эффект зависит от ухода за посадками в первые сезоны.",
    horizonRu: "Среднесрочный эффект"
  },
  {
    id: "greening-river-park",
    category: "greening",
    titleRu: "Линейный парк у водного маршрута",
    descriptionRu: "Непрерывная прогулочная зона с освещением, озеленением и площадками.",
    costMlnKzt: 230,
    effects: {
      altyn: { greening: 5 },
      saryarka: { greening: 5, social: 2 },
      yesil: { greening: 8, safety: 1 },
      baiterek: { greening: 4 }
    },
    tradeoffRu: "Высокая капитальная стоимость снижает гибкость бюджета для других категорий.",
    horizonRu: "Долгосрочный эффект"
  },
  {
    id: "greening-school-yards",
    category: "greening",
    titleRu: "Зеленые школьные дворы",
    descriptionRu: "Озеленение школьных территорий с открытым доступом для жителей после уроков.",
    costMlnKzt: 140,
    effects: {
      altyn: { greening: 5, social: 2 },
      saryarka: { greening: 6, social: 2 },
      yesil: { greening: 3 },
      baiterek: { greening: 7, social: 2 }
    },
    tradeoffRu: "Нужно согласовать режим доступа и безопасность школьных территорий.",
    horizonRu: "Краткосрочный эффект"
  },
  {
    id: "social-school-hubs",
    category: "social",
    titleRu: "Школьные общественные хабы",
    descriptionRu: "Вечерние кружки, спорт и консультационные сервисы на базе школ.",
    costMlnKzt: 210,
    effects: {
      altyn: { social: 6, safety: 1 },
      saryarka: { social: 8 },
      yesil: { social: 5 },
      baiterek: { social: 9, services: 1 }
    },
    tradeoffRu: "Нужна координация расписаний и операционных расходов после запуска.",
    horizonRu: "Среднесрочный эффект"
  },
  {
    id: "social-mobile-clinics",
    category: "social",
    titleRu: "Мобильные социально-медицинские кабинеты",
    descriptionRu: "Выездные профилактические услуги для удаленных и перегруженных кварталов.",
    costMlnKzt: 160,
    effects: {
      altyn: { social: 4 },
      saryarka: { social: 5, services: 1 },
      yesil: { social: 3 },
      baiterek: { social: 7 }
    },
    tradeoffRu: "Потребуются стабильные маршруты и кадровое покрытие.",
    horizonRu: "Краткосрочный эффект"
  },
  {
    id: "social-youth-skills",
    category: "social",
    titleRu: "Молодежные центры навыков",
    descriptionRu: "Короткие программы проектной работы, профориентации и цифровых навыков.",
    costMlnKzt: 190,
    effects: {
      altyn: { social: 5 },
      saryarka: { social: 6 },
      yesil: { social: 4, services: 1 },
      baiterek: { social: 8, safety: 1 }
    },
    tradeoffRu: "Для устойчивого эффекта нужны наставники и партнерства с работодателями.",
    horizonRu: "Среднесрочный эффект"
  },
  {
    id: "safety-smart-crossings",
    category: "safety",
    titleRu: "Безопасные переходы у школ и остановок",
    descriptionRu: "Освещение, островки безопасности, камеры скорости и понятная навигация.",
    costMlnKzt: 150,
    effects: {
      altyn: { safety: 5, transport: 1 },
      saryarka: { safety: 7 },
      yesil: { safety: 5 },
      baiterek: { safety: 6, transport: 1 }
    },
    tradeoffRu: "Часть улиц потребует снижения скорости и перераспределения полос.",
    horizonRu: "Краткосрочный эффект"
  },
  {
    id: "safety-neighborhood-lighting",
    category: "safety",
    titleRu: "Освещение дворов и пешеходных связей",
    descriptionRu: "Энергоэффективные фонари в темных проходах, дворах и остановочных зонах.",
    costMlnKzt: 120,
    effects: {
      altyn: { safety: 4, services: 1 },
      saryarka: { safety: 5 },
      yesil: { safety: 4 },
      baiterek: { safety: 7 }
    },
    tradeoffRu: "Нужен план обслуживания и мониторинга неисправностей.",
    horizonRu: "Краткосрочный эффект"
  },
  {
    id: "safety-community-response",
    category: "safety",
    titleRu: "Районные команды быстрого реагирования",
    descriptionRu: "Координация служб, дворовых обходов и профилактики мелких рисков.",
    costMlnKzt: 175,
    effects: {
      altyn: { safety: 5, services: 1 },
      saryarka: { safety: 6 },
      yesil: { safety: 4 },
      baiterek: { safety: 8, social: 1 }
    },
    tradeoffRu: "Эффект зависит от качества межведомственной координации.",
    horizonRu: "Среднесрочный эффект"
  },
  {
    id: "services-one-stop-app",
    category: "services",
    titleRu: "Единое приложение городских заявок",
    descriptionRu: "Заявки на благоустройство, трекинг статусов и аналитика повторяющихся проблем.",
    costMlnKzt: 130,
    effects: {
      altyn: { services: 6 },
      saryarka: { services: 6 },
      yesil: { services: 5 },
      baiterek: { services: 5, safety: 1 }
    },
    tradeoffRu: "Нужна дисциплина обработки заявок, иначе доверие жителей снизится.",
    horizonRu: "Краткосрочный эффект"
  },
  {
    id: "services-waste-routing",
    category: "services",
    titleRu: "Умная маршрутизация коммунальных служб",
    descriptionRu: "Оптимизация вывоза отходов, уборки и реагирования на сезонные пики.",
    costMlnKzt: 180,
    effects: {
      altyn: { services: 5 },
      saryarka: { services: 7 },
      yesil: { services: 4, transport: 1 },
      baiterek: { services: 6 }
    },
    tradeoffRu: "Потребуется обучение подрядчиков и качественные операционные данные.",
    horizonRu: "Среднесрочный эффект"
  },
  {
    id: "services-digital-dispatch",
    category: "services",
    titleRu: "Цифровая диспетчеризация дворовых работ",
    descriptionRu: "Единый график уборки, ремонта и сезонных работ с контролем исполнения.",
    costMlnKzt: 220,
    effects: {
      altyn: { services: 12 },
      saryarka: { services: 14 },
      yesil: { services: 45 },
      baiterek: { services: 15, safety: 2 }
    },
    tradeoffRu: "Высокий эффект требует дисциплины подрядчиков и прозрачной отчетности.",
    horizonRu: "Среднесрочный эффект"
  }
];
