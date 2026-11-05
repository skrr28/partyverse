import type { ComponentType } from 'react';
import type { RoomState } from '@/backend/types';

/** Contrato que cumple cada minijuego para conectarse al motor de partidas. */
export interface MinigameProps {
  state: RoomState;
  offsetMs: number;
  voteLeftMs: number;
  revealLeftMs: number;
  /** Fuerza una resincronización tras una acción. */
  refresh: () => void;
}

export interface MinigameDef {
  mode: string;
  title: string;
  tagline: string;
  Component: ComponentType<MinigameProps>;
}
