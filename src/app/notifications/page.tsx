import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { BellOff, GitCommitHorizontal, PencilLine } from "lucide-react";
import { MarkReadOnOpen } from "@/components/notifications/mark-read-on-open";
import { timeAgo } from "@/lib/time-ago";
import { createServiceClient } from "@/lib/db/client";
import {
  listNotifications,
  type NewNotePayload,
  type NotificationWithActor,
  type RepoUpdatePayload,
} from "@/lib/db/notifications";
import { getProfileByClerkId } from "@/lib/db/profiles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Notifications · snapstack" };

/** Push en un repo suscrito (C-06): enlace al repo y al diff en GitHub. */
function RepoUpdateNotification({ n }: { n: NotificationWithActor }) {
  const payload = n.payload as unknown as RepoUpdatePayload;
  const unread = n.read_at === null;
  return (
    <li
      data-testid="notification-item"
      data-unread={unread}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        unread ? "border-primary/40 bg-primary/5" : "border-edge"
      }`}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge text-content-secondary"
      >
        <GitCommitHorizontal size={18} strokeWidth={1.75} />
      </span>
      <p className="min-w-0 flex-1 text-sm">
        <Link href={`/r/${payload.full_name}`} className="font-medium hover:underline">
          {payload.full_name}
        </Link>{" "}
        <span className="text-content-secondary">
          was updated — {payload.commits} new {payload.commits === 1 ? "commit" : "commits"} ·
        </span>{" "}
        <a
          href={payload.compare}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="notification-compare-link"
          className="text-primary hover:underline"
        >
          see the changes ↗
        </a>
      </p>
      <span className="flex shrink-0 items-center gap-2">
        <time className="font-mono text-xs text-content-secondary">{timeAgo(n.created_at)}</time>
        {unread ? <span aria-hidden className="h-2 w-2 rounded-full bg-primary" /> : null}
      </span>
    </li>
  );
}

/** Nota nueva en un repo suscrito (C-09): quién, dónde y el recorte. */
function NewNoteNotification({ n }: { n: NotificationWithActor }) {
  const payload = n.payload as unknown as NewNotePayload;
  const name = n.actor?.display_name ?? n.actor?.username ?? "Someone";
  const unread = n.read_at === null;
  return (
    <li
      data-testid="notification-item"
      data-unread={unread}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
        unread ? "border-primary/40 bg-primary/5" : "border-edge"
      }`}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge text-content-secondary"
      >
        <PencilLine size={18} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          {n.actor ? (
            <Link href={`/u/${n.actor.username}`} className="font-medium hover:underline">
              {name}
            </Link>
          ) : (
            <span className="font-medium">{name}</span>
          )}{" "}
          <span className="text-content-secondary">wrote a note about</span>{" "}
          <Link href={`/r/${payload.full_name}`} className="font-medium hover:underline">
            {payload.full_name}
          </Link>
        </p>
        {/* El recorte se pinta como texto: es lo que escribió otra persona. */}
        <p className="mt-1 break-words text-sm text-content-secondary">{payload.excerpt}</p>
      </div>
      <span className="flex shrink-0 items-center gap-2">
        <time className="font-mono text-xs text-content-secondary">{timeAgo(n.created_at)}</time>
        {unread ? <span aria-hidden className="h-2 w-2 rounded-full bg-primary" /> : null}
      </span>
    </li>
  );
}

function FollowNotification({ n }: { n: NotificationWithActor }) {
  const name = n.actor?.display_name ?? n.actor?.username ?? "Someone";
  const unread = n.read_at === null;
  return (
    <li
      data-testid="notification-item"
      data-unread={unread}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        unread ? "border-primary/40 bg-primary/5" : "border-edge"
      }`}
    >
      {n.actor?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar de GitHub, sin optimización
        <img
          src={n.actor.avatar_url}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-full border border-edge"
        />
      ) : (
        <span aria-hidden className="h-9 w-9 shrink-0 rounded-full border border-edge" />
      )}
      <p className="min-w-0 flex-1 text-sm">
        {n.actor ? (
          <Link href={`/u/${n.actor.username}`} className="font-medium hover:underline">
            {name}
          </Link>
        ) : (
          <span className="font-medium">{name}</span>
        )}{" "}
        <span className="text-content-secondary">followed you</span>
      </p>
      <span className="flex shrink-0 items-center gap-2">
        <time className="font-mono text-xs text-content-secondary">{timeAgo(n.created_at)}</time>
        {unread ? <span aria-hidden className="h-2 w-2 rounded-full bg-primary" /> : null}
      </span>
    </li>
  );
}

export default async function NotificationsPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const db = createServiceClient();
  const profile = await getProfileByClerkId(db, user.id);
  if (!profile) redirect("/");

  const notifications = await listNotifications(db, profile.id);
  const hadUnread = notifications.some((n) => n.read_at === null);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <MarkReadOnOpen hadUnread={hadUnread} />

      <header className="mb-6">
        <h1 className="font-mono text-2xl font-bold">Notifications</h1>
      </header>

      {notifications.length === 0 ? (
        <div
          data-testid="notifications-empty"
          className="flex flex-col items-center gap-3 rounded-xl border border-edge px-6 py-12 text-center"
        >
          <BellOff aria-hidden size={22} className="text-content-secondary" />
          <p className="text-sm text-content-secondary">
            Nothing yet. When someone follows you, it shows up here.
          </p>
        </div>
      ) : (
        <ul data-testid="notifications-list" className="flex flex-col gap-2">
          {notifications.map((n) =>
            n.type === "repo_update" ? (
              <RepoUpdateNotification key={n.id} n={n} />
            ) : n.type === "new_note" ? (
              <NewNoteNotification key={n.id} n={n} />
            ) : (
              <FollowNotification key={n.id} n={n} />
            ),
          )}
        </ul>
      )}
    </main>
  );
}
