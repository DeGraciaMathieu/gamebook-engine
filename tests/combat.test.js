import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startCombat, resolveAssault, isEnemyDefeated } from '../src/engine/combat.js';
import { minRoll } from './helpers.js';

const definition = { name: 'Gobelin', habilete: 6, endurance: 4, win: '2' };

test('startCombat initialise la fiche adversaire', () => {
  const combat = startCombat(definition);
  assert.equal(combat.enemyEndurance, 4);
  assert.equal(combat.round, 0);
  assert.equal(combat.lastRound, null);
});

test('le héros plus habile blesse l\'adversaire', () => {
  const { combat, round } = resolveAssault(startCombat(definition), 10, minRoll);
  assert.equal(combat.enemyEndurance, 2);
  assert.equal(combat.round, 1);
  assert.deepEqual(round, {
    heroDice: [1, 1], enemyDice: [1, 1], heroAttack: 12, enemyAttack: 8, outcome: 'hit', heroDamage: 0, enemyDamage: 2,
  });
  assert.deepEqual(combat.lastRound, round);
});

test('l\'adversaire plus habile blesse le héros', () => {
  const { combat, round } = resolveAssault(startCombat(definition), 4, minRoll);
  assert.equal(round.heroDamage, 2);
  assert.equal(combat.enemyEndurance, 4);
  assert.equal(round.outcome, 'wounded');
});

test('égalité : personne n\'est touché', () => {
  const { combat, round } = resolveAssault(startCombat(definition), 6, minRoll);
  assert.equal(round.heroDamage, 0);
  assert.equal(combat.enemyEndurance, 4);
  assert.equal(round.outcome, 'tie');
});

test('isEnemyDefeated à zéro d\'endurance', () => {
  let { combat } = resolveAssault(startCombat(definition), 10, minRoll);
  assert.equal(isEnemyDefeated(combat), false);
  ({ combat } = resolveAssault(combat, 10, minRoll));
  assert.equal(isEnemyDefeated(combat), true);
});
