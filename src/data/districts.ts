import type { District } from "../types/index.js";

export const districts: District[] = [
  {
    id: "altyn",
    nameRu: "Алтын",
    population: 240_000,
    indicators: {
      transport: 58,
      greening: 42,
      social: 55,
      safety: 61,
      services: 57
    }
  },
  {
    id: "saryarka",
    nameRu: "Сарыарка",
    population: 310_000,
    indicators: {
      transport: 49,
      greening: 47,
      social: 59,
      safety: 54,
      services: 52
    }
  },
  {
    id: "yesil",
    nameRu: "Есиль",
    population: 190_000,
    indicators: {
      transport: 64,
      greening: 55,
      social: 51,
      safety: 58,
      services: 63
    }
  },
  {
    id: "baiterek",
    nameRu: "Байтерек",
    population: 160_000,
    indicators: {
      transport: 45,
      greening: 39,
      social: 48,
      safety: 50,
      services: 46
    }
  }
];
