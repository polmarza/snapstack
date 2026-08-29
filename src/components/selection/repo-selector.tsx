"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cardBackground, languageColor } from "@/lib/card-seed";
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

export function RepoSelector({ items, initialSelected, limit, mode }: RepoSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const atLimit = selected.size >= limit;
  const dirty = useMemo(() => {
    const initial = new Set(initialSelected);
    return selected.size !== initial.size || [...selected].some((name) => !initial.has(name));
  }, [selected, initialSelected]);

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
      const result = await saveSelectionAction([...selected]);
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

      {message ? (
        <p data-testid="selection-message" className="mb-4 text-sm text-content-secondary">
          {message}
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const checked = selected.has(item.fullName);
          const disabled = !checked && atLimit;
          const background = cardBackground(String(item.githubRepoId), item.primaryLanguage);
          return (
            <li key={item.githubRepoId}>
              <label
                data-testid="selection-item"
                className={`flex cursor-pointer items-center gap-4 rounded-xl border p-3 transition-colors sm:p-4 ${
                  checked ? "border-primary bg-surface" : "border-edge"
                } ${disabled ? "cursor-not-allowed opacity-40" : "hover:border-content-secondary"}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled || pending}
                  onChange={() => toggle(item.fullName)}
                  className="sr-only"
                />
                {/* Miniatura: el mismo fondo determinista que tendrá su ficha */}
                <span
                  aria-hidden
                  className={`relative block h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                    checked ? "border-primary" : "border-edge"
                  }`}
                >
                  <CardBackgroundLayer background={background} />
                  {checked ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 font-mono text-lg text-primary">
                      ✓
                    </span>
                  ) : null}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-mono font-medium">{item.name}</span>
                    <span className="shrink-0 font-mono text-xs text-content-secondary">★ {item.stars}</span>
                  </span>
                  {item.description ? (
                    <span className="mt-1 line-clamp-2 block text-sm text-content-secondary">
                      {item.description}
                    </span>
                  ) : (
                    <span
                      data-testid="selection-warning-about"
                      className="mt-1 block text-sm text-warning"
                    >
                      ⚠ No description — the card will render without text. Fill in the repo&apos;s
                      “About” on GitHub, then save it again here.
                    </span>
                  )}
                  <span className="mt-2 flex items-center gap-1.5 font-mono text-xs text-content-secondary">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: languageColor(item.primaryLanguage) }}
                    />
                    {item.primaryLanguage ?? "no language detected"}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
