"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfileAction, type SaveProfileResult } from "@/app/settings/account/profile-actions";
import {
  BIO_MAX_LENGTH,
  SOCIAL_PLATFORM_KEYS,
  SOCIAL_PLATFORMS,
  TAGLINE_MAX_LENGTH,
  type SocialLinks,
  type SocialPlatformKey,
} from "@/lib/profile/social-links";

interface ProfileFormProps {
  initialTagline: string;
  initialBio: string;
  initialLinks: SocialLinks;
}

/**
 * Formulario del perfil público (C-03): tagline, bio y enlaces sociales. La
 * validación de verdad es la del servidor; aquí solo límites de longitud y los
 * errores por campo que devuelve la action.
 */
export function ProfileForm({ initialTagline, initialBio, initialLinks }: ProfileFormProps) {
  const router = useRouter();
  const [tagline, setTagline] = useState(initialTagline);
  const [bio, setBio] = useState(initialBio);
  const [links, setLinks] = useState<Record<SocialPlatformKey, string>>(() => {
    const base = {} as Record<SocialPlatformKey, string>;
    for (const key of SOCIAL_PLATFORM_KEYS) base[key] = initialLinks[key] ?? "";
    return base;
  });
  const [result, setResult] = useState<SaveProfileResult | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const outcome = await saveProfileAction(tagline, bio, links);
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  };

  const inputClass =
    "w-full rounded-lg border border-edge bg-background px-3 py-2 text-sm placeholder:text-content-secondary/60";

  return (
    <section data-testid="profile-form" className="mb-10">
      <h2 className="font-mono text-lg font-bold">Public profile</h2>
      <p className="mt-1 text-sm text-content-secondary">
        Shown on your profile page. Everything is optional — clear a field to remove it.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <label className="block">
          <span className="mb-1 flex items-baseline justify-between text-sm">
            Tagline
            <span className="font-mono text-xs text-content-secondary">
              {tagline.length}/{TAGLINE_MAX_LENGTH}
            </span>
          </span>
          <input
            type="text"
            value={tagline}
            maxLength={TAGLINE_MAX_LENGTH}
            disabled={pending}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Building tools for developers."
            data-testid="profile-tagline-input"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1 flex items-baseline justify-between text-sm">
            Bio
            <span className="font-mono text-xs text-content-secondary">
              {bio.length}/{BIO_MAX_LENGTH}
            </span>
          </span>
          <textarea
            value={bio}
            maxLength={BIO_MAX_LENGTH}
            rows={3}
            disabled={pending}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A little more about what you build and why."
            data-testid="profile-bio-input"
            className={`${inputClass} resize-y`}
          />
        </label>

        <fieldset>
          <legend className="mb-2 text-sm">Links</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SOCIAL_PLATFORM_KEYS.map((key) => (
              <label key={key} className="block">
                <span className="mb-1 block font-mono text-xs text-content-secondary">
                  {SOCIAL_PLATFORMS[key].label}
                </span>
                <input
                  type="url"
                  value={links[key]}
                  disabled={pending}
                  onChange={(e) => setLinks((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={SOCIAL_PLATFORMS[key].placeholder}
                  data-testid={`profile-link-${key}`}
                  className={inputClass}
                />
                {result?.linkErrors[key] ? (
                  <span className="mt-1 block text-xs text-error">{result.linkErrors[key]}</span>
                ) : null}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="profile-save"
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save profile"}
          </button>
          {result ? (
            <p
              data-testid="profile-save-message"
              className={`text-sm ${result.ok ? "text-content-secondary" : "text-error"}`}
            >
              {result.ok ? "Saved." : result.error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
