/**
 * Lógica pura de los juegos locales (sin React). Todo lo aleatorio recibe un
 * generador `rng` para poder probarse de forma determinista.
 */

export type Rng = () => number;

export interface LocalPlayer {
  id: string;
  name: string;
  emoji: string;
}

export type Scores = Record<string, number>;

export interface PlayerStats {
  done: number;
  skipped: number;
  correct: number;
  best?: number; // mejor marca (ms de reflejos, racha, nivel de memoria…)
}

export interface LocalResult {
  scores: Scores;
  stats: Record<string, PlayerStats>;
  /** Equipos (solo si se jugó por equipos): nombre → ids. */
  teams?: { name: string; ids: string[]; score: number }[];
  /** Texto final específico del juego (p. ej. quién era el impostor). */
  summary?: string;
}

/** Fisher–Yates. Devuelve una copia. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Baraja que no repite cartas hasta agotarlas; luego vuelve a barajar. */
export class Deck<T> {
  private queue: T[] = [];
  private readonly items: readonly T[];
  private readonly rng: Rng;
  constructor(items: readonly T[], rng: Rng = Math.random) {
    if (items.length === 0) throw new Error('Deck vacío');
    this.items = items;
    this.rng = rng;
  }
  draw(): T {
    if (this.queue.length === 0) this.queue = shuffle(this.items, this.rng);
    return this.queue.pop() as T;
  }
  get remaining() {
    return this.queue.length;
  }
}

export function emptyStats(players: readonly LocalPlayer[]): Record<string, PlayerStats> {
  return Object.fromEntries(players.map((p) => [p.id, { done: 0, skipped: 0, correct: 0 }]));
}

export function zeroScores(players: readonly LocalPlayer[]): Scores {
  return Object.fromEntries(players.map((p) => [p.id, 0]));
}

export function addPoints(scores: Scores, id: string, pts: number): Scores {
  return { ...scores, [id]: (scores[id] ?? 0) + pts };
}

/** Orden de turnos: ronda r, posición i → jugador. */
export function turnPlayer<T>(players: readonly T[], turn: number): T {
  return players[turn % players.length];
}

/** Reparte jugadores en N equipos equilibrados (orden aleatorio). */
export function makeTeams(players: readonly LocalPlayer[], count: number, rng: Rng = Math.random) {
  const names = ['Equipo Violeta', 'Equipo Cian', 'Equipo Rosa', 'Equipo Azul'];
  const shuffled = shuffle(players, rng);
  const teams = Array.from({ length: count }, (_, i) => ({ name: names[i] ?? `Equipo ${i + 1}`, ids: [] as string[] }));
  shuffled.forEach((p, i) => teams[i % count].ids.push(p.id));
  return teams;
}

// ─────────── Trivia ───────────
export const QUIZ_SECONDS = 20;
export function quizPoints(correct: boolean, msLeft: number, totalMs = QUIZ_SECONDS * 1000): number {
  if (!correct) return 0;
  const ratio = Math.max(0, Math.min(1, msLeft / totalMs));
  return 100 + Math.round(50 * ratio);
}

// ─────────── Ruleta ───────────
export function pickIndex(n: number, rng: Rng = Math.random): number {
  if (n <= 0) throw new Error('Ruleta sin opciones');
  return Math.min(n - 1, Math.floor(rng() * n));
}

/**
 * Rotación final (grados, sentido horario) para que el segmento `index` quede
 * bajo el puntero superior. El segmento i ocupa [i·s, (i+1)·s) desde arriba.
 */
export function wheelTarget(currentDeg: number, index: number, n: number, spins = 5, jitter = 0.5): number {
  const seg = 360 / n;
  const center = index * seg + seg * (0.5 + (jitter - 0.5) * 0.6);
  const base = Math.ceil(currentDeg / 360) * 360 + spins * 360;
  return base + (360 - center);
}

/** Qué segmento queda bajo el puntero con una rotación dada. */
export function wheelIndexAt(rotationDeg: number, n: number): number {
  const seg = 360 / n;
  const a = ((360 - (rotationDeg % 360)) % 360 + 360) % 360;
  return Math.floor(a / seg) % n;
}

// ─────────── Impostor ───────────
export function maxImpostors(players: number): number {
  return Math.max(1, Math.floor((players - 1) / 2));
}

export function assignImpostors(ids: readonly string[], count: number, rng: Rng = Math.random): string[] {
  const c = Math.max(1, Math.min(count, maxImpostors(ids.length)));
  return shuffle(ids, rng).slice(0, c);
}

/** Recuento de votos: devuelve los más votados (varios si hay empate). */
export function tallyVotes(votes: Record<string, string>): { counts: Record<string, number>; top: string[] } {
  const counts: Record<string, number> = {};
  for (const target of Object.values(votes)) counts[target] = (counts[target] ?? 0) + 1;
  const max = Math.max(0, ...Object.values(counts));
  const top = max === 0 ? [] : Object.keys(counts).filter((k) => counts[k] === max).sort();
  return { counts, top };
}

export interface ImpostorOutcome {
  expelled: string | null;
  crewWins: boolean;
  points: Scores;
}

/**
 * Resultado de la votación. Si hay empate se expulsa a nadie (el impostor
 * escapa). Puntos: tripulación 100 si expulsa a un impostor; impostores 200
 * si escapan; un impostor expulsado que adivina la palabra roba 150.
 */
export function resolveImpostor(
  ids: readonly string[],
  impostors: readonly string[],
  votes: Record<string, string>,
  impostorGuessedWord = false,
): ImpostorOutcome {
  const { top } = tallyVotes(votes);
  const expelled = top.length === 1 ? top[0] : null;
  const caught = expelled !== null && impostors.includes(expelled);
  const points: Scores = Object.fromEntries(ids.map((id) => [id, 0]));
  if (caught) {
    for (const id of ids) if (!impostors.includes(id)) points[id] += 100;
    if (impostorGuessedWord) points[expelled!] += 150;
  } else {
    for (const id of impostors) points[id] += 200;
  }
  return { expelled, crewWins: caught, points };
}

// ─────────── Piedra, papel o tijera ───────────
export type Rps = 'piedra' | 'papel' | 'tijera';
export function rpsWinner(a: Rps, b: Rps): 'a' | 'b' | 'empate' {
  if (a === b) return 'empate';
  const beats: Record<Rps, Rps> = { piedra: 'tijera', papel: 'piedra', tijera: 'papel' };
  return beats[a] === b ? 'a' : 'b';
}

// ─────────── Adivina el número ───────────
export function numberHint(secret: number, guess: number): 'mayor' | 'menor' | 'correcto' {
  if (guess === secret) return 'correcto';
  return secret > guess ? 'mayor' : 'menor';
}

// ─────────── Mayor o menor ───────────
export const CARD_LABELS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export function drawCard(rng: Rng = Math.random): number {
  return 1 + Math.floor(rng() * 13);
}
/** Un empate cuenta como acierto para no castigar al jugador. */
export function highLowCorrect(prev: number, next: number, guess: 'mayor' | 'menor'): boolean {
  if (next === prev) return true;
  return guess === 'mayor' ? next > prev : next < prev;
}

// ─────────── Basta ───────────
export function randomLetter(letters: readonly string[], used: readonly string[], rng: Rng = Math.random): string {
  const pool = letters.filter((l) => !used.includes(l));
  const from = pool.length ? pool : letters;
  return from[Math.floor(rng() * from.length)];
}

// ─────────── Clasificación y reconocimientos ───────────
export function ranking(players: readonly LocalPlayer[], scores: Scores) {
  const sorted = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0) || a.name.localeCompare(b.name));
  return sorted.map((p, i) => {
    let rank = i + 1;
    while (rank > 1 && (scores[sorted[rank - 2].id] ?? 0) === (scores[p.id] ?? 0)) rank--;
    return { rank, player: p, score: scores[p.id] ?? 0 };
  });
}

export interface Award {
  emoji: string;
  title: string;
  playerIds: string[];
}

export function awards(players: readonly LocalPlayer[], result: LocalResult): Award[] {
  const out: Award[] = [];
  const pick = (value: (id: string) => number, emoji: string, title: string, minimum = 1) => {
    const max = Math.max(...players.map((p) => value(p.id)));
    if (max < minimum) return;
    out.push({ emoji, title, playerIds: players.filter((p) => value(p.id) === max).map((p) => p.id) });
  };
  pick((id) => result.scores[id] ?? 0, '👑', 'Leyenda de la noche');
  pick((id) => result.stats[id]?.done ?? 0, '🔥', 'Sin miedo: más tarjetas cumplidas');
  pick((id) => result.stats[id]?.correct ?? 0, '🎯', 'Puntería: más aciertos');
  pick((id) => result.stats[id]?.skipped ?? 0, '🙈', 'Maestro del «paso»');
  return out;
}

/** «Ana», «Ana y Beto», «Ana, Beto y Caro». */
export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}
