/**
 * Estado del grupo en este dispositivo: participantes, ambiente, favoritos,
 * partidas recientes y ajustes. Se guarda en el dispositivo (localStorage en
 * web; expo-sqlite/localStorage en Android/iOS). No requiere cuenta.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import '@/backend/storage';
import type { AmbienteId } from '@/catalog/types';
import type { LocalPlayer } from './logic';

const KEY = 'partyverse.local.v1';
const EMOJIS = ['🦊', '🐼', '🦄', '🐸', '🐙', '🦁', '🐧', '🐯', '🐨', '🦖', '🐝', '🦉', '🐬', '🐢', '🦜', '🐰', '🐺', '🦩', '🐳', '🦔'];

export interface RecentPlay {
  gameId: string;
  at: number;
  players: number;
  winner?: string;
}

interface Persisted {
  players: LocalPlayer[];
  favorites: string[];
  recent: RecentPlay[];
  customWheels: { name: string; options: string[] }[];
  settings: { hideAdult: boolean };
}

const EMPTY: Persisted = { players: [], favorites: [], recent: [], customWheels: [], settings: { hideAdult: false } };

function load(): Persisted {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return EMPTY;
    const v = JSON.parse(raw) as Partial<Persisted>;
    return {
      players: Array.isArray(v.players) ? v.players : [],
      favorites: Array.isArray(v.favorites) ? v.favorites : [],
      recent: Array.isArray(v.recent) ? v.recent : [],
      customWheels: Array.isArray(v.customWheels) ? v.customWheels : [],
      settings: { hideAdult: !!v.settings?.hideAdult },
    };
  } catch {
    return EMPTY;
  }
}

function save(v: Persisted) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(v));
  } catch {
    // Sin almacenamiento (modo privado): la app sigue funcionando en memoria.
  }
}

interface PartyValue extends Persisted {
  ambiente: AmbienteId | null;
  setAmbiente: (a: AmbienteId | null) => void;
  /** Confirmación de mayoría de edad para esta sesión (no se guarda). */
  adultConfirmed: boolean;
  confirmAdult: () => void;
  addPlayer: (name: string) => { ok: boolean; reason?: string };
  removePlayer: (id: string) => void;
  clearPlayers: () => void;
  toggleFavorite: (gameId: string) => void;
  recordPlay: (p: RecentPlay) => void;
  saveWheel: (name: string, options: string[]) => void;
  deleteWheel: (name: string) => void;
  setHideAdult: (v: boolean) => void;
}

const PartyContext = createContext<PartyValue | null>(null);

export const MAX_LOCAL_PLAYERS = 20;

export function PartyProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Persisted>(load);
  const [ambiente, setAmbiente] = useState<AmbienteId | null>(null);
  const [adultConfirmed, setAdultConfirmed] = useState(false);

  useEffect(() => save(data), [data]);

  const update = useCallback((fn: (d: Persisted) => Persisted) => setData((d) => fn(d)), []);

  const addPlayer = useCallback(
    (raw: string) => {
      const name = raw.trim().replace(/\s+/g, ' ').slice(0, 16);
      if (name.length < 1) return { ok: false, reason: 'Escribe un nombre.' };
      if (data.players.length >= MAX_LOCAL_PLAYERS) return { ok: false, reason: `Máximo ${MAX_LOCAL_PLAYERS} participantes.` };
      if (data.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) return { ok: false, reason: 'Ese nombre ya está en el grupo.' };
      const used = new Set(data.players.map((p) => p.emoji));
      const emoji = EMOJIS.find((e) => !used.has(e)) ?? EMOJIS[data.players.length % EMOJIS.length];
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      update((d) => ({ ...d, players: [...d.players, { id, name, emoji }] }));
      return { ok: true };
    },
    [data.players, update],
  );

  const value = useMemo<PartyValue>(
    () => ({
      ...data,
      ambiente,
      setAmbiente,
      adultConfirmed,
      confirmAdult: () => setAdultConfirmed(true),
      addPlayer,
      removePlayer: (id) => update((d) => ({ ...d, players: d.players.filter((p) => p.id !== id) })),
      clearPlayers: () => update((d) => ({ ...d, players: [] })),
      toggleFavorite: (gameId) =>
        update((d) => ({
          ...d,
          favorites: d.favorites.includes(gameId) ? d.favorites.filter((x) => x !== gameId) : [gameId, ...d.favorites],
        })),
      recordPlay: (p) => update((d) => ({ ...d, recent: [p, ...d.recent.filter((r) => r.gameId !== p.gameId)].slice(0, 10) })),
      saveWheel: (name, options) =>
        update((d) => ({ ...d, customWheels: [{ name, options }, ...d.customWheels.filter((w) => w.name !== name)].slice(0, 12) })),
      deleteWheel: (name) => update((d) => ({ ...d, customWheels: d.customWheels.filter((w) => w.name !== name) })),
      setHideAdult: (v) => update((d) => ({ ...d, settings: { ...d.settings, hideAdult: v } })),
    }),
    [data, ambiente, adultConfirmed, addPlayer, update],
  );

  return <PartyContext.Provider value={value}>{children}</PartyContext.Provider>;
}

export function useParty(): PartyValue {
  const ctx = useContext(PartyContext);
  if (!ctx) throw new Error('useParty debe usarse dentro de <PartyProvider>');
  return ctx;
}
