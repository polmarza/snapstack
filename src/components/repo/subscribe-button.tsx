"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { Bell, BellRing } from "lucide-react";
import { setSubscriptionAction } from "@/app/api/subscriptions/actions";

/**
 * Suscripción a los cambios del repo (C-06): cada push te genera una
 * notificación con enlace al diff. Toggle optimista, solo con sesión.
 */
export function SubscribeButton({ repoId, initialSubscribed }: { repoId: string; initialSubscribed: boolean }) {
  const { isSignedIn } = useAuth();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [pending, startTransition] = useTransition();

  if (!isSignedIn) return null;

  const toggle = () => {
    const next = !subscribed;
    setSubscribed(next); // optimista; se revierte si la action falla
    startTransition(async () => {
      const result = await setSubscriptionAction(repoId, next);
      if (!result.ok) setSubscribed(!next);
    });
  };

  return (
    <button
      type="button"
      data-testid="subscribe-button"
      data-subscribed={subscribed}
      onClick={toggle}
      disabled={pending}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
        subscribed
          ? "border-edge text-content-secondary hover:border-error hover:text-error"
          : "border-primary text-primary hover:bg-primary/10"
      }`}
    >
      {subscribed ? (
        <BellRing size={16} strokeWidth={1.75} aria-hidden />
      ) : (
        <Bell size={16} strokeWidth={1.75} aria-hidden />
      )}
      {subscribed ? "Subscribed to changes" : "Subscribe to changes"}
    </button>
  );
}
