/**
 * Piezas de carga. Cada ruta tiene su `loading.tsx`, así que al pulsar en la
 * navegación el esqueleto aparece de inmediato en vez de esperar al servidor.
 * Las medidas imitan al contenido real para que no haya salto al llegar.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}

/** Silueta de una `RepoCard`: 4:5 en móvil, 1.9:1 en desktop, más su pie. */
export function RepoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
      <div className="relative flex aspect-[4/5] flex-col justify-between p-6 sm:aspect-[1.9/1] sm:p-8">
        <Skeleton className="h-4 w-24 bg-edge" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-2/3 bg-edge" />
          <Skeleton className="h-4 w-full bg-edge" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Skeleton className="h-5 w-32 bg-edge" />
        <Skeleton className="h-5 w-28 bg-edge" />
      </div>
    </div>
  );
}

export function PageSkeleton({
  children,
  className = "mx-auto max-w-2xl px-4 py-8 sm:px-6",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main role="status" aria-label="Loading" className={className}>
      {children}
      <span className="sr-only">Loading…</span>
    </main>
  );
}
