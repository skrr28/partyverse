import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Deck,
  addPoints,
  assignImpostors,
  awards,
  highLowCorrect,
  joinNames,
  makeTeams,
  maxImpostors,
  numberHint,
  pickIndex,
  quizPoints,
  randomLetter,
  ranking,
  resolveImpostor,
  rpsWinner,
  shuffle,
  tallyVotes,
  wheelIndexAt,
  wheelTarget,
  type LocalPlayer,
} from './logic.ts';

/** Generador pseudoaleatorio determinista (mulberry32). */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const players: LocalPlayer[] = ['Ana', 'Beto', 'Caro', 'Dani', 'Eva'].map((name, i) => ({ id: `p${i}`, name, emoji: '🙂' }));

test('shuffle conserva los elementos', () => {
  const s = shuffle([1, 2, 3, 4, 5, 6], seeded(1));
  assert.deepEqual([...s].sort(), [1, 2, 3, 4, 5, 6]);
});

test('la baraja no repite cartas hasta agotarlas', () => {
  const d = new Deck(['a', 'b', 'c', 'd'], seeded(2));
  const first = [d.draw(), d.draw(), d.draw(), d.draw()];
  assert.deepEqual([...first].sort(), ['a', 'b', 'c', 'd']);
  assert.ok(['a', 'b', 'c', 'd'].includes(d.draw())); // vuelve a barajar
  assert.throws(() => new Deck([]));
});

test('equipos equilibrados', () => {
  const t = makeTeams(players, 2, seeded(3));
  assert.equal(t.length, 2);
  assert.deepEqual(t.map((x) => x.ids.length).sort(), [2, 3]);
  assert.equal(new Set(t.flatMap((x) => x.ids)).size, 5);
});

test('puntos de trivia: 100 por acierto + hasta 50 por rapidez', () => {
  assert.equal(quizPoints(false, 20_000), 0);
  assert.equal(quizPoints(true, 20_000), 150);
  assert.equal(quizPoints(true, 10_000), 125);
  assert.equal(quizPoints(true, 0), 100);
  assert.equal(addPoints({ a: 10 }, 'a', 5).a, 15);
});

test('la ruleta se detiene en el segmento elegido', () => {
  const rng = seeded(4);
  for (const n of [2, 3, 6, 9, 12]) {
    for (let k = 0; k < 50; k++) {
      const idx = pickIndex(n, rng);
      assert.ok(idx >= 0 && idx < n);
      const target = wheelTarget(k * 137, idx, n, 5, rng());
      assert.ok(target > k * 137, 'siempre gira hacia delante');
      assert.equal(wheelIndexAt(target, n), idx, `n=${n} idx=${idx}`);
    }
  }
});

test('la ruleta reparte resultados de forma uniforme', () => {
  const rng = seeded(5);
  const counts = [0, 0, 0, 0];
  for (let i = 0; i < 8000; i++) counts[pickIndex(4, rng)]++;
  for (const c of counts) assert.ok(c > 1800 && c < 2200, `distribución ${counts}`);
});

test('impostores: número válido y sin repetir', () => {
  assert.equal(maxImpostors(3), 1);
  assert.equal(maxImpostors(7), 3);
  const ids = players.map((p) => p.id);
  const imp = assignImpostors(ids, 9, seeded(6));
  assert.equal(imp.length, 2);
  assert.equal(new Set(imp).size, 2);
  assert.ok(imp.every((x) => ids.includes(x)));
});

test('votación del impostor: atrapado, escapado y empate', () => {
  const ids = ['a', 'b', 'c', 'd'];
  const caught = resolveImpostor(ids, ['d'], { a: 'd', b: 'd', c: 'a', d: 'b' });
  assert.equal(caught.expelled, 'd');
  assert.equal(caught.crewWins, true);
  assert.deepEqual(caught.points, { a: 100, b: 100, c: 100, d: 0 });

  const stolen = resolveImpostor(ids, ['d'], { a: 'd', b: 'd', c: 'd', d: 'a' }, true);
  assert.equal(stolen.points.d, 150);

  const escaped = resolveImpostor(ids, ['d'], { a: 'b', b: 'c', c: 'b', d: 'b' });
  assert.equal(escaped.expelled, 'b');
  assert.equal(escaped.crewWins, false);
  assert.equal(escaped.points.d, 200);

  const tie = resolveImpostor(ids, ['d'], { a: 'b', b: 'a', c: 'd', d: 'c' });
  assert.equal(tie.expelled, null);
  assert.equal(tie.crewWins, false);
  assert.deepEqual(tallyVotes({}).top, []);
});

test('piedra, papel o tijera', () => {
  assert.equal(rpsWinner('piedra', 'tijera'), 'a');
  assert.equal(rpsWinner('piedra', 'papel'), 'b');
  assert.equal(rpsWinner('papel', 'papel'), 'empate');
  assert.equal(rpsWinner('tijera', 'papel'), 'a');
});

test('adivina el número y mayor o menor', () => {
  assert.equal(numberHint(40, 20), 'mayor');
  assert.equal(numberHint(40, 60), 'menor');
  assert.equal(numberHint(40, 40), 'correcto');
  assert.equal(highLowCorrect(5, 9, 'mayor'), true);
  assert.equal(highLowCorrect(5, 2, 'mayor'), false);
  assert.equal(highLowCorrect(5, 5, 'menor'), true);
});

test('Basta no repite letra hasta agotarlas', () => {
  const letters = ['A', 'B', 'C'];
  const used: string[] = [];
  const rng = seeded(7);
  for (let i = 0; i < 3; i++) used.push(randomLetter(letters, used, rng));
  assert.deepEqual([...used].sort(), letters);
});

test('clasificación con empates y reconocimientos', () => {
  const scores = { p0: 300, p1: 300, p2: 100, p3: 0, p4: 50 };
  const r = ranking(players, scores);
  assert.deepEqual(r.map((x) => [x.rank, x.player.name]), [[1, 'Ana'], [1, 'Beto'], [3, 'Caro'], [4, 'Eva'], [5, 'Dani']]);
  const stats = Object.fromEntries(players.map((p, i) => [p.id, { done: i, skipped: 0, correct: 0 }]));
  const a = awards(players, { scores, stats });
  assert.deepEqual(a.find((x) => x.emoji === '👑')?.playerIds, ['p0', 'p1']);
  assert.deepEqual(a.find((x) => x.emoji === '🔥')?.playerIds, ['p4']);
  assert.equal(a.find((x) => x.emoji === '🙈'), undefined, 'sin «pasos» no hay premio');
});

test('nombres en lista con «y»', () => {
  assert.equal(joinNames(['Ana']), 'Ana');
  assert.equal(joinNames(['Ana', 'Beto']), 'Ana y Beto');
  assert.equal(joinNames(['Ana', 'Beto', 'Caro']), 'Ana, Beto y Caro');
});
