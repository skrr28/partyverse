import type { GameDef } from '@/catalog/types';
import type { LocalPlayer, LocalResult } from '../logic';

/** Contrato común de los motores de juego local. */
export interface EngineProps {
  game: GameDef;
  players: LocalPlayer[];
  onFinish: (result: LocalResult) => void;
}
