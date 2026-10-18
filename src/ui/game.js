import { el } from './dom.js';
import { renderDice } from './dice.js';
import { currentParagraph, listChoices, hasChosen, describeTest } from '../engine/game.js';

// `roll` décrit un lancer de dés en cours d'animation ; `fx` les effets visuels à jouer une fois sur ce rendu.
export function renderGame({ story, state, lastRoll, menuOpen, muted, roll, fx, handlers }) {
  const view = roll?.view ?? state;
  const paragraph = currentParagraph(story, state);
  return el('main', { class: 'screen game' }, [
    renderHeader(story, view, fx, menuOpen, handlers),
    menuOpen && renderMenu(story, state, muted, handlers),
    el('article', { class: 'page' }, [
      el('p', { class: 'page-number' }, state.paragraphId),
      lastRoll && renderRoll(lastRoll),
      ...renderText(story, state, paragraph.text),
      renderActions(story, state, view, paragraph, { roll, fx, handlers }),
    ]),
  ]);
}

function renderHeader(story, view, fx, menuOpen, handlers) {
  return el('header', { class: 'game-header' }, [
    el('button', { class: 'btn-icon', 'aria-label': 'Retour à la bibliothèque', onClick: handlers.onQuit }, '‹'),
    el('ul', { class: 'stats' }, Object.entries(story.hero.stats).map(([name, definition]) => {
      const delta = fx?.statDeltas?.[name];
      return el('li', { class: 'stat' }, [
        el('span', { class: 'stat-label' }, definition.label),
        el('span', { class: `stat-value${delta ? ' is-bumped' : ''}` }, `${view.stats[name]}/${view.initialStats[name]}`),
        delta && el('span', { class: `stat-delta ${delta > 0 ? 'delta-gain' : 'delta-loss'}` }, formatDelta(delta)),
      ]);
    })),
    el('button', {
      class: `btn-icon${menuOpen ? ' is-active' : ''}`,
      'aria-label': 'Inventaire et options',
      'aria-expanded': String(menuOpen),
      onClick: handlers.onToggleMenu,
    }, '☰'),
  ]);
}

function renderMenu(story, state, muted, handlers) {
  const items = state.inventory.map((id) => story.items[id]?.name ?? id);
  return el('section', { class: 'menu' }, [
    el('h2', { class: 'menu-title' }, 'Inventaire'),
    items.length === 0
      ? el('p', { class: 'menu-empty' }, 'Votre sac est vide.')
      : el('ul', { class: 'inventory-list' }, items.map((name) => el('li', {}, name))),
    el('button', { class: 'btn btn-ghost btn-small', onClick: handlers.onToggleSound }, muted ? '🔇 Son coupé' : '🔊 Son activé'),
  ]);
}

function renderRoll(lastRoll) {
  return el('p', { class: `roll ${lastRoll.success ? 'roll-success' : 'roll-failure'}` },
    `Jet de dés : ${lastRoll.roll}. ${lastRoll.success ? 'Réussite.' : 'Échec.'}`);
}

function renderActions(story, state, view, paragraph, { roll, fx, handlers }) {
  if (roll?.kind === 'test') {
    return renderTest(story, state, { roll, handlers });
  }
  if (roll?.kind === 'combat') {
    return renderCombat(view, paragraph, { roll, fx, handlers });
  }
  if (state.status !== 'playing') {
    return renderEnding(state, handlers);
  }
  if (state.combat) {
    return renderCombat(state, paragraph, { fx, handlers });
  }
  if (paragraph.test) {
    return renderTest(story, state, { handlers });
  }
  return el('div', { class: 'choices' }, listChoices(story, state).map((choice) =>
    el('button', {
      class: `btn btn-choice${hasChosen(story, state, choice) ? ' is-chosen' : ''}`,
      onClick: () => handlers.onChoose(choice),
    }, choice.text)));
}

// Panneau de test : seuil annoncé avant le lancer, dés, puis verdict.
function renderTest(story, state, { roll, handlers }) {
  const test = describeTest(story, state);
  const phase = roll?.phase ?? 'idle';
  const settled = phase === 'settled' || phase === 'verdict';
  const faces = roll && settled ? roll.dice : roll ? roll.dice.map(() => 0) : [0, 0];
  return el('section', { class: 'test' }, [
    el('p', { class: 'test-threshold' }, `Testez votre ${test.label} : il vous faut ${test.threshold} ou moins.`),
    renderDice(faces, { rolling: phase === 'rolling', settled: phase === 'settled' }),
    settled && el('p', { class: 'test-total' }, String(roll.roll)),
    phase === 'verdict' && el('p', { class: `verdict ${roll.success ? 'verdict-success' : 'verdict-failure'}` },
      roll.success ? `${roll.roll} ≤ ${roll.threshold} : réussite !` : `${roll.roll} > ${roll.threshold} : échec.`),
    el('div', { class: 'choices' }, [
      el('button', { class: 'btn btn-primary', disabled: Boolean(roll), onClick: handlers.onResolveTest }, 'Lancer les dés'),
    ]),
  ]);
}

// Panneau de combat : l'adversaire lance en premier, puis le héros, puis le verdict.
function renderCombat(view, paragraph, { roll, fx, handlers }) {
  const { combat } = view;
  const phase = roll?.phase ?? 'idle';
  const round = roll?.round ?? combat.lastRound;
  const enemySettled = phase === 'enemy' || phase === 'hero' || phase === 'verdict' || (!roll && round);
  const heroSettled = phase === 'hero' || phase === 'verdict' || (!roll && round);
  const showVerdict = round && (phase === 'verdict' || !roll);
  const outcomeClass = fx?.outcome ? ` is-${fx.outcome}` : '';

  return el('section', { class: `combat${outcomeClass}` }, [
    el('div', { class: 'combat-enemy' }, [
      el('h2', { class: 'combat-name' }, combat.enemy.name),
      el('p', { class: 'combat-stats' },
        `Habileté ${combat.enemy.habilete} · Endurance ${combat.enemyEndurance}/${combat.enemy.endurance}`),
      renderEnduranceBar(combat, fx?.enemyFrom),
    ]),
    el('div', { class: 'duel' }, [
      renderDuelRow(combat.enemy.name, combat.enemy.habilete, round?.enemyDice, round?.enemyAttack, {
        rolling: phase === 'rolling',
        settled: enemySettled,
        justSettled: phase === 'enemy',
      }),
      renderDuelRow('Vous', view.stats.habilete, round?.heroDice, round?.heroAttack, {
        rolling: phase === 'rolling' || phase === 'enemy',
        settled: heroSettled,
        justSettled: phase === 'hero',
      }),
    ]),
    showVerdict && el('p', { class: `verdict verdict-${round.outcome}` }, describeOutcome(round.outcome)),
    el('div', { class: 'choices' }, [
      el('button', { class: 'btn btn-primary', disabled: Boolean(roll), onClick: handlers.onFight }, `Assaut ${combat.round + 1}`),
      paragraph.combat.flee && el('button', { class: 'btn btn-ghost', disabled: Boolean(roll), onClick: handlers.onFlee }, 'Fuir (−2 Endurance)'),
    ]),
  ]);
}

function renderDuelRow(name, habilete, dice, attack, { rolling, settled, justSettled }) {
  const faces = settled ? dice : [0, 0];
  return el('div', { class: 'duel-row' }, [
    el('span', { class: 'duel-name' }, name),
    el('span', { class: 'duel-total' }, settled ? [`+ ${habilete} = `, el('strong', {}, String(attack))] : null),
    renderDice(faces, { rolling, settled: justSettled }),
  ]);
}

// La barre part de l'ancienne valeur et glisse vers la nouvelle quand `from` est fourni.
function renderEnduranceBar(combat, from) {
  const percent = (value) => `${Math.max(0, (value / combat.enemy.endurance) * 100)}%`;
  const fill = el('span', { class: 'bar-fill', style: `width: ${percent(from ?? combat.enemyEndurance)}` });
  if (from !== undefined) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.width = percent(combat.enemyEndurance);
    }));
  }
  return el('span', { class: 'bar' }, fill);
}

function describeOutcome(outcome) {
  if (outcome === 'hit') return 'Vous blessez votre adversaire !';
  if (outcome === 'wounded') return 'Vous êtes blessé.';
  return 'Les coups se croisent sans toucher.';
}

function formatDelta(delta) {
  return delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`;
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
