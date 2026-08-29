"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction } from "@/app/settings/account/actions";

/** Zona de peligro (M-11): confirmación en dos pasos con el alcance explícito. */
export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const borrar = () => {
    startTransition(async () => {
      const result = await deleteAccountAction();
      // Si todo va bien, la action redirige y esto no llega a ejecutarse.
      if (result && !result.ok) setError(result.error);
    });
  };

  return (
    <section
      data-testid="danger-zone"
      className="rounded-xl border border-error/40 p-5"
    >
      <h2 className="font-mono text-lg font-bold text-error">Danger zone</h2>

      {!confirming ? (
        <>
          <p className="mt-2 text-sm text-content-secondary">
            Deleting your account is permanent. There is no grace period and no way back.
          </p>
          <button
            type="button"
            data-testid="delete-account"
            onClick={() => setConfirming(true)}
            className="mt-4 rounded-lg border border-error px-4 py-2 text-sm text-error hover:bg-error/10"
          >
            Delete my account
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-content-secondary">
            This will permanently delete your profile, your imported repos (they disappear
            from the feed immediately) and your activity signals. Your GitHub repos are not
            touched. This cannot be undone.
          </p>
          {error ? (
            <p data-testid="delete-error" className="mt-3 text-sm text-error">{error}</p>
          ) : null}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              data-testid="delete-account-confirm"
              onClick={borrar}
              disabled={pending}
              className="rounded-lg bg-error px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
            >
              {pending ? "Deleting…" : "Yes, delete everything"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="rounded-lg border border-edge px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </section>
  );
}
