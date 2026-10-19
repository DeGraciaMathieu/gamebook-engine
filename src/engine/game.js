import { rollDice, rollDiceDetailed } from './dice.js';
import { isConditionMet } from './conditions.js';
import { applyEffects } from './effects.js';
import { startCombat, resolveAssault, isEnemyDefeated, fleeDamage } from './combat.js';
import { getParagraph, isEnding } from './story.js';
import { combatBonus, testBonus } from './modifiers.js';

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
    caps: statCaps(story, stats),
    flags: { ...(story.hero.flags ?? {}) },
    inventory: [...(story.hero.inventory ?? [])],
    combat: null,
    status: 'playing',
    itemChanges: [],
    statChanges: [],
    chosen: [],
    fired: [],
  };
  return trackChanges(state, enterParagraph(story, state, story.start));
}

export function isCapped(story, stat) {
  return story.hero.stats[stat].capped !== false;
}

function statCaps(story, stats) {
  const caps = {};
  for (const stat of Object.keys(stats)) {
    if (isCapped(story, stat)) caps[stat] = stats[stat];
  }
  return caps;
}

// Décrit la création du héros par répartition de points, ou null si l'histoire tire les caractéristiques aux dés.
// Seules les caractéristiques avec une base et un maximum sont à répartir ; les autres ont une valeur fixe.
export function describeCreation(story) {
  if (story.hero.points === undefined) {
    return null;
  }
  return {
    points: story.hero.points,
    stats: Object.entries(story.hero.stats)
      .filter(([, definition]) => definition.base !== undefined)
      .map(([name, definition]) => ({
        name,
        label: definition.label,
        description: definition.description,
        base: definition.base,
        max: definition.max,
      })),
  };
}

function allocateStats(story, allocation) {
  const creation = describeCreation(story);
  let spent = 0;
  const stats = {};
  for (const [name, definition] of Object.entries(story.hero.stats)) {
    if (definition.base === undefined) stats[name] = definition.value;
  }
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
  return trackChanges(state, travel(story, state, tickStats(story, next), choice.to));
}

// Une caractéristique avec `tick` est une horloge : elle varie à chaque décision prise, sans que le texte
// l'annonce. Résoudre un test ou un assaut n'est pas une décision et ne la fait pas avancer.
function tickStats(story, state) {
  const effects = Object.entries(story.hero.stats)
    .filter(([, definition]) => definition.tick)
    .map(([stat, definition]) => ({ type: 'stat', stat, delta: definition.tick }));
  const next = applyEffects(effects, state);
  const ticked = Object.fromEntries(effects.map(({ stat }) => [stat, next.stats[stat] - state.stats[stat]]));
  return { ...next, ticked };
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

// Boutique de la page courante : articles à acheter et objets rachetés, avec ce qui est possible pour le héros.
export function listOffers(story, state) {
  const shop = currentParagraph(story, state).shop;
  if (!shop || state.status !== 'playing') {
    return null;
  }
  const purse = state.stats[shop.currency];
  return {
    currency: shop.currency,
    purse,
    sell: (shop.sell ?? []).map((offer) => ({
      ...offer,
      name: story.items[offer.item]?.name ?? offer.item,
      owned: state.inventory.includes(offer.item),
      affordable: purse >= offer.price,
    })),
    buy: (shop.buy ?? []).map((offer) => ({
      ...offer,
      name: story.items[offer.item]?.name ?? offer.item,
      owned: state.inventory.includes(offer.item),
    })),
  };
}

export function buyItem(story, state, item) {
  const offer = listOffers(story, state)?.sell.find((candidate) => candidate.item === item);
  if (!offer || offer.owned || !offer.affordable) {
    throw new Error('Achat impossible');
  }
  return trackChanges(state, applyEffects([
    { type: 'stat', stat: currentParagraph(story, state).shop.currency, delta: -offer.price },
    { type: 'item', action: 'add', item },
  ], state));
}

export function sellItem(story, state, item) {
  const offer = listOffers(story, state)?.buy.find((candidate) => candidate.item === item);
  if (!offer || !offer.owned) {
    throw new Error('Vente impossible');
  }
  return trackChanges(state, applyEffects([
    { type: 'stat', stat: currentParagraph(story, state).shop.currency, delta: offer.price },
    { type: 'item', action: 'remove', item },
  ], state));
}

// Décrit le test de la page courante : caractéristique visée, seuil à ne pas dépasser, dés à lancer.
export function describeTest(story, state) {
  const test = currentParagraph(story, state).test;
  if (!test) {
    return null;
  }
  const stat = test.type === 'luck' ? 'chance' : test.stat;
  const { bonus, active } = testBonus(story, state, stat);
  return {
    stat,
    label: story.hero.stats[stat].label,
    threshold: state.stats[stat] + bonus,
    bonus,
    modifiers: active,
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
    state: trackChanges(state, travel(story, state, next, success ? successTarget : failureTarget)),
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
  const stat = state.combat.enemy.stat ?? 'habilete';
  const { combat, round } = resolveAssault(state.combat, state.stats[stat], rng, combatBonus(story, state, stat));
  let next = applyEffects([{ type: 'stat', stat: 'endurance', delta: -round.heroDamage }], state);
  next = { ...next, combat };

  if (isDead(next)) {
    return { state: die(story, next), round };
  }
  if (isEnemyDefeated(combat)) {
    const win = currentParagraph(story, state).combat.win;
    return { state: trackChanges(state, travel(story, state, next, win)), round };
  }
  return { state: next, round };
}

// Fuir laisse à l'adversaire un coup gratuit.
export function fleeCombat(story, state) {
  const flee = currentParagraph(story, state).combat?.flee;
  if (!state.combat || !flee) {
    throw new Error('Impossible de fuir ce combat');
  }
  const next = applyEffects([{ type: 'stat', stat: 'endurance', delta: -fleeDamage(state.combat) }], state);
  if (isDead(next)) {
    return die(story, next);
  }
  return trackChanges(state, travel(story, state, next, flee.to));
}

// Un déplacement : si un déclencheur est armé, il détourne vers son paragraphe à la place de la cible.
// Évalué sur l'état au moment où le joueur agit (`before`), avant les effets de l'action :
// le paragraphe où la condition a basculé a donc toujours été lu.
function travel(story, before, next, paragraphId) {
  const trigger = pendingTrigger(story, before);
  if (!trigger) {
    return enterParagraph(story, next, paragraphId);
  }
  const fired = trigger.once === false ? next.fired ?? [] : [...(next.fired ?? []), trigger.index];
  return enterParagraph(story, { ...next, fired }, trigger.to);
}

export function pendingTrigger(story, state) {
  const fired = state.fired ?? [];
  return (story.triggers ?? [])
    .map((trigger, index) => ({ ...trigger, index }))
    .find((trigger) => !fired.includes(trigger.index) && trigger.to !== state.paragraphId && isConditionMet(trigger.if, state));
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
// L'avancée silencieuse des horloges n'en fait pas partie.
function trackChanges(previous, { ticked = {}, ...next }) {
  const gained = next.inventory.filter((item) => !previous.inventory.includes(item));
  const lost = previous.inventory.filter((item) => !next.inventory.includes(item));
  const statChanges = Object.keys(next.stats)
    .map((stat) => ({ stat, delta: next.stats[stat] - previous.stats[stat] - (ticked[stat] ?? 0) }))
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
