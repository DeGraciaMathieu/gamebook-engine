import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyEffects } from '../src/engine/effects.js';
import { makeState } from './helpers.js';

test('stat : delta borné entre 0 et la valeur initiale', () => {
  const state = makeState();
  assert.equal(applyEffects([{ type: 'stat', stat: 'endurance', delta: -5 }], state).stats.endurance, 15);
  assert.equal(applyEffects([{ type: 'stat', stat: 'endurance', delta: +5 }], state).stats.endurance, 20);
  assert.equal(applyEffects([{ type: 'stat', stat: 'endurance', delta: -50 }], state).stats.endurance, 0);
});

test('setStat fixe la valeur', () => {
  const state = makeState();
  assert.equal(applyEffects([{ type: 'setStat', stat: 'chance', value: 3 }], state).stats.chance, 3);
});

test('flag : vrai par défaut, valeur explicite possible', () => {
  const state = makeState();
  assert.equal(applyEffects([{ type: 'flag', flag: 'porte' }], state).flags.porte, true);
  assert.equal(applyEffects([{ type: 'flag', flag: 'porte', value: false }], state).flags.porte, false);
});

test('item : ajout sans doublon, retrait', () => {
  const state = makeState();
  const withKey = applyEffects([
    { type: 'item', action: 'add', item: 'clef' },
    { type: 'item', action: 'add', item: 'clef' },
  ], state);
  assert.deepEqual(withKey.inventory, ['clef']);
  assert.deepEqual(applyEffects([{ type: 'item', action: 'remove', item: 'clef' }], withKey).inventory, []);
});

test("l'état d'origine n'est pas modifié", () => {
  const state = makeState();
  applyEffects([{ type: 'stat', stat: 'endurance', delta: -5 }, { type: 'flag', flag: 'x' }], state);
  assert.equal(state.stats.endurance, 20);
  assert.deepEqual(state.flags, {});
});

test('une caractéristique sans plafond peut dépasser sa valeur de départ', () => {
  const state = { ...makeState({ stats: { or: 6 } }), caps: { habilete: 10, endurance: 20, chance: 8 } };
  assert.equal(applyEffects([{ type: 'stat', stat: 'or', delta: 10 }], state).stats.or, 16);
  assert.equal(applyEffects([{ type: 'stat', stat: 'or', delta: -10 }], state).stats.or, 0);
  assert.equal(applyEffects([{ type: 'stat', stat: 'endurance', delta: 5 }], state).stats.endurance, 20);
});
