/** Tipos del catálogo de juegos de PARTYVERSE. */

export type AmbienteId =
  | 'fiesta'
  | 'risa'
  | 'creatividad'
  | 'mente'
  | 'competencia'
  | 'conocerse'
  | 'parejas'
  | 'familiar'
  | 'adultos';

export type CategoryId =
  | 'charadas'
  | 'verdad-reto'
  | 'mas-probable'
  | 'trivia'
  | 'impostor'
  | 'palabras'
  | 'ruleta'
  | 'minijuegos'
  | 'conocerse'
  | 'parejas-familia';

/** Motor que ejecuta el juego. Varios juegos comparten motor con distinto contenido. */
export type EngineId =
  | 'prompts' // tarjetas por turnos (verdad o reto, rompehielos, trabalenguas…)
  | 'guess' // adivinar contra reloj (charadas, palabras prohibidas…)
  | 'quiz' // trivia por turnos
  | 'wheel' // ruleta
  | 'impostor' // roles secretos y votación
  | 'letter' // Basta / Stop
  | 'coin'
  | 'rps'
  | 'number'
  | 'highlow'
  | 'reflex'
  | 'memory'
  | 'online'; // partida multijugador en línea (salas)

export interface Prompt {
  text: string;
  /** Solo en verdad o reto. */
  kind?: 'verdad' | 'reto';
  /** 1 suave · 2 picante · 3 atrevido */
  level?: 1 | 2 | 3;
}

export interface GuessWord {
  word: string;
  /** Palabras prohibidas (juego «Palabras prohibidas»). */
  forbidden?: string[];
  /** Pista visible para todos (emojis, adivinanzas). */
  clue?: string;
  difficulty?: 1 | 2 | 3;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explain?: string;
  difficulty: 1 | 2 | 3;
}

export interface PromptsConfig {
  pack: Prompt[];
  /** Verdad o reto: el jugador elige el tipo antes de sacar la tarjeta. */
  truthOrDare?: boolean;
  /** Puntos por cumplir. 0 = juego sin puntos. */
  points: number;
  /** Texto del botón de cumplir. */
  doneLabel?: string;
  /** El juego permite añadir tarjetas propias. */
  allowCustom?: boolean;
  /** Niveles disponibles (verdad o reto). */
  levels?: (1 | 2 | 3)[];
}

export interface GuessConfig {
  pack: GuessWord[];
  /** perform: solo quien actúa ve la palabra · clue: todos ven la pista. */
  style: 'perform' | 'clue';
  /** Instrucción para quien actúa. */
  howTo: string;
  defaultSeconds: number;
  allowTeams: boolean;
}

export interface QuizConfig {
  pack: QuizQuestion[];
}

export interface WheelConfig {
  options: string[];
}

export interface ImpostorConfig {
  /** Categorías de palabras. Cada grupo: palabra común + palabra parecida para el impostor. */
  packs: Record<string, [string, string][]>;
}

export interface LetterConfig {
  categories: string[];
  defaultSeconds: number;
}

export type GameConfig =
  | { engine: 'prompts'; data: PromptsConfig }
  | { engine: 'guess'; data: GuessConfig }
  | { engine: 'quiz'; data: QuizConfig }
  | { engine: 'wheel'; data: WheelConfig }
  | { engine: 'impostor'; data: ImpostorConfig }
  | { engine: 'letter'; data: LetterConfig }
  | { engine: 'coin' | 'rps' | 'number' | 'highlow' | 'reflex' | 'memory'; data?: undefined }
  | { engine: 'online'; data: { mode: string } };

export interface GameDef {
  id: string;
  title: string;
  emoji: string;
  category: CategoryId;
  description: string;
  rules: string[];
  ambientes: AmbienteId[];
  minPlayers: number;
  maxPlayers: number;
  minutes: number;
  mode: 'local' | 'online';
  popular?: boolean;
  isNew?: boolean;
  adult?: boolean;
  config: GameConfig;
}

export interface UpcomingGame {
  title: string;
  emoji: string;
  category: CategoryId;
}
