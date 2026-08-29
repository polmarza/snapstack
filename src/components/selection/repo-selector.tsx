"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, TriangleAlert } from "lucide-react";
import { cardBackground, languageColor, LINGUIST_COLORS } from "@/lib/card-seed";
import { CardBackgroundLayer } from "@/components/feed/card-background";
import type { PublicRepoListItem } from "@/lib/github/user-repos";
import { saveSelectionAction } from "@/app/settings/repos/actions";

interface RepoSelectorProps {
  items: PublicRepoListItem[];
  initialSelected: string[];
  limit: number;
  /** onboarding → redirige al feed al guardar; settings → se queda con mensaje. */
  mode: "onboarding" | "settings";
}

/**
 * Selector de repos (M-02/M-03). Cada fila lleva de fondo el degradado
 * procedural que tendrá su ficha — eliges viendo el resultado — y la tarjeta
 * entera es clicable. El estado elegido se marca con borde y un check limpio en
 * la esquina, no superpuesto al degradado.
 *
 * Para repos donde Linguist no detecta lenguaje (una skill en Markdown), un
 * campo con autocompletado permite fijarlo a mano; vive fuera del <label> para
 * que escribir no alterne la selección.
 */
export function RepoSelector({ items, initialSelected, limit, mode }: RepoSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [languages, setLanguages] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const atLimit = selected.size >= limit;
  const sinDescripcion = items.filter((item) => !item.description).length;

  const dirty = useMemo(() => {
    const initial = new Set(initialSelected);
    const seleccionCambiada =
      selected.size !== initial.size || [...selected].some((name) => !initial.has(name));
    const idiomaCambiado = Object.values(languages).some((l) => l && l in LINGUIST_COLORS);
    return seleccionCambiada || idiomaCambiado;
  }, [selected, initialSelected, languages]);

  const toggle = (fullName: string) => {
    setMessage(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) next.delete(fullName);
      else if (next.size < limit) next.add(fullName);
      return next;
    });
  };

  const save = () => {
    startTransition(async () => {
      const overrides = Object.fromEntries(
        Object.entries(languages).filter(([, lang]) => lang in LINGUIST_COLORS),
      );
      const result = await saveSelectionAction([...selected], overrides);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (mode === "onboarding") {
        router.push("/");
      } else {
        setMessage(`Saved: ${result.added} added, ${result.removed} removed.`);
        router.refresh();
      }
    });
  };

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between border-b border-edge bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <span data-testid="selection-counter" className="font-mono text-sm text-content-secondary">
            {selected.size} / {limit}
          </span>
          <span aria-hidden className="flex gap-1">
            {Array.from({ length: limit }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 w-4 rounded-full ${i < selected.size ? "bg-primary" : "bg-edge"}`}
              />
            ))}
          </span>
        </div>
        <button
          type="button"
          data-testid="selection-save"
          onClick={save}
          disabled={pending || !dirty}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
        >
          {pending ? "Saving…" : mode === "onboarding" ? "Import selection" : "Save changes"}
        </button>
      </div>

      {/* El aviso largo, una sola vez: las tarjetas solo señalan. */}
      {sinDescripcion > 0 ? (
        <p
          data-testid="selection-warning-banner"
          className="mb-4 flex items-start gap-2 rounded-lg border border-edge px-4 py-3 text-sm text-content-secondary"
        >
          <TriangleAlert size={16} aria-hidden className="mt-0.5 shrink-0 text-warning" />
          <span>
            {sinDescripcion === 1 ? "One repo has" : `${sinDescripcion} repos have`} no
            description — their cards will render without text. Fill in the &ldquo;About&rdquo;
            on GitHub, then save again here.
          </span>
        </p>
      ) : null}

      {message ? (
        <p data-testid="selection-message" className="mb-4 text-sm text-content-secondary">
          {message}
        </p>
      ) : null}

      <datalist id="linguist-languages">
        {Object.keys(LINGUIST_COLORS).map((language) => (
          <option key={language} value={language} />
        ))}
      </datalist>

      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const checked = selected.has(item.fullName);
          const disabled = !checked && atLimit;
          const manual = languages[item.fullName] ?? "";
          const manualValida = manual in LINGUIST_COLORS;
          const lenguajeEfectivo = item.primaryLanguage ?? (manualValida ? manual : null);
          const background = cardBackground(String(item.githubRepoId), lenguajeEfectivo);
          return (
            <li
              key={item.githubRepoId}
              data-testid="selection-item"
              className={`relative overflow-hidden rounded-xl border transition-colors ${
                checked ? "border-primary" : "border-edge"
              } ${disabled ? "opacity-40" : ""}`}
            >
              {/* El degradado procedural de la ficha, en toda la tarjeta. */}
              <div className={checked ? "opacity-45" : "opacity-20"}>
                <CardBackgroundLayer background={background} />
              </div>

              <label className={`relative block p-4 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled || pending}
                  onChange={() => toggle(item.fullName)}
                  className="sr-only"
                />
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate font-mono font-bold">{item.name}</span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-xs text-content-secondary">★ {item.stars}</span>
                    <span
                      aria-hidden
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        checked ? "border-primary bg-primary text-background" : "border-edge"
                      }`}
                    >
                      {checked ? <Check size={14} strokeWidth={3} /> : null}
                    </span>
                  </span>
                </span>
                {item.description ? (
                  <span className="mt-1 line-clamp-2 block text-sm text-content-secondary">
                    {item.description}
                  </span>
                ) : (
                  <span
                    data-testid="selection-warning-about"
                    className="mt-1 flex items-center gap-1.5 text-sm text-warning"
                  >
                    <TriangleAlert size={14} aria-hidden />
                    No description
                  </span>
                )}
                {lenguajeEfectivo ? (
                  <span className="mt-2 flex items-center gap-1.5 font-mono text-xs text-content-secondary">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: languageColor(lenguajeEfectivo) }}
                    />
                    {lenguajeEfectivo}
                    {!item.primaryLanguage && manualValida ? " (manual)" : ""}
                  </span>
                ) : null}
              </label>

              {/* Sin lenguaje detectado: fijarlo a mano. Fuera del <label> para
                  que escribir aquí no alterne la selección. */}
              {!item.primaryLanguage ? (
                <div className="relative flex items-center gap-2 px-4 pb-3">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: manualValida ? languageColor(manual) : "var(--color-edge)",
                    }}
                  />
                  <input
                    type="text"
                    list="linguist-languages"
                    value={manual}
                    disabled={pending}
                    onChange={(event) =>
                      setLanguages((prev) => ({ ...prev, [item.fullName]: event.target.value }))
                    }
                    placeholder="No language detected — set one (e.g. Markdown)"
                    data-testid="selection-language-input"
                    className="w-full max-w-xs rounded-lg border border-edge bg-background/80 px-2.5 py-1.5 font-mono text-xs placeholder:font-sans"
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
