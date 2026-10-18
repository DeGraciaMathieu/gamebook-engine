import { rollDiceDetailed } from './dice.js';

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

const NO_BONUS = { attack: 0, damageDealt: 0, damageTaken: 0 };

// Un assaut à la Défis Fantastiques : 2d6 + Habileté de chaque camp,
// le perdant encaisse les dégâts, égalité sans effet.
// `bonus` vient des modificateurs actifs : attaque du héros, dégâts infligés, dégâts subis.
export function resolveAssault(combat, heroHabilete, rng, bonus = NO_BONUS) {
  const heroRoll = rollDiceDetailed(ASSAULT_DICE, rng);
  const enemyRoll = rollDiceDetailed(ASSAULT_DICE, rng);
  const heroAttack = heroRoll.total + heroHabilete + bonus.attack;
  const enemyAttack = enemyRoll.total + combat.enemy.habilete;
  let outcome = 'tie';
  let heroDamage = 0;
  let enemyDamage = 0;

  if (heroAttack > enemyAttack) {
    outcome = 'hit';
    enemyDamage = Math.max(0, ASSAULT_DAMAGE + bonus.damageDealt);
  } else if (enemyAttack > heroAttack) {
    outcome = 'wounded';
    heroDamage = Math.max(0, ASSAULT_DAMAGE + bonus.damageTaken);
  }

  const round = {
    heroDice: heroRoll.dice,
    enemyDice: enemyRoll.dice,
    heroBonus: bonus.attack,
    heroAttack,
    enemyAttack,
    outcome,
    heroDamage,
    enemyDamage,
  };

  return {
    combat: {
      ...combat,
      enemyEndurance: Math.max(0, combat.enemyEndurance - enemyDamage),
      round: combat.round + 1,
      lastRound: round,
    },
    round,
  };
}

export function isEnemyDefeated(combat) {
  return combat.enemyEndurance <= 0;
}
