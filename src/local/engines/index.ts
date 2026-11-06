import type { ComponentType } from 'react';
import type { EngineId } from '@/catalog/types';
import type { EngineProps } from './types';
import { PromptsEngine } from './PromptsEngine';
import { GuessEngine } from './GuessEngine';
import { QuizEngine } from './QuizEngine';
import { WheelEngine } from './WheelEngine';
import { ImpostorEngine } from './ImpostorEngine';
import { LetterEngine } from './LetterEngine';
import { CoinEngine, HighLowEngine, MemoryEngine, NumberEngine, ReflexEngine, RpsEngine } from './MiniGames';

/** Motor que ejecuta cada tipo de juego local. */
export const ENGINES: Partial<Record<EngineId, ComponentType<EngineProps>>> = {
  prompts: PromptsEngine,
  guess: GuessEngine,
  quiz: QuizEngine,
  wheel: WheelEngine,
  impostor: ImpostorEngine,
  letter: LetterEngine,
  coin: CoinEngine,
  rps: RpsEngine,
  number: NumberEngine,
  highlow: HighLowEngine,
  reflex: ReflexEngine,
  memory: MemoryEngine,
};
