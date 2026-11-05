/**
 * Motor de partida en el cliente: no decide nada, solo PIDE al servidor que
 * cierre la ronda vencida o que avance tras la revelación. El servidor valida
 * cada petición (plazos, anfitrión, idempotencia).
 */
import { useEffect, useRef, useState } from 'react';
import { api } from '@/backend/api';
import type { RoomState } from '@/backend/types';
import { addSeconds, msUntil } from './clock';

const RETRY_MS = 1500;

export function useCountdown(targetIso: string | null | undefined, offsetMs: number): number {
  const [left, setLeft] = useState(() => msUntil(targetIso, offsetMs));
  useEffect(() => {
    setLeft(msUntil(targetIso, offsetMs));
    if (!targetIso) return;
    const t = setInterval(() => setLeft(msUntil(targetIso, offsetMs)), 250);
    return () => clearInterval(t);
  }, [targetIso, offsetMs]);
  return left;
}

export function useRoundDriver(state: RoomState | null, offsetMs: number, onChange: () => void) {
  const round = state?.round;
  const room = state?.room;
  const busy = useRef(false);

  // Hora a la que se puede avanzar automáticamente tras la revelación.
  const revealEnds = round?.phase === 'reveal' ? addSeconds(round.revealed_at, room?.reveal_seconds ?? 12) : null;

  const voteLeft = useCountdown(round?.phase === 'voting' ? round.deadline : null, offsetMs);
  const revealLeft = useCountdown(revealEnds, offsetMs);

  // Cierre por tiempo (con 2 s de margen, igual que el servidor).
  useEffect(() => {
    if (room?.status !== 'playing' || round?.phase !== 'voting' || voteLeft > 0) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const attempt = async () => {
      if (cancelled || busy.current) return;
      busy.current = true;
      try {
        const r = await api.closeRound(round.id);
        if (r !== 'not_ready') onChange();
        else timer = setTimeout(attempt, RETRY_MS);
      } catch {
        timer = setTimeout(attempt, RETRY_MS * 2);
      } finally {
        busy.current = false;
      }
    };
    timer = setTimeout(attempt, 2200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [room?.status, round?.id, round?.phase, voteLeft === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Avance automático cuando acaba la revelación (por si el anfitrión no pulsa).
  useEffect(() => {
    if (room?.status !== 'playing' || round?.phase !== 'reveal' || revealLeft > 0 || !room) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    // Pequeño desfase aleatorio para no saturar al servidor con todos a la vez.
    const attempt = async () => {
      if (cancelled || busy.current) return;
      busy.current = true;
      try {
        const r = await api.nextRound(room.id, room.current_round);
        if (r === 'not_ready') timer = setTimeout(attempt, RETRY_MS);
        else onChange();
      } catch {
        timer = setTimeout(attempt, RETRY_MS * 2);
      } finally {
        busy.current = false;
      }
    };
    timer = setTimeout(attempt, 300 + Math.random() * 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [room?.status, room?.current_round, round?.phase, revealLeft === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  return { voteLeftMs: voteLeft, revealLeftMs: revealLeft };
}
