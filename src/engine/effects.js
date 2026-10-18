export function applyEffects(effects, state) {
  return (effects ?? []).reduce(applyEffect, state);
}

function applyEffect(state, effect) {
  switch (effect.type) {
    case 'stat':
      return withStat(state, effect.stat, state.stats[effect.stat] + effect.delta);
    case 'setStat':
      return withStat(state, effect.stat, effect.value);
    case 'flag':
      return { ...state, flags: { ...state.flags, [effect.flag]: effect.value ?? true } };
    case 'item':
      return withItem(state, effect);
    default:
      throw new Error(`Type d'effet inconnu : ${effect.type}`);
  }
}

// Règle classique : une caractéristique ne dépasse jamais sa valeur de départ.
function withStat(state, stat, value) {
  const clamped = Math.max(0, Math.min(state.initialStats[stat], value));
  return { ...state, stats: { ...state.stats, [stat]: clamped } };
}

function withItem(state, effect) {
  if (effect.action === 'add') {
    if (state.inventory.includes(effect.item)) {
      return state;
    }
    return { ...state, inventory: [...state.inventory, effect.item] };
  }
  if (effect.action === 'remove') {
    return { ...state, inventory: state.inventory.filter((item) => item !== effect.item) };
  }
  throw new Error(`Action d'inventaire inconnue : ${effect.action}`);
}
