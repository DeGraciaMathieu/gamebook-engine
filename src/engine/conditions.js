const COMPARATORS = {
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '=': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '>=': (a, b) => a >= b,
  '>': (a, b) => a > b,
};

export function isConditionMet(condition, state) {
  if (!condition) {
    return true;
  }
  switch (condition.type) {
    case 'flag':
      return Boolean(state.flags[condition.flag]) === (condition.value ?? true);
    case 'item':
      return state.inventory.includes(condition.item) === (condition.present ?? true);
    case 'stat':
      return compareStat(condition, state);
    case 'all':
      return condition.conditions.every((child) => isConditionMet(child, state));
    case 'any':
      return condition.conditions.some((child) => isConditionMet(child, state));
    case 'not':
      return !isConditionMet(condition.condition, state);
    default:
      throw new Error(`Type de condition inconnu : ${condition.type}`);
  }
}

function compareStat(condition, state) {
  const compare = COMPARATORS[condition.op];
  if (!compare) {
    throw new Error(`Opérateur de comparaison inconnu : ${condition.op}`);
  }
  return compare(state.stats[condition.stat], condition.value);
}
