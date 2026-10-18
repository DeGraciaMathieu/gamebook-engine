import { rollDiceDetailed } from './dice.js';

export const ASSAULT_DICE = '2d6';
export const ASSAULT_DAMAGE = 2;
export const DEFAULT_STAT = 'habilete';

const NO_BONUS = { attack: 0, damageDealt: 0, damageTaken: 0 };

// `stat` : la caractéristique du duel (Habileté par défaut, mais une course se joue sur l'Endurance,
// une joute sur la Volonté). `damage` : ce que l'adversaire inflige par touche. `armor` : ce qu'il absorbe.
export function startCombat(definition) {
  return {
    enemy: {
      name: definition.name,
      habilete: definition.habilete,
      endurance: definition.endurance,
      stat: definition.stat ?? DEFAULT_STAT,
      damage: definition.damage ?? ASSAULT_DAMAGE,
      armor: definition.armor ?? 0,
    },
    enemyEndurance: definition.endurance,
    round: 0,
    lastRound: null,
  };
}

export function fleeDamage(combat) {
  return combat.enemy.damage;
}

// Un assaut à la Défis Fantastiques : 2d6 + caractéristique de chaque camp,
// le perdant encaisse les dégâts, égalité sans effet.
// `bonus` vient des modificateurs actifs : attaque du héros, dégâts infligés, dégâts subis.
export function resolveAssault(combat, heroScore, rng, bonus = NO_BONUS) {
  const heroRoll = rollDiceDetailed(ASSAULT_DICE, rng);
  const enemyRoll = rollDiceDetailed(ASSAULT_DICE, rng);
  const heroAttack = heroRoll.total + heroScore + bonus.attack;
  const enemyAttack = enemyRoll.total + combat.enemy.habilete;
  let outcome = 'tie';
  let heroDamage = 0;
  let enemyDamage = 0;

  if (heroAttack > enemyAttack) {
    outcome = 'hit';
    enemyDamage = Math.max(0, ASSAULT_DAMAGE + bonus.damageDealt - combat.enemy.armor);
  } else if (enemyAttack > heroAttack) {
    outcome = 'wounded';
    heroDamage = Math.max(0, combat.enemy.damage + bonus.damageTaken);
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
