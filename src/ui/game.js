import { el } from './dom.js';
import { currentParagraph, listChoices } from '../engine/game.js';

export function renderGame({ story, state, lastRoll, inventoryOpen, handlers }) {
  const paragraph = currentParagraph(story, state);
  return el('main', { class: 'screen game' }, [
    renderHeader(story, state, inventoryOpen, handlers),
    inventoryOpen && renderInventory(story, state),
    el('article', { class: 'page' }, [
      el('p', { class: 'page-number' }, state.paragraphId),
      lastRoll && renderRoll(lastRoll),
      ...renderText(story, state, paragraph.text),
      renderActions(story, state, paragraph, handlers),
    ]),
  ]);
}

function renderHeader(story, state, inventoryOpen, handlers) {
  return el('header', { class: 'game-header' }, [
    el('button', { class: 'btn-icon', 'aria-label': 'Retour à la bibliothèque', onClick: handlers.onQuit }, '‹'),
    el('ul', { class: 'stats' }, Object.entries(story.hero.stats).map(([name, definition]) =>
      el('li', { class: 'stat' }, [
        el('span', { class: 'stat-label' }, definition.label),
        el('span', { class: 'stat-value' }, `${state.stats[name]}/${state.initialStats[name]}`),
      ]))),
    el('button', {
      class: `btn-icon${inventoryOpen ? ' is-active' : ''}`,
      'aria-label': 'Inventaire',
      'aria-expanded': String(inventoryOpen),
      onClick: handlers.onToggleInventory,
    }, '☰'),
  ]);
}

function renderInventory(story, state) {
  const items = state.inventory.map((id) => story.items[id]?.name ?? id);
  return el('section', { class: 'inventory' }, [
    el('h2', { class: 'inventory-title' }, 'Inventaire'),
    items.length === 0
      ? el('p', { class: 'inventory-empty' }, 'Votre sac est vide.')
      : el('ul', { class: 'inventory-list' }, items.map((name) => el('li', {}, name))),
  ]);
}

function renderRoll(lastRoll) {
  return el('p', { class: `roll ${lastRoll.success ? 'roll-success' : 'roll-failure'}` },
    `Jet de dés : ${lastRoll.roll}. ${lastRoll.success ? 'Réussite.' : 'Échec.'}`);
}

function renderActions(story, state, paragraph, handlers) {
  if (state.status !== 'playing') {
    return renderEnding(state, handlers);
  }
  if (state.combat) {
    return renderCombat(state, paragraph, handlers);
  }
  if (paragraph.test) {
    return el('div', { class: 'choices' }, [
      el('button', { class: 'btn btn-primary', onClick: handlers.onResolveTest }, 'Lancer les dés'),
    ]);
  }
  return el('div', { class: 'choices' }, listChoices(story, state).map((choice) =>
    el('button', { class: 'btn btn-choice', onClick: () => handlers.onChoose(choice) }, choice.text)));
}

function renderCombat(state, paragraph, handlers) {
  const { combat } = state;
  return el('section', { class: 'combat' }, [
    el('div', { class: 'combat-enemy' }, [
      el('h2', { class: 'combat-name' }, combat.enemy.name),
      el('p', { class: 'combat-stats' },
        `Habileté ${combat.enemy.habilete} · Endurance ${combat.enemyEndurance}/${combat.enemy.endurance}`),
    ]),
    combat.lastRound && el('p', { class: `combat-log combat-${combat.lastRound.outcome}` }, describeRound(combat.lastRound)),
    el('div', { class: 'choices' }, [
      el('button', { class: 'btn btn-primary', onClick: handlers.onFight }, `Assaut ${combat.round + 1}`),
      paragraph.combat.flee && el('button', { class: 'btn btn-ghost', onClick: handlers.onFlee }, 'Fuir (−2 Endurance)'),
    ]),
  ]);
}

function describeRound({ heroAttack, enemyAttack, outcome }) {
  const scores = `Vous ${heroAttack} contre ${enemyAttack}.`;
  if (outcome === 'hit') return `${scores} Vous blessez votre adversaire.`;
  if (outcome === 'wounded') return `${scores} Vous êtes blessé.`;
  return `${scores} Les coups se croisent sans toucher.`;
}

function renderEnding(state, handlers) {
  return el('div', { class: 'ending' }, [
    el('p', { class: 'ending-title' }, state.status === 'dead' ? 'Vous êtes mort.' : 'Fin'),
    el('div', { class: 'choices' }, [
      el('button', { class: 'btn btn-primary', onClick: handlers.onRestart }, 'Recommencer'),
      el('button', { class: 'btn btn-ghost', onClick: handlers.onQuit }, 'Retour à la bibliothèque'),
    ]),
  ]);
}

// Surligne, dans le texte, les objets et caractéristiques modifiés en arrivant sur cette page.
// Ce qui n'est pas mentionné dans le texte est récapitulé après le dernier paragraphe.
function renderText(story, state, text) {
  const pending = [
    ...(state.itemChanges ?? []).map((change) => describeItemChange(story, change)),
    ...(state.statChanges ?? []).map((change) => describeStatChange(story, change)),
  ];
  const paragraphs = [].concat(text).map((chunk) =>
    el('p', { class: 'page-text' }, highlightMentions(frenchSpacing(chunk), pending)));
  if (pending.length > 0) {
    paragraphs.push(el('p', { class: 'page-text page-changes' }, pending.flatMap((change, index) => [
      index > 0 ? ' · ' : null,
      renderMark(change, change.summary),
    ])));
  }
  return paragraphs;
}

function describeItemChange(story, change) {
  const name = story.items[change.item]?.name ?? change.item;
  const gained = change.action === 'add';
  return {
    className: gained ? 'item-add' : 'item-remove',
    patterns: [escapeRegExp(name), firstWordPattern(name)],
    summary: `${gained ? 'Vous obtenez' : 'Vous perdez'} : ${name}`,
  };
}

function describeStatChange(story, change) {
  const label = story.hero.stats[change.stat]?.label ?? change.stat;
  const gained = change.delta > 0;
  return {
    className: gained ? 'stat-gain' : 'stat-loss',
    patterns: [`\\d+ points? d['’]${escapeRegExp(label)}`, escapeRegExp(label)],
    summary: `${label} ${gained ? '+' : '−'}${Math.abs(change.delta)}`,
  };
}

// Premier mot d'un nom, s'il est assez long pour être significatif (« amulette » pour « Amulette d'os »).
function firstWordPattern(name) {
  const word = name.split(/[\s']/)[0];
  return word.length >= 4 ? escapeRegExp(word) : null;
}

function highlightMentions(text, pending) {
  for (const [index, change] of pending.entries()) {
    const match = findMention(text, change.patterns);
    if (!match) continue;
    pending.splice(index, 1);
    const [before, after] = [text.slice(0, match.index), text.slice(match.index + match.length)];
    return [...highlightMentions(before, pending), renderMark(change, match.text), ...highlightMentions(after, pending)];
  }
  return [text];
}

function findMention(text, patterns) {
  for (const pattern of patterns) {
    if (!pattern) continue;
    const match = new RegExp(pattern, 'i').exec(text);
    if (match) return { index: match.index, length: match[0].length, text: match[0] };
  }
  return null;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderMark(change, text) {
  return el('mark', { class: `mark ${change.className}` }, text);
}

// Espaces insécables de la typographie française.
function frenchSpacing(text) {
  return text.replace(/ ([:;!?»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
}
