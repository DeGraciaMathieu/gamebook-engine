import { isConditionMet } from './conditions.js';

// Règles déclarées par l'histoire : quand leur condition est vraie, elles modifient les assauts ou les tests.
export function activeModifiers(story, state) {
  return (story.modifiers ?? []).filter((modifier) => isConditionMet(modifier.if, state));
}

export function combatBonus(story, state) {
  const active = activeModifiers(story, state).filter((modifier) => modifier.combat);
  const sum = (key) => active.reduce((total, modifier) => total + (modifier.combat[key] ?? 0), 0);
  return {
    attack: sum('attack'),
    damageDealt: sum('damageDealt'),
    damageTaken: sum('damageTaken'),
    active,
  };
}

export function testBonus(story, state, stat) {
  const active = activeModifiers(story, state).filter((modifier) => modifier.test?.stat === stat);
  return {
    bonus: active.reduce((total, modifier) => total + (modifier.test.bonus ?? 0), 0),
    active,
  };
}
