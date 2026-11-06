import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AMBIENTES, CATEGORIES, GAMES, filterGames, gameById, recommend } from './games.ts';

test('el catálogo es amplio y cubre todas las categorías y ambientes', () => {
  assert.ok(GAMES.length >= 50, `hay ${GAMES.length} juegos`);
  for (const c of CATEGORIES) assert.ok(GAMES.some((g) => g.category === c.id), `categoría vacía: ${c.id}`);
  for (const a of AMBIENTES) assert.ok(GAMES.some((g) => g.ambientes.includes(a.id)), `ambiente vacío: ${a.id}`);
});

test('cada juego tiene datos completos y coherentes', () => {
  const ids = new Set<string>();
  for (const g of GAMES) {
    assert.ok(!ids.has(g.id), `id repetido: ${g.id}`);
    ids.add(g.id);
    assert.ok(g.title && g.description && g.emoji, g.id);
    assert.ok(g.rules.length >= 2, `${g.id}: faltan reglas`);
    assert.ok(g.minPlayers >= 1 && g.minPlayers <= g.maxPlayers, `${g.id}: jugadores`);
    assert.ok(g.minutes > 0, g.id);
    assert.equal(gameById(g.id), g);
  }
});

test('los paquetes de contenido no están vacíos ni tienen duplicados', () => {
  for (const g of GAMES) {
    const c = g.config;
    let texts: string[] = [];
    if (c.engine === 'prompts') texts = c.data.pack.map((x) => x.text);
    if (c.engine === 'guess') texts = c.data.pack.map((x) => `${x.clue ?? ''}|${x.word}`);
    if (c.engine === 'quiz') texts = c.data.pack.map((x) => x.q);
    if (c.engine === 'wheel') texts = c.data.options;
    if (c.engine === 'letter') texts = c.data.categories;
    if (['prompts', 'guess', 'quiz', 'wheel', 'letter'].includes(c.engine)) {
      assert.ok(texts.length >= 4, `${g.id}: contenido insuficiente (${texts.length})`);
      const dup = texts.find((t, i) => texts.indexOf(t) !== i);
      assert.equal(dup, undefined, `${g.id}: duplicado «${dup}»`);
    }
  }
});

test('verdad o reto tiene verdades y retos en cada nivel declarado', () => {
  for (const g of GAMES) {
    if (g.config.engine !== 'prompts' || !g.config.data.truthOrDare) continue;
    for (const level of g.config.data.levels ?? []) {
      for (const kind of ['verdad', 'reto'] as const) {
        const n = g.config.data.pack.filter((p) => p.kind === kind && p.level === level).length;
        assert.ok(n >= 5, `${g.id}: pocas tarjetas ${kind} nivel ${level} (${n})`);
      }
    }
  }
});

test('trivia: 4 opciones, respuesta válida y sin opciones repetidas', () => {
  for (const g of GAMES) {
    if (g.config.engine !== 'quiz') continue;
    for (const q of g.config.data.pack) {
      assert.equal(q.options.length, 4, q.q);
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, q.q);
      assert.equal(new Set(q.options).size, 4, `opciones repetidas: ${q.q}`);
    }
  }
});

test('palabras prohibidas: cada carta trae 4 prohibidas distintas de la palabra', () => {
  const taboo = gameById('palabras-prohibidas');
  assert.ok(taboo && taboo.config.engine === 'guess');
  for (const w of taboo.config.data.pack) {
    assert.equal(w.forbidden?.length, 4, w.word);
    assert.ok(!w.forbidden!.some((f) => f.toLowerCase() === w.word.toLowerCase()), w.word);
  }
});

test('impostor: cada par tiene dos palabras distintas', () => {
  const imp = gameById('impostor');
  assert.ok(imp && imp.config.engine === 'impostor');
  for (const [cat, pairs] of Object.entries(imp.config.data.packs)) {
    assert.ok(pairs.length >= 10, cat);
    for (const [a, b] of pairs) assert.notEqual(a, b, `${cat}: ${a}`);
  }
});

test('el contenido +18 solo aparece si se pide y está marcado', () => {
  const adult = GAMES.filter((g) => g.adult);
  assert.ok(adult.length >= 1);
  for (const g of adult) assert.ok(g.ambientes.includes('adultos'), g.id);
  assert.ok(filterGames(GAMES, {}).every((g) => !g.adult));
  assert.ok(filterGames(GAMES, { ambiente: 'adultos' }).every((g) => !g.adult));
  assert.ok(filterGames(GAMES, { ambiente: 'adultos', includeAdult: true }).some((g) => g.adult));
  // Ningún juego infantil/familiar es +18.
  assert.ok(GAMES.filter((g) => g.ambientes.includes('familiar')).every((g) => !g.adult));
});

test('filtros y recomendaciones respetan el tamaño del grupo', () => {
  const two = filterGames(GAMES, { players: 2 });
  assert.ok(two.length > 10);
  assert.ok(two.every((g) => g.minPlayers <= 2 && g.maxPlayers >= 2));
  const rec = recommend(GAMES, 'fiesta', 6, false);
  assert.ok(rec.length > 0 && rec.length <= 6);
  assert.ok(rec.every((g) => g.ambientes.includes('fiesta') && !g.adult));
  assert.ok(filterGames(GAMES, { query: 'impostor' }).some((g) => g.id === 'impostor'));
});
