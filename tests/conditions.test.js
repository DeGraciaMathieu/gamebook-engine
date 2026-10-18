import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isConditionMet } from '../src/engine/conditions.js';
import { makeState } from './helpers.js';

const state = makeState({ flags: { porte: true }, inventory: ['clef'] });

test('absence de condition vaut vrai', () => {
  assert.equal(isConditionMet(undefined, state), true);
});

test('condition flag', () => {
  assert.equal(isConditionMet({ type: 'flag', flag: 'porte' }, state), true);
  assert.equal(isConditionMet({ type: 'flag', flag: 'porte', value: false }, state), false);
  assert.equal(isConditionMet({ type: 'flag', flag: 'inconnu' }, state), false);
});

test('condition item', () => {
  assert.equal(isConditionMet({ type: 'item', item: 'clef' }, state), true);
  assert.equal(isConditionMet({ type: 'item', item: 'clef', present: false }, state), false);
  assert.equal(isConditionMet({ type: 'item', item: 'potion' }, state), false);
});

test('condition stat avec opérateurs', () => {
  assert.equal(isConditionMet({ type: 'stat', stat: 'endurance', op: '>=', value: 20 }, state), true);
  assert.equal(isConditionMet({ type: 'stat', stat: 'endurance', op: '>', value: 20 }, state), false);
  assert.equal(isConditionMet({ type: 'stat', stat: 'chance', op: '<', value: 9 }, state), true);
  assert.equal(isConditionMet({ type: 'stat', stat: 'chance', op: '=', value: 8 }, state), true);
  assert.equal(isConditionMet({ type: 'stat', stat: 'chance', op: '!=', value: 8 }, state), false);
  assert.throws(() => isConditionMet({ type: 'stat', stat: 'chance', op: '~', value: 8 }, state), /Opérateur/);
});

test('combinaisons all, any, not', () => {
  const hasKey = { type: 'item', item: 'clef' };
  const hasPotion = { type: 'item', item: 'potion' };
  assert.equal(isConditionMet({ type: 'all', conditions: [hasKey, hasPotion] }, state), false);
  assert.equal(isConditionMet({ type: 'any', conditions: [hasKey, hasPotion] }, state), true);
  assert.equal(isConditionMet({ type: 'not', condition: hasPotion }, state), true);
});

test('type inconnu lève une erreur', () => {
  assert.throws(() => isConditionMet({ type: 'magie' }, state), /inconnu/);
});
