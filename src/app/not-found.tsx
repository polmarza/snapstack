import Link from "next/link";
import { Layers } from "lucide-react";

/**
 * 404 propia: la de Next es blanca y no tiene nada que ver con el producto.
 * La sirven tanto las rutas inexistentes como `notFound()` (un perfil que no
 * existe, por ejemplo).
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <Layers size={48} strokeWidth={1.5} aria-hidden className="text-primary" />

      <h1 className="mt-6 font-mono text-3xl font-bold lowercase">404</h1>
      <p className="mt-3 text-content-secondary">
        This page doesn&apos;t exist. The repo or profile you&apos;re after may have been
        removed, renamed, or made private on GitHub.
      </p>

      <Link
        href="/"
        className="mt-8 flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Back to the feed
      </Link>
    </main>
  );
}
