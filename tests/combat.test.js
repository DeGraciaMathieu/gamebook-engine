import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startCombat, resolveAssault, isEnemyDefeated, fleeDamage } from '../src/engine/combat.js';
import { minRoll } from './helpers.js';

const definition = { name: 'Gobelin', habilete: 6, endurance: 4, win: '2' };

test('startCombat initialise la fiche adversaire avec ses valeurs par défaut', () => {
  const combat = startCombat(definition);
  assert.deepEqual(combat.enemy, { name: 'Gobelin', habilete: 6, endurance: 4, stat: 'habilete', damage: 2, armor: 0 });
  assert.equal(fleeDamage(combat), 2);
  assert.equal(combat.enemyEndurance, 4);
  assert.equal(combat.round, 0);
  assert.equal(combat.lastRound, null);
});

test('le héros plus habile blesse l\'adversaire', () => {
  const { combat, round } = resolveAssault(startCombat(definition), 10, minRoll);
  assert.equal(combat.enemyEndurance, 2);
  assert.equal(combat.round, 1);
  assert.deepEqual(round, {
    heroDice: [1, 1], enemyDice: [1, 1], heroBonus: 0, heroAttack: 12, enemyAttack: 8, outcome: 'hit', heroDamage: 0, enemyDamage: 2,
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

test('les modificateurs s\'ajoutent à l\'attaque et aux dégâts', () => {
  const bonus = { attack: 2, damageDealt: 1, damageTaken: -1 };
  const { round } = resolveAssault(startCombat(definition), 6, minRoll, bonus);
  assert.equal(round.heroBonus, 2);
  assert.equal(round.heroAttack, 10);
  assert.equal(round.outcome, 'hit');
  assert.equal(round.enemyDamage, 3);
  const wounded = resolveAssault(startCombat(definition), 2, minRoll, bonus).round;
  assert.equal(wounded.outcome, 'wounded');
  assert.equal(wounded.heroDamage, 1);
  const armored = resolveAssault(startCombat(definition), 2, minRoll, { attack: 0, damageDealt: 0, damageTaken: -5 }).round;
  assert.equal(armored.heroDamage, 0);
});

test('dégâts et armure de l\'adversaire', () => {
  const bear = startCombat({ ...definition, name: 'Ours', damage: 4, armor: 1 });
  assert.equal(fleeDamage(bear), 4);
  const hit = resolveAssault(bear, 10, minRoll).round;
  assert.equal(hit.enemyDamage, 1);
  const wounded = resolveAssault(bear, 2, minRoll).round;
  assert.equal(wounded.heroDamage, 4);
  const ghost = startCombat({ ...definition, armor: 5 });
  assert.equal(resolveAssault(ghost, 10, minRoll).round.enemyDamage, 0);
});
