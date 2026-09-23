import type { District } from '@/src/types';

export const districts: District[] = [
  {
    id: 'altyn',
    nameRu: 'Алтын',
    population: 220000,
    indicators: {
      transport: 61,
      greening: 52,
      social: 63,
      safety: 59,
      services: 64,
    },
  },
  {
    id: 'saryarka',
    nameRu: 'Сарыарка',
    population: 300000,
    indicators: {
      transport: 55,
      greening: 49,
      social: 58,
      safety: 57,
      services: 60,
    },
  },
  {
    id: 'yesil',
    nameRu: 'Есиль',
    population: 260000,
    indicators: {
      transport: 72,
      greening: 69,
      social: 71,
      safety: 70,
      services: 68,
    },
  },
  {
    id: 'baiterek',
    nameRu: 'Байтерек',
    population: 180000,
    indicators: {
      transport: 64,
      greening: 61,
      social: 66,
      safety: 62,
      services: 65,
    },
  },
];
