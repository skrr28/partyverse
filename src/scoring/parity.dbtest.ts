/**
 * Paridad TypeScript ↔ SQL: genera rondas aleatorias (con autovotos,
 * duplicados e intrusos) y comprueba que `pv_score_votes` en PostgreSQL
 * devuelve exactamente lo mismo que `scoreMostLikelyRound`.
 * Se ejecuta con `npm run test:parity` (levanta la BD temporal).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { scoreMostLikelyRound, type Vote } from './mostLikely.ts';

function sqlScore(votes: Vote[], eligible: string[]) {
  const lit = (v: unknown) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  const out = execFileSync(
    'psql',
    ['-X', '-A', '-t', '-c', `select public.pv_score_votes(${lit(votes)}, ${lit(eligible)})`],
    { encoding: 'utf8' },
  );
  const r = JSON.parse(out.trim());
  return { tallies: r.tallies, top: r.top, maxVotes: r.max_votes, points: r.points };
}

test('pv_score_votes coincide con la implementación TypeScript', { skip: !process.env.PGHOST }, () => {
  for (let i = 0; i < 60; i++) {
    const n = 3 + Math.floor(Math.random() * 10); // 3..12 jugadores
    const players = Array.from({ length: n }, () => randomUUID());
    const outsider = randomUUID();
    const pool = [...players, outsider];
    const votes: Vote[] = [];
    const count = Math.floor(Math.random() * (n + 4));
    for (let k = 0; k < count; k++) {
      votes.push({
        voter: pool[Math.floor(Math.random() * pool.length)],
        target: pool[Math.floor(Math.random() * pool.length)],
      });
    }
    assert.deepEqual(sqlScore(votes, players), scoreMostLikelyRound(votes, players), `escenario ${i}`);
  }
});
