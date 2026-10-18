import { rollDice, rollDiceDetailed } from './dice.js';
import { isConditionMet } from './conditions.js';
import { applyEffects } from './effects.js';
import { startCombat, resolveAssault, isEnemyDefeated, FLEE_DAMAGE } from './combat.js';
import { getParagraph, isEnding } from './story.js';

export const LUCK_DICE = '2d6';

export function createGame(story, rng = Math.random, allocation = {}) {
  const stats = describeCreation(story)
    ? allocateStats(story, allocation)
    : rollStats(story.hero.stats, rng);
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
    statChanges: [],
    chosen: [],
  };
  return trackChanges(state, enterParagraph(story, state, story.start));
}

// Décrit la création du héros par répartition de points, ou null si l'histoire tire les caractéristiques aux dés.
export function describeCreation(story) {
  if (story.hero.points === undefined) {
    return null;
  }
  return {
    points: story.hero.points,
    stats: Object.entries(story.hero.stats).map(([name, definition]) => ({
      name,
      label: definition.label,
      base: definition.base,
      max: definition.max,
    })),
  };
}

function allocateStats(story, allocation) {
  const creation = describeCreation(story);
  let spent = 0;
  const stats = {};
  for (const stat of creation.stats) {
    const bonus = allocation[stat.name] ?? 0;
    if (bonus < 0 || stat.base + bonus > stat.max) {
      throw new Error(`Répartition invalide pour ${stat.label}`);
    }
    spent += bonus;
    stats[stat.name] = stat.base + bonus;
  }
  if (spent !== creation.points) {
    throw new Error(`${creation.points} points à répartir, ${spent} placés`);
  }
  return stats;
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
  const next = applyEffects(choice.effects, rememberChoice(story, state, choice));
  if (isDead(next)) {
    return trackChanges(state, die(story, next));
  }
  return trackChanges(state, enterParagraph(story, next, choice.to));
}

// Les choix déjà pris dans la partie, identifiés par page et position.
export function hasChosen(story, state, choice) {
  return (state.chosen ?? []).includes(choiceKey(story, state, choice));
}

function rememberChoice(story, state, choice) {
  if (hasChosen(story, state, choice)) {
    return state;
  }
  return { ...state, chosen: [...(state.chosen ?? []), choiceKey(story, state, choice)] };
}

function choiceKey(story, state, choice) {
  return `${state.paragraphId}:${currentParagraph(story, state).choices.indexOf(choice)}`;
}

// Décrit le test de la page courante : caractéristique visée, seuil à ne pas dépasser, dés à lancer.
export function describeTest(story, state) {
  const test = currentParagraph(story, state).test;
  if (!test) {
    return null;
  }
  const stat = test.type === 'luck' ? 'chance' : test.stat;
  return {
    stat,
    label: story.hero.stats[stat].label,
    threshold: state.stats[stat],
    dice: test.type === 'luck' ? LUCK_DICE : test.dice,
    consumesLuck: test.type === 'luck',
  };
}

// Test de Chance : réussite si 2d6 <= Chance ; la Chance baisse de 1 à chaque test.
// Test de caractéristique : réussite si le jet <= caractéristique.
export function resolveTest(story, state, rng = Math.random) {
  const test = describeTest(story, state);
  if (!test) {
    throw new Error('Aucun test à résoudre ici');
  }
  const roll = rollDiceDetailed(test.dice, rng);
  const success = roll.total <= test.threshold;
  let next = state;
  if (test.consumesLuck) {
    next = applyEffects([{ type: 'stat', stat: 'chance', delta: -1 }], state);
  }
  const { success: successTarget, failure: failureTarget } = currentParagraph(story, state).test;
  return {
    state: trackChanges(state, enterParagraph(story, next, success ? successTarget : failureTarget)),
    roll: roll.total,
    dice: roll.dice,
    success,
    threshold: test.threshold,
  };
}

export function fightRound(story, state, rng = Math.random) {
  if (!state.combat) {
    throw new Error('Aucun combat en cours');
  }
  const { combat, round } = resolveAssault(state.combat, state.stats.habilete, rng);
  let next = applyEffects([{ type: 'stat', stat: 'endurance', delta: -round.heroDamage }], state);
  next = { ...next, combat };

  if (isDead(next)) {
    return { state: die(story, next), round };
  }
  if (isEnemyDefeated(combat)) {
    const win = currentParagraph(story, state).combat.win;
    return { state: trackChanges(state, enterParagraph(story, next, win)), round };
  }
  return { state: next, round };
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
  return trackChanges(state, enterParagraph(story, next, flee.to));
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

// Objets et caractéristiques modifiés entre deux pages, pour les mettre en avant dans le texte.
function trackChanges(previous, next) {
  const gained = next.inventory.filter((item) => !previous.inventory.includes(item));
  const lost = previous.inventory.filter((item) => !next.inventory.includes(item));
  const statChanges = Object.keys(next.stats)
    .map((stat) => ({ stat, delta: next.stats[stat] - previous.stats[stat] }))
    .filter((change) => change.delta !== 0);
  return {
    ...next,
    itemChanges: [
      ...gained.map((item) => ({ item, action: 'add' })),
      ...lost.map((item) => ({ item, action: 'remove' })),
    ],
    statChanges,
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
