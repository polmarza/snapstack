// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { FeedItem } from "@/lib/db/feed-page";
import { FeedList } from "./feed-list";

/**
 * Lo que se prueba aquí es **la resincronización con el servidor**, que es lo
 * que falló al publicar la primera nota de verdad: `router.refresh()` traía la
 * página nueva, pero `useState` ignora el valor inicial en los renders
 * siguientes, así que la lista seguía mostrando lo viejo y la nota no aparecía
 * hasta recargar a mano.
 *
 * Las tarjetas se sustituyen por dobles: aquí no se está probando cómo se
 * pintan (eso es `e2e/notes.spec.ts`), sino qué lista se pinta. Además la
 * tarjeta real arrastra Clerk y IntersectionObserver, que no vienen al caso.
 */
vi.mock("./repo-card", () => ({
  RepoCard: ({ repo }: { repo: { full_name: string } }) => <li>repo:{repo.full_name}</li>,
}));
vi.mock("@/components/notes/note-card", () => ({
  NoteCard: ({ note }: { note: { body: string } }) => <li>note:{note.body}</li>,
}));

beforeAll(() => {
  // jsdom no lo trae y el centinela del scroll infinito lo usa al montar.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

const repoItem = (id: string, fullName: string): FeedItem =>
  ({ kind: "repo", at: `2026-08-31T10:00:00+00:00`, id, repo: { id, full_name: fullName } }) as unknown as FeedItem;

const noteItem = (id: string, body: string): FeedItem =>
  ({ kind: "note", at: `2026-08-31T11:00:00+00:00`, id, note: { id, body } }) as unknown as FeedItem;

describe("FeedList", () => {
  afterEach(cleanup);

  it("pinta cada ítem con el componente de su tipo", () => {
    render(
      <FeedList
        initialItems={[noteItem("n1", "arreglado el bug"), repoItem("r1", "dev/uno")]}
        initialCursor={null}
      />,
    );
    expect(screen.getByText("note:arreglado el bug")).toBeTruthy();
    expect(screen.getByText("repo:dev/uno")).toBeTruthy();
  });

  it("al publicar, la nota nueva del servidor aparece sin recargar a mano", () => {
    const antes = [repoItem("r1", "dev/uno")];
    const { rerender } = render(<FeedList initialItems={antes} initialCursor={null} />);
    expect(screen.queryByText("note:recién publicada")).toBeNull();

    // Lo que hace `router.refresh()`: el servidor vuelve a renderizar y manda
    // una primera página con la nota delante.
    rerender(
      <FeedList initialItems={[noteItem("n9", "recién publicada"), ...antes]} initialCursor={null} />,
    );
    expect(screen.getByText("note:recién publicada")).toBeTruthy();
    expect(screen.getByText("repo:dev/uno")).toBeTruthy();
  });

  it("si el servidor manda lo mismo, no se toca la lista acumulada por el scroll", () => {
    const primera = [repoItem("r1", "dev/uno")];
    const { rerender } = render(<FeedList initialItems={primera} initialCursor="cursor-1" />);

    // Simula una página ya cargada por scroll infinito, que no debe perderse
    // en un re-render que no trae nada nuevo del servidor.
    expect(screen.getByTestId("feed-sentinel")).toBeTruthy();
    rerender(<FeedList initialItems={[...primera]} initialCursor="cursor-1" />);
    expect(screen.getByText("repo:dev/uno")).toBeTruthy();
    expect(screen.getByTestId("feed-sentinel")).toBeTruthy();
  });

  it("el fin del feed sigue siendo explícito", () => {
    render(<FeedList initialItems={[repoItem("r1", "dev/uno")]} initialCursor={null} />);
    expect(screen.getByTestId("feed-end")).toBeTruthy();
  });
});
