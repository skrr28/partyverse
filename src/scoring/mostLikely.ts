/**
 * Reglas de puntuación de «¿Quién es más probable?».
 *
 * Es la especificación ejecutable de la función SQL `pv_score_votes`: el
 * servidor es quien puntúa de verdad, y un test de paridad comprueba que
 * ambas implementaciones devuelven lo mismo.
 */

export const POINTS_PER_VALID_VOTE = 100;
export const BONUS_FOR_MOST_VOTED = 50;
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const ROUNDS_PER_GAME = 5;

export interface Vote {
  voter: string;
  target: string;
}

export interface RoundScore {
  /** Votos recibidos por cada jugador votado. */
  tallies: Record<string, number>;
  /** Jugadores más votados (varios si hay empate), ordenados. */
  top: string[];
  maxVotes: number;
  /** Puntos ganados en la ronda por cada votante con voto válido. */
  points: Record<string, number>;
}

/**
 * Un voto es válido si votante y objetivo pertenecen a la sala, no es un
 * autovoto y es el primer voto de ese votante (los duplicados se ignoran).
 */
export function validVotes(votes: readonly Vote[], eligible: readonly string[]): Vote[] {
  const allowed = new Set(eligible);
  const seen = new Set<string>();
  const result: Vote[] = [];
  for (const v of votes) {
    if (!v.voter || !v.target || v.voter === v.target) continue;
    if (!allowed.has(v.voter) || !allowed.has(v.target)) continue;
    if (seen.has(v.voter)) continue;
    seen.add(v.voter);
    result.push(v);
  }
  return result;
}

/** Orden binario (equivale a `collate "C"` en PostgreSQL). */
const byCodeUnit = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function scoreMostLikelyRound(votes: readonly Vote[], eligible: readonly string[]): RoundScore {
  const valid = validVotes(votes, eligible);

  const tallies: Record<string, number> = {};
  for (const v of valid) tallies[v.target] = (tallies[v.target] ?? 0) + 1;

  const counts = Object.values(tallies);
  const maxVotes = counts.length ? Math.max(...counts) : 0;
  const top = Object.keys(tallies)
    .filter((id) => tallies[id] === maxVotes)
    .sort(byCodeUnit);
  const topSet = new Set(top);

  const points: Record<string, number> = {};
  for (const v of valid) {
    points[v.voter] = POINTS_PER_VALID_VOTE + (topSet.has(v.target) ? BONUS_FOR_MOST_VOTED : 0);
  }

  return { tallies, top, maxVotes, points };
}

export interface Ranked<T> {
  rank: number;
  item: T;
}

/**
 * Clasificación con empates: misma posición para la misma puntuación
 * (1, 1, 3…). El desempate de presentación es alfabético por apodo.
 */
export function rankByScore<T extends { score: number; nickname: string }>(items: readonly T[]): Ranked<T>[] {
  const sorted = [...items].sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname));
  return sorted.map((item, i) => {
    let rank = i + 1;
    if (i > 0 && sorted[i - 1].score === item.score) {
      // Hereda la posición del anterior empatado.
      let j = i - 1;
      while (j > 0 && sorted[j - 1].score === item.score) j--;
      rank = j + 1;
    }
    return { rank, item };
  });
}

/** Comprobaciones de cliente previas al envío (el servidor vuelve a validarlas). */
export function canVoteFor(
  me: string,
  target: string,
  activePlayerIds: readonly string[],
  alreadyVoted: boolean,
): { ok: true } | { ok: false; reason: 'SELF_VOTE' | 'INVALID_TARGET' | 'ALREADY_VOTED' } {
  if (alreadyVoted) return { ok: false, reason: 'ALREADY_VOTED' };
  if (me === target) return { ok: false, reason: 'SELF_VOTE' };
  if (!activePlayerIds.includes(target)) return { ok: false, reason: 'INVALID_TARGET' };
  return { ok: true };
}
