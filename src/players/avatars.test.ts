import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AVATARS } from './avatars.ts';

test('los avatares de la app coinciden con los que valida el servidor', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261105000001_partyverse_core.sql', import.meta.url), 'utf8');
  const block = sql.match(/pv_valid_avatar[\s\S]*?array\[([\s\S]*?)\]/)?.[1] ?? '';
  const serverIds = [...block.matchAll(/'([a-z]+)'/g)].map((m) => m[1]).sort();
  assert.ok(serverIds.length > 0);
  assert.deepEqual(AVATARS.map((a) => a.id).sort(), serverIds);
});
