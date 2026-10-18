import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDice, rollDice, rollDiceDetailed, createSeededRng } from '../src/engine/dice.js';
import { minRoll, maxRoll } from './helpers.js';

test('parseDice lit nombre, faces et modificateur', () => {
  assert.deepEqual(parseDice('2d6+12'), { count: 2, sides: 6, modifier: 12 });
  assert.deepEqual(parseDice('1d6'), { count: 1, sides: 6, modifier: 0 });
  assert.deepEqual(parseDice('3d4-1'), { count: 3, sides: 4, modifier: -1 });
});

test('parseDice rejette une formule invalide', () => {
  assert.throws(() => parseDice('d6'), /invalide/);
  assert.throws(() => parseDice('2x6'), /invalide/);
});

test('rollDice respecte les bornes', () => {
  assert.equal(rollDice('2d6+12', minRoll), 14);
  assert.equal(rollDice('2d6+12', maxRoll), 24);
});

test('rollDiceDetailed expose chaque dé et le modificateur', () => {
  assert.deepEqual(rollDiceDetailed('2d6+12', maxRoll), { dice: [6, 6], modifier: 12, total: 24 });
});

test('createSeededRng est déterministe et borné', () => {
  const a = createSeededRng(42);
  const b = createSeededRng(42);
  for (let i = 0; i < 20; i++) {
    const value = a();
    assert.equal(value, b());
    assert.ok(value >= 0 && value < 1);
  }
});
