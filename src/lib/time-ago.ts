/**
 * "hace cuánto" en corto, para notificaciones y notas. Pasado el mes deja de
 * contar días y da la fecha: "47d ago" no lo lee nadie.
 *
 * `now` es parámetro para poder testearlo sin congelar el reloj.
 */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
