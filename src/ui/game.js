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

// Surligne, dans le texte, le nom des objets obtenus ou perdus en arrivant sur cette page.
// Si un objet n'est pas nommé dans le texte, une mention est ajoutée après le dernier paragraphe.
function renderText(story, state, text) {
  const pending = (state.itemChanges ?? []).map((change) => ({
    ...change,
    name: story.items[change.item]?.name ?? change.item,
  }));
  const paragraphs = [].concat(text).map((chunk) =>
    el('p', { class: 'page-text' }, highlightItems(frenchSpacing(chunk), pending)));
  if (pending.length > 0) {
    paragraphs.push(el('p', { class: 'page-text page-items' }, pending.flatMap((change, index) => [
      index > 0 ? ', ' : (change.action === 'add' ? 'Vous obtenez : ' : 'Vous perdez : '),
      renderItemMark(change, change.name),
    ])));
  }
  return paragraphs;
}

function highlightItems(text, pending) {
  for (const [index, change] of pending.entries()) {
    const match = findItemMention(text, change.name);
    if (!match) continue;
    pending.splice(index, 1);
    const [before, after] = [text.slice(0, match.index), text.slice(match.index + match.length)];
    return [...highlightItems(before, pending), renderItemMark(change, match.text), ...highlightItems(after, pending)];
  }
  return [text];
}

// Cherche le nom complet de l'objet, puis son premier mot (« amulette » pour « Amulette d'os »).
function findItemMention(text, name) {
  const candidates = [name, name.split(/[\s']/)[0]].filter((candidate) => candidate.length >= 4);
  for (const candidate of candidates) {
    const match = new RegExp(escapeRegExp(candidate), 'i').exec(text);
    if (match) return { index: match.index, length: match[0].length, text: match[0] };
  }
  return null;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderItemMark(change, text) {
  return el('mark', { class: `item-mark item-${change.action}` }, text);
}

// Espaces insécables de la typographie française.
function frenchSpacing(text) {
  return text.replace(/ ([:;!?»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
}
