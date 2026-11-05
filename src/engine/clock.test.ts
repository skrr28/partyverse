import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addSeconds, backoffMs, clockOffsetMs, msUntil, secondsLeft } from './clock.ts';

test('corrige el desfase entre el reloj local y el del servidor', () => {
  const local = Date.parse('2026-11-05T10:00:00.000Z');
  const offset = clockOffsetMs('2026-11-05T10:00:05.000Z', local); // servidor 5 s adelantado
  assert.equal(offset, 5000);
  // El plazo vence a las 10:00:30 hora servidor => quedan 25 s según el reloj local corregido.
  assert.equal(secondsLeft('2026-11-05T10:00:30.000Z', offset, local), 25);
});

test('el temporizador nunca es negativo y redondea hacia arriba', () => {
  const local = Date.parse('2026-11-05T10:00:00.000Z');
  assert.equal(msUntil('2026-11-05T09:59:00.000Z', 0, local), 0);
  assert.equal(secondsLeft('2026-11-05T10:00:00.400Z', 0, local), 1);
  assert.equal(secondsLeft(null, 0, local), 0);
});

test('suma segundos a fechas ISO', () => {
  assert.equal(addSeconds('2026-11-05T10:00:00.000Z', 12), '2026-11-05T10:00:12.000Z');
  assert.equal(addSeconds(null, 12), null);
});

test('reintentos de reconexión con espera creciente y tope', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 10].map(backoffMs), [1000, 2000, 4000, 8000, 15000, 15000]);
});
