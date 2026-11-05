import type { MinigameDef } from './types';
import { MostLikelyGame } from './most-likely/MostLikelyGame';

/** Registro de minijuegos. Batalla relámpago, ¿Cuánto me conoces?… se añadirán aquí. */
export const MINIGAMES: Record<string, MinigameDef> = {
  most_likely: {
    mode: 'most_likely',
    title: '¿Quién es más probable?',
    tagline: 'Vota en secreto. Revela a la vez. Acierta con la mayoría.',
    Component: MostLikelyGame,
  },
};

export function minigameFor(mode: string): MinigameDef | undefined {
  return MINIGAMES[mode];
}
