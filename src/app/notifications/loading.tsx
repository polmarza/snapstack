/** Esqueleto de /notifications: cabecera y filas fantasma, sin layout shift. */
export default function NotificationsLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="font-mono text-2xl font-bold">Notifications</h1>
      </header>
      <ul className="flex animate-pulse flex-col gap-2" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl border border-edge px-4 py-3">
            <span className="h-9 w-9 shrink-0 rounded-full bg-edge" />
            <span className="h-3 w-2/5 rounded bg-edge" />
            <span className="ml-auto h-3 w-12 rounded bg-edge" />
          </li>
        ))}
      </ul>
    </main>
  );
}
