"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { reportRepoAction } from "@/app/api/reports/actions";

/**
 * Reporte de una ficha (S-01). Solo visible con sesión; un reporte por usuario
 * y repo (los duplicados se ignoran en servidor).
 */
export function ReportButton({ repoId }: { repoId: string }) {
  const { isSignedIn } = useAuth();
  const [state, setState] = useState<"idle" | "form" | "done">("idle");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isSignedIn) return null;

  if (state === "done") {
    return (
      <p data-testid="report-done" className="text-xs text-content-secondary">
        Reported — thanks, we&apos;ll take a look.
      </p>
    );
  }

  if (state === "idle") {
    return (
      <button
        type="button"
        data-testid="report-button"
        onClick={() => setState("form")}
        className="text-xs text-content-secondary hover:text-error"
      >
        Report this repo
      </button>
    );
  }

  return (
    <form
      data-testid="report-form"
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await reportRepoAction(repoId, reason);
          if (result.ok) setState("done");
          else setError(result.error);
        });
      }}
    >
      <input
        type="text"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="What's wrong with this repo?"
        maxLength={500}
        className="min-w-0 flex-1 rounded-lg border border-edge bg-background px-3 py-1.5 text-xs"
      />
      <button
        type="submit"
        disabled={pending || !reason.trim()}
        className="rounded-lg border border-error px-3 py-1.5 text-xs text-error hover:bg-error/10 disabled:opacity-40"
      >
        {pending ? "Sending…" : "Report"}
      </button>
      <button
        type="button"
        onClick={() => setState("idle")}
        className="text-xs text-content-secondary"
      >
        Cancel
      </button>
      {error ? <span className="w-full text-xs text-error">{error}</span> : null}
    </form>
  );
}
