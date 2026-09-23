import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { analysisRouter } from "./routes/analysis.js";
import { simulateRouter } from "./routes/simulate.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173" }));

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/simulate", simulateRouter);
app.use("/analysis", analysisRouter);

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
