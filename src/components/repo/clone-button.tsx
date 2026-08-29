"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copia `git clone <url>.git` al portapapeles, con confirmación efímera (C-05). */
export function CloneButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`git clone ${url}.git`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: no hay nada útil que hacer.
    }
  };

  return (
    <button
      type="button"
      data-testid="clone-button"
      onClick={copy}
      className="flex items-center gap-2 rounded-lg border border-edge px-4 py-2 text-sm font-medium text-content transition-colors hover:border-content-secondary"
    >
      {copied ? (
        <Check size={16} strokeWidth={2} aria-hidden className="text-primary" />
      ) : (
        <Copy size={16} strokeWidth={1.75} aria-hidden />
      )}
      {copied ? "Copied!" : "Clone"}
    </button>
  );
}
