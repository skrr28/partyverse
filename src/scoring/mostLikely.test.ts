import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreMostLikelyRound,
  validVotes,
  rankByScore,
  canVoteFor,
  POINTS_PER_VALID_VOTE,
  BONUS_FOR_MOST_VOTED,
} from './mostLikely.ts';

const P = ['a', 'b', 'c', 'd'];

test('cada voto válido suma 100 y acertar al más votado suma 50 más', () => {
  const r = scoreMostLikelyRound(
    [
      { voter: 'a', target: 'b' },
      { voter: 'c', target: 'b' },
      { voter: 'b', target: 'a' },
    ],
    P,
  );
  assert.deepEqual(r.tallies, { b: 2, a: 1 });
  assert.deepEqual(r.top, ['b']);
  assert.equal(r.maxVotes, 2);
  assert.deepEqual(r.points, { a: 150, c: 150, b: 100 });
  assert.equal(POINTS_PER_VALID_VOTE + BONUS_FOR_MOST_VOTED, 150);
});

test('los empates reconocen a todos los empatados', () => {
  const r = scoreMostLikelyRound(
    [
      { voter: 'a', target: 'b' },
      { voter: 'b', target: 'c' },
      { voter: 'c', target: 'a' },
    ],
    P,
  );
  assert.deepEqual(r.top, ['a', 'b', 'c']);
  assert.deepEqual(r.points, { a: 150, b: 150, c: 150 });
});

test('empate parcial: solo quien eligió a un empatado recibe el extra', () => {
  const r = scoreMostLikelyRound(
    [
      { voter: 'a', target: 'b' },
      { voter: 'b', target: 'c' },
      { voter: 'c', target: 'b' },
      { voter: 'd', target: 'c' },
    ],
    [...P, 'e'],
  );
  assert.deepEqual(r.top, ['b', 'c']);
  assert.deepEqual(r.points, { a: 150, b: 150, c: 150, d: 150 });
});

test('el autovoto no es válido', () => {
  const r = scoreMostLikelyRound([{ voter: 'a', target: 'a' }, { voter: 'b', target: 'a' }], P);
  assert.deepEqual(r.tallies, { a: 1 });
  assert.equal(r.points.a, undefined);
  assert.equal(r.points.b, 150);
});

test('los votos duplicados se ignoran: cuenta el primero', () => {
  const votes = [
    { voter: 'a', target: 'b' },
    { voter: 'a', target: 'c' },
    { voter: 'a', target: 'c' },
  ];
  assert.deepEqual(validVotes(votes, P), [{ voter: 'a', target: 'b' }]);
  const r = scoreMostLikelyRound(votes, P);
  assert.deepEqual(r.tallies, { b: 1 });
  assert.equal(r.points.a, 150);
});

test('votos de o hacia jugadores ajenos a la sala no cuentan', () => {
  const r = scoreMostLikelyRound(
    [
      { voter: 'x', target: 'a' },
      { voter: 'a', target: 'x' },
      { voter: 'b', target: 'c' },
    ],
    P,
  );
  assert.deepEqual(r.tallies, { c: 1 });
  assert.deepEqual(r.points, { b: 150 });
});

test('ronda sin votos: nadie puntúa y no hay más votado', () => {
  const r = scoreMostLikelyRound([], P);
  assert.deepEqual(r, { tallies: {}, top: [], maxVotes: 0, points: {} });
});

test('partida completa de cinco rondas (mismo guion que la prueba SQL)', () => {
  const players = ['u1', 'u2', 'u3'];
  const rounds: [string, string][][] = [
    [['u1', 'u2'], ['u2', 'u1'], ['u3', 'u2']],
    [['u1', 'u2'], ['u2', 'u3'], ['u3', 'u1']],
    [['u1', 'u3']],
    [['u1', 'u3'], ['u3', 'u1']],
    [['u1', 'u2'], ['u2', 'u1'], ['u3', 'u1']],
  ];
  const total: Record<string, number> = { u1: 0, u2: 0, u3: 0 };
  for (const round of rounds) {
    const r = scoreMostLikelyRound(round.map(([voter, target]) => ({ voter, target })), players);
    for (const [id, pts] of Object.entries(r.points)) total[id] += pts;
  }
  assert.deepEqual(total, { u1: 700, u2: 400, u3: 600 });
});

test('clasificación con empates comparte posición', () => {
  const ranked = rankByScore([
    { nickname: 'Beto', score: 300 },
    { nickname: 'Ana', score: 450 },
    { nickname: 'Caro', score: 300 },
    { nickname: 'Dani', score: 100 },
    { nickname: 'Eva', score: 300 },
  ]);
  assert.deepEqual(
    ranked.map((r) => [r.rank, r.item.nickname]),
    [
      [1, 'Ana'],
      [2, 'Beto'],
      [2, 'Caro'],
      [2, 'Eva'],
      [5, 'Dani'],
    ],
  );
});

test('validación de cliente antes de votar', () => {
  assert.deepEqual(canVoteFor('a', 'a', P, false), { ok: false, reason: 'SELF_VOTE' });
  assert.deepEqual(canVoteFor('a', 'z', P, false), { ok: false, reason: 'INVALID_TARGET' });
  assert.deepEqual(canVoteFor('a', 'b', P, true), { ok: false, reason: 'ALREADY_VOTED' });
  assert.deepEqual(canVoteFor('a', 'b', P, false), { ok: true });
});
