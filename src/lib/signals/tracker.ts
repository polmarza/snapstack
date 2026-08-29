"use client";

/**
 * Emisión de señales desde el cliente (M-09). Regla de FLOW-02: nunca bloquea
 * la UI y cualquier fallo es silencioso.
 *
 * - expand / click_repo → fire-and-forget inmediato (keepalive).
 * - dwell → se acumula por tarjeta y se envía al salir del viewport; lo pendiente
 *   se vacía en pagehide con sendBeacon (sobrevive a cerrar la pestaña).
 */

import { dwellValue, type SignalEvent } from "./events";

const ENDPOINT = "/api/signals";

function send(events: SignalEvent[], useBeacon = false): void {
  if (events.length === 0) return;
  try {
    const body = JSON.stringify(events);
    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Silencio: el registro jamás es un error para el usuario.
  }
}

export function trackSignal(event: SignalEvent): void {
  send([event]);
}

/** Permanencias en curso y pendientes de enviar, por repo. */
const dwellStart = new Map<string, number>();
const dwellPending = new Map<string, number>();
let pagehideHookInstalled = false;

function flushDwellPending(useBeacon: boolean): void {
  const events: SignalEvent[] = [];
  for (const [repoId, total] of dwellPending) {
    const value = dwellValue(total);
    if (value !== null) events.push({ repoId, type: "dwell", value });
  }
  dwellPending.clear();
  send(events, useBeacon);
}

function installPagehideHook(): void {
  if (pagehideHookInstalled || typeof window === "undefined") return;
  pagehideHookInstalled = true;
  window.addEventListener("pagehide", () => {
    // Cierra los tramos aún visibles y vacía todo con beacon.
    for (const [repoId, start] of dwellStart) {
      dwellPending.set(repoId, (dwellPending.get(repoId) ?? 0) + (performance.now() - start));
    }
    dwellStart.clear();
    flushDwellPending(true);
  });
}

export function dwellEnter(repoId: string): void {
  installPagehideHook();
  if (!dwellStart.has(repoId)) dwellStart.set(repoId, performance.now());
}

export function dwellLeave(repoId: string): void {
  const start = dwellStart.get(repoId);
  if (start === undefined) return;
  dwellStart.delete(repoId);
  const total = (dwellPending.get(repoId) ?? 0) + (performance.now() - start);
  const value = dwellValue(total);
  if (value === null) {
    // Aún bajo el umbral: se acumula por si la tarjeta vuelve a entrar.
    dwellPending.set(repoId, total);
    return;
  }
  dwellPending.delete(repoId);
  send([{ repoId, type: "dwell", value }]);
}
