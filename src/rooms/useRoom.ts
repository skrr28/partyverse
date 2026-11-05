/**
 * Sincronización de una sala en tiempo real.
 *
 * - Escucha cambios de `rooms` (cada operación del servidor incrementa
 *   `rooms.version`) y, al recibir uno, pide el estado saneado con
 *   get_room_state().
 * - Si el canal cae, reintenta con espera creciente y resincroniza al volver.
 * - Al volver la app a primer plano también resincroniza.
 * - Un sondeo lento sirve de red de seguridad ante eventos perdidos.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { api } from '@/backend/api';
import { getSupabase } from '@/backend/supabase';
import { toPartyError, type PartyError } from '@/backend/errors';
import type { RoomState } from '@/backend/types';
import { backoffMs, clockOffsetMs } from '@/engine/clock';

export type Connection = 'connecting' | 'live' | 'reconnecting';

const POLL_LIVE_MS = 10_000;
const POLL_DEGRADED_MS = 3_000;

export function useRoom(roomId: string) {
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState<PartyError | null>(null);
  const [connection, setConnection] = useState<Connection>('connecting');
  const [offsetMs, setOffsetMs] = useState(0);

  const versionRef = useRef(-1);
  const inflight = useRef<Promise<void> | null>(null);
  const pending = useRef(false);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    if (inflight.current) {
      pending.current = true; // otro cambio llegó mientras pedíamos estado
      return inflight.current;
    }
    const run = async () => {
      try {
        const sent = Date.now();
        const s = await api.getRoomState(roomId);
        const received = Date.now();
        if (!alive.current) return;
        // Aproximación: el servidor respondió a mitad del viaje de ida y vuelta.
        setOffsetMs(clockOffsetMs(s.server_now, (sent + received) / 2));
        if (s.room.version !== versionRef.current || versionRef.current === -1) {
          versionRef.current = s.room.version;
          setState(s);
        }
        setError(null);
      } catch (e) {
        if (alive.current) setError(toPartyError(e));
      }
    };
    inflight.current = run().finally(() => {
      inflight.current = null;
      if (pending.current) {
        pending.current = false;
        void refresh();
      }
    });
    return inflight.current;
  }, [roomId]);

  // Canal Realtime con reconexión.
  useEffect(() => {
    alive.current = true;
    const supabase = getSupabase();
    let channel: RealtimeChannel | null = null;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      const mine: RealtimeChannel = supabase
        .channel(`room:${roomId}:${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
          const v = (payload.new as { version?: number } | null)?.version;
          if (v === undefined || v !== versionRef.current) void refresh();
        });
      channel = mine;
      mine.subscribe((status) => {
          // Ignora avisos tardíos de canales anteriores ya descartados.
          if (disposed || channel !== mine) return;
          if (status === 'SUBSCRIBED') {
            attempt = 0;
            setConnection('live');
            void refresh(); // ponerse al día tras (re)conectar
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setConnection('reconnecting');
            scheduleReconnect();
          }
        });
    };

    const scheduleReconnect = () => {
      if (disposed || retryTimer) return;
      const ch = channel;
      channel = null;
      if (ch) void supabase.removeChannel(ch);
      retryTimer = setTimeout(() => {
        retryTimer = null;
        attempt += 1;
        connect();
      }, backoffMs(attempt));
    };

    void refresh();
    connect();

    const appSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        void refresh();
        if (!channel) connect();
      }
    });

    return () => {
      disposed = true;
      alive.current = false;
      appSub.remove();
      if (retryTimer) clearTimeout(retryTimer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [roomId, refresh]);

  // Sondeo de seguridad (más rápido si la conexión está degradada o hay error).
  useEffect(() => {
    const ms = connection === 'live' && !error ? POLL_LIVE_MS : POLL_DEGRADED_MS;
    const t = setInterval(() => void refresh(), ms);
    return () => clearInterval(t);
  }, [connection, error, refresh]);

  return { state, error, connection, offsetMs, refresh };
}
