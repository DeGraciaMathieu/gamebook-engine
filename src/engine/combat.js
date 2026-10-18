import { rollDice } from './dice.js';

export const ASSAULT_DICE = '2d6';
export const ASSAULT_DAMAGE = 2;
export const FLEE_DAMAGE = 2;

export function startCombat(definition) {
  return {
    enemy: { name: definition.name, habilete: definition.habilete, endurance: definition.endurance },
    enemyEndurance: definition.endurance,
    round: 0,
    lastRound: null,
  };
}

// Un assaut à la Défis Fantastiques : 2d6 + Habileté de chaque camp,
// le perdant encaisse les dégâts, égalité sans effet.
export function resolveAssault(combat, heroHabilete, rng) {
  const heroAttack = rollDice(ASSAULT_DICE, rng) + heroHabilete;
  const enemyAttack = rollDice(ASSAULT_DICE, rng) + combat.enemy.habilete;
  let outcome = 'tie';
  let heroDamage = 0;
  let enemyDamage = 0;

  if (heroAttack > enemyAttack) {
    outcome = 'hit';
    enemyDamage = ASSAULT_DAMAGE;
  } else if (enemyAttack > heroAttack) {
    outcome = 'wounded';
    heroDamage = ASSAULT_DAMAGE;
  }

  return {
    combat: {
      ...combat,
      enemyEndurance: Math.max(0, combat.enemyEndurance - enemyDamage),
      round: combat.round + 1,
      lastRound: { heroAttack, enemyAttack, outcome },
    },
    heroDamage,
  };
}

export function isEnemyDefeated(combat) {
  return combat.enemyEndurance <= 0;
}
