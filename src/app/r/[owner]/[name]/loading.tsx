/** Esqueleto del detalle de repo: banner y líneas fantasma, sin layout shift. */
export default function RepoDetailLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6" aria-hidden>
      <div className="animate-pulse">
        <div className="aspect-[4/5] rounded-2xl border border-edge bg-surface sm:aspect-[1.9/1]" />
        <div className="mt-4 flex items-center justify-between">
          <span className="h-4 w-32 rounded bg-edge" />
          <span className="h-4 w-28 rounded bg-edge" />
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-edge pt-6">
          <span className="h-4 w-1/3 rounded bg-edge" />
          <span className="h-3 w-full rounded bg-edge" />
          <span className="h-3 w-5/6 rounded bg-edge" />
          <span className="h-3 w-2/3 rounded bg-edge" />
        </div>
      </div>
    </main>
  );
}
