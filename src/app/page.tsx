export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">AQM Impact Lab</p>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Аким на 5 часов</h1>
        <p className="mt-4 text-base text-slate-600">
          Базовый интерфейс симулятора городского бюджета.
        </p>
      </section>
    </main>
  );
}
