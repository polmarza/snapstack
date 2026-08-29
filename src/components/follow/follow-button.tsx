"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { setFollowingAction } from "@/app/api/follows/actions";
import { trackSignal } from "@/lib/signals/tracker";

interface FollowButtonProps {
  profileId: string;
  initialFollowing: boolean;
  /** Con repo de contexto (tarjeta), seguir emite la señal follow_author (M-09). */
  signalRepoId?: string;
  size?: "sm" | "md";
  /** En el perfil: re-renderiza el servidor al alternar para refrescar los contadores. */
  refreshOnToggle?: boolean;
  /** Sin sesión: en vez de desaparecer, el botón abre el login de Clerk (detalle, C-05). */
  anonPrompt?: boolean;
}

/** Toggle Follow/Following (M-07). Solo visible con sesión. */
export function FollowButton({
  profileId,
  initialFollowing,
  signalRepoId,
  size = "md",
  refreshOnToggle = false,
  anonPrompt = false,
}: FollowButtonProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  const padding = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm";

  if (!isSignedIn) {
    if (!anonPrompt) return null;
    // Anónimo: el botón existe igual y el click abre el login (modal de Clerk).
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          data-testid="follow-button-signin"
          className={`rounded-lg border border-primary font-medium text-primary transition-colors hover:bg-primary/10 ${padding}`}
        >
          Follow
        </button>
      </SignInButton>
    );
  }

  const toggle = () => {
    const next = !following;
    setFollowing(next); // optimista; se revierte si la action falla
    startTransition(async () => {
      const result = await setFollowingAction(profileId, next);
      if (!result.ok) {
        setFollowing(!next);
        return;
      }
      if (next && signalRepoId) trackSignal({ repoId: signalRepoId, type: "follow_author" });
      if (refreshOnToggle) router.refresh();
    });
  };

  return (
    <button
      type="button"
      data-testid="follow-button"
      data-following={following}
      onClick={toggle}
      disabled={pending}
      className={`rounded-lg border font-medium transition-colors disabled:opacity-40 ${padding} ${
        following
          ? "border-edge text-content-secondary hover:border-error hover:text-error"
          : "border-primary text-primary hover:bg-primary/10"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
