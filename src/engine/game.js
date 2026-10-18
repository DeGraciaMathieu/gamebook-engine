import { rollDice } from './dice.js';
import { isConditionMet } from './conditions.js';
import { applyEffects } from './effects.js';
import { startCombat, resolveAssault, isEnemyDefeated, FLEE_DAMAGE } from './combat.js';
import { getParagraph, isEnding } from './story.js';

export const LUCK_DICE = '2d6';

export function createGame(story, rng = Math.random) {
  const stats = rollStats(story.hero.stats, rng);
  const state = {
    storyId: story.id,
    paragraphId: null,
    stats,
    initialStats: { ...stats },
    flags: { ...(story.hero.flags ?? {}) },
    inventory: [...(story.hero.inventory ?? [])],
    combat: null,
    status: 'playing',
    itemChanges: [],
  };
  return trackItemChanges(state, enterParagraph(story, state, story.start));
}

function rollStats(definitions, rng) {
  const stats = {};
  for (const [name, definition] of Object.entries(definitions)) {
    stats[name] = definition.roll ? rollDice(definition.roll, rng) : definition.value;
  }
  return stats;
}

export function currentParagraph(story, state) {
  return getParagraph(story, state.paragraphId);
}

export function listChoices(story, state) {
  if (state.status !== 'playing' || state.combat) {
    return [];
  }
  const choices = currentParagraph(story, state).choices ?? [];
  return choices.filter((choice) => isConditionMet(choice.if, state));
}

export function choose(story, state, choice) {
  if (!listChoices(story, state).includes(choice)) {
    throw new Error('Choix indisponible');
  }
  const next = applyEffects(choice.effects, state);
  if (isDead(next)) {
    return trackItemChanges(state, die(story, next));
  }
  return trackItemChanges(state, enterParagraph(story, next, choice.to));
}

// Test de Chance : réussite si 2d6 <= Chance ; la Chance baisse de 1 à chaque test.
// Test de caractéristique : réussite si le jet <= caractéristique.
export function resolveTest(story, state, rng = Math.random) {
  const test = currentParagraph(story, state).test;
  if (!test) {
    throw new Error('Aucun test à résoudre ici');
  }
  const stat = test.type === 'luck' ? 'chance' : test.stat;
  const roll = rollDice(test.type === 'luck' ? LUCK_DICE : test.dice, rng);
  const success = roll <= state.stats[stat];
  let next = state;
  if (test.type === 'luck') {
    next = applyEffects([{ type: 'stat', stat: 'chance', delta: -1 }], state);
  }
  return {
    state: trackItemChanges(state, enterParagraph(story, next, success ? test.success : test.failure)),
    roll,
    success,
  };
}

export function fightRound(story, state, rng = Math.random) {
  if (!state.combat) {
    throw new Error('Aucun combat en cours');
  }
  const { combat, heroDamage } = resolveAssault(state.combat, state.stats.habilete, rng);
  let next = applyEffects([{ type: 'stat', stat: 'endurance', delta: -heroDamage }], state);
  next = { ...next, combat };

  if (isDead(next)) {
    return die(story, next);
  }
  if (isEnemyDefeated(combat)) {
    return trackItemChanges(state, enterParagraph(story, next, currentParagraph(story, state).combat.win));
  }
  return next;
}

// Fuir laisse à l'adversaire un coup gratuit.
export function fleeCombat(story, state) {
  const flee = currentParagraph(story, state).combat?.flee;
  if (!state.combat || !flee) {
    throw new Error('Impossible de fuir ce combat');
  }
  const next = applyEffects([{ type: 'stat', stat: 'endurance', delta: -FLEE_DAMAGE }], state);
  if (isDead(next)) {
    return die(story, next);
  }
  return trackItemChanges(state, enterParagraph(story, next, flee.to));
}

function enterParagraph(story, state, paragraphId) {
  const paragraph = getParagraph(story, paragraphId);
  let next = applyEffects(paragraph.effects, { ...state, paragraphId, combat: null });
  if (isDead(next)) {
    return die(story, next);
  }
  if (paragraph.combat) {
    next = { ...next, combat: startCombat(paragraph.combat) };
  }
  if (isEnding(paragraph)) {
    next = { ...next, status: 'ended' };
  }
  return next;
}

// Objets gagnés ou perdus entre deux pages, pour les mettre en avant dans le texte.
function trackItemChanges(previous, next) {
  const gained = next.inventory.filter((item) => !previous.inventory.includes(item));
  const lost = previous.inventory.filter((item) => !next.inventory.includes(item));
  return {
    ...next,
    itemChanges: [
      ...gained.map((item) => ({ item, action: 'add' })),
      ...lost.map((item) => ({ item, action: 'remove' })),
    ],
  };
}

function isDead(state) {
  return state.stats.endurance <= 0;
}

function die(story, state) {
  return {
    ...state,
    paragraphId: story.death ?? state.paragraphId,
    combat: null,
    status: 'dead',
  };
}
