const DICE_PATTERN = /^(\d+)d(\d+)([+-]\d+)?$/;

export function parseDice(spec) {
  const match = DICE_PATTERN.exec(String(spec).replace(/\s/g, ''));
  if (!match) {
    throw new Error(`Formule de dés invalide : ${spec}`);
  }
  return {
    count: Number(match[1]),
    sides: Number(match[2]),
    modifier: Number(match[3] ?? 0),
  };
}

export function rollDice(spec, rng = Math.random) {
  const { count, sides, modifier } = parseDice(spec);
  let total = modifier;
  for (let i = 0; i < count; i++) {
    total += Math.floor(rng() * sides) + 1;
  }
  return total;
}

// Générateur déterministe (mulberry32) pour les tests et le rejeu.
export function createSeededRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
