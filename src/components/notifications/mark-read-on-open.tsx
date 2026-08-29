"use client";

import { useEffect, useRef } from "react";
import { markNotificationsReadAction } from "@/app/notifications/actions";

/** Evento cliente que pone a cero el badge de la nav sin re-render del servidor. */
export const NOTIFICATIONS_READ_EVENT = "snapstack:notifications-read";

/**
 * Marca todo leído al abrir la página (C-04). No refresca el árbol del
 * servidor a propósito: así el resaltado de "no leída" sigue visible mientras
 * lees, y el badge baja a cero por el evento (la nav vive en el layout, que no
 * se re-renderiza al navegar). Solo actúa si había no leídas.
 */
export function MarkReadOnOpen({ hadUnread }: { hadUnread: boolean }) {
  const done = useRef(false);

  useEffect(() => {
    if (!hadUnread || done.current) return;
    done.current = true;
    void markNotificationsReadAction().then(() => {
      window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
    });
  }, [hadUnread]);

  return null;
}
