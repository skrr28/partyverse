/**
 * Reloj de partida sincronizado con el servidor. Los plazos los fija el
 * servidor; el cliente corrige la diferencia entre su reloj y el del servidor.
 */

/** Desfase (ms) a sumar al reloj local para aproximar la hora del servidor. */
export function clockOffsetMs(serverNowIso: string, localReceivedAt: number): number {
  const server = Date.parse(serverNowIso);
  return Number.isFinite(server) ? server - localReceivedAt : 0;
}

export function msUntil(targetIso: string | null | undefined, offsetMs: number, localNow: number = Date.now()): number {
  if (!targetIso) return 0;
  const t = Date.parse(targetIso);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, t - (localNow + offsetMs));
}

export function secondsLeft(targetIso: string | null | undefined, offsetMs: number, localNow?: number): number {
  return Math.ceil(msUntil(targetIso, offsetMs, localNow) / 1000);
}

export function addSeconds(iso: string | null | undefined, seconds: number): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t + seconds * 1000).toISOString() : null;
}

/** Espera para el siguiente intento de reconexión: 1 s, 2 s, 4 s… hasta 15 s. */
export function backoffMs(attempt: number): number {
  return Math.min(15_000, 1000 * 2 ** Math.max(0, attempt));
}
