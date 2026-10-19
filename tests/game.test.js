import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, describeCreation, listChoices, choose, resolveTest, describeTest, fightRound, fleeCombat, hasChosen, listOffers, buyItem, sellItem } from '../src/engine/game.js';
import { makeStory, minRoll, maxRoll } from './helpers.js';

const story = makeStory({
  '1': {
    text: 'Départ',
    choices: [
      { text: 'Avancer', to: '2', effects: [{ type: 'item', action: 'add', item: 'clef' }] },
      { text: 'Secret', to: '3', if: { type: 'item', item: 'clef' } },
      { text: 'Piège', to: '4' },
      { text: 'Pont', to: '5' },
      { text: 'Force', to: '6' },
      { text: 'Gobelin', to: '7' },
    ],
  },
  '2': { text: 'Couloir', choices: [{ text: 'Retour', to: '1' }] },
  '3': { text: 'Fin secrète' },
  '4': { text: 'Piège mortel', effects: [{ type: 'stat', stat: 'endurance', delta: -99 }], choices: [{ text: 'Retour', to: '1' }] },
  '5': { text: 'Pont', test: { type: 'luck', success: '2', failure: '4' } },
  '6': { text: 'Porte', test: { type: 'stat', stat: 'habilete', dice: '2d6', success: '2', failure: '3' } },
  '7': { text: 'Gobelin', combat: { name: 'Gobelin', habilete: 6, endurance: 2, win: '3', flee: { to: '2' } } },
  'mort': { text: 'Mort' },
}, { death: 'mort' });

const start = () => createGame(story, minRoll);
const pick = (state, text) => choose(story, state, listChoices(story, state).find((c) => c.text === text));

test('createGame place le héros au départ avec ses stats', () => {
  const state = start();
  assert.equal(state.paragraphId, '1');
  assert.deepEqual(state.stats, { habilete: 10, endurance: 20, chance: 8 });
  assert.deepEqual(state.initialStats, state.stats);
  assert.equal(state.status, 'playing');
});

test('createGame tire les stats quand une formule est fournie', () => {
  const rolled = makeStory(story.paragraphs, {
    hero: { stats: { habilete: { label: 'H', roll: '1d6+6' }, endurance: { label: 'E', roll: '2d6+12' }, chance: { label: 'C', roll: '1d6+6' } } },
  });
  assert.deepEqual(createGame(rolled, maxRoll).stats, { habilete: 12, endurance: 24, chance: 12 });
});

test('listChoices masque les choix dont la condition échoue', () => {
  const state = start();
  assert.deepEqual(listChoices(story, state).map((c) => c.text), ['Avancer', 'Piège', 'Pont', 'Force', 'Gobelin']);
});

test('choose applique les effets du choix puis change de paragraphe', () => {
  let state = pick(start(), 'Avancer');
  assert.equal(state.paragraphId, '2');
  assert.deepEqual(state.inventory, ['clef']);
  state = pick(state, 'Retour');
  assert.ok(listChoices(story, state).some((c) => c.text === 'Secret'));
});

test('choose refuse un choix indisponible', () => {
  const state = start();
  const hidden = story.paragraphs['1'].choices[1];
  assert.throws(() => choose(story, state, hidden), /indisponible/);
});

test('un paragraphe sans suite termine la partie', () => {
  const state = pick(pick(pick(start(), 'Avancer'), 'Retour'), 'Secret');
  assert.equal(state.status, 'ended');
  assert.deepEqual(listChoices(story, state), []);
});

test('endurance à zéro : mort et paragraphe de mort', () => {
  const state = pick(start(), 'Piège');
  assert.equal(state.status, 'dead');
  assert.equal(state.paragraphId, 'mort');
  assert.equal(state.stats.endurance, 0);
});

test('test de chance : réussite consomme 1 point de chance', () => {
  const state = pick(start(), 'Pont');
  assert.deepEqual(describeTest(story, state), { stat: 'chance', label: 'Chance', threshold: 8, bonus: 0, modifiers: [], dice: '2d6', consumesLuck: true });
  const result = resolveTest(story, state, minRoll);
  assert.equal(result.roll, 2);
  assert.deepEqual(result.dice, [1, 1]);
  assert.equal(result.threshold, 8);
  assert.equal(result.success, true);
  assert.equal(result.state.paragraphId, '2');
  assert.equal(result.state.stats.chance, 7);
});

test('test de chance : échec mène au paragraphe d\'échec', () => {
  const result = resolveTest(story, pick(start(), 'Pont'), maxRoll);
  assert.equal(result.success, false);
  assert.equal(result.state.status, 'dead');
});

test('test de caractéristique ne consomme rien', () => {
  assert.equal(describeTest(story, start()), null);
  const result = resolveTest(story, pick(start(), 'Force'), minRoll);
  assert.equal(result.success, true);
  assert.equal(result.state.paragraphId, '2');
  assert.equal(result.state.stats.chance, 8);
});

test('combat : la victoire mène au paragraphe win', () => {
  let state = pick(start(), 'Gobelin');
  assert.equal(state.combat.enemy.name, 'Gobelin');
  assert.deepEqual(listChoices(story, state), []);
  const result = fightRound(story, state, minRoll);
  assert.equal(result.round.outcome, 'hit');
  state = result.state;
  assert.equal(state.combat, null);
  assert.equal(state.paragraphId, '3');
  assert.equal(state.status, 'ended');
});

test('combat : le héros peut mourir', () => {
  const weak = makeStory(story.paragraphs, {
    death: 'mort',
    hero: { stats: { habilete: { label: 'H', value: 1 }, endurance: { label: 'E', value: 2 }, chance: { label: 'C', value: 8 } } },
  });
  const { state, round } = fightRound(weak, pick(createGame(weak, minRoll), 'Gobelin'), minRoll);
  assert.equal(round.outcome, 'wounded');
  assert.equal(state.status, 'dead');
  assert.equal(state.paragraphId, 'mort');
});

test('fuir coûte 2 points d\'endurance et mène au paragraphe flee', () => {
  const state = fleeCombat(story, pick(start(), 'Gobelin'));
  assert.equal(state.paragraphId, '2');
  assert.equal(state.stats.endurance, 18);
  assert.equal(state.combat, null);
});

test('fightRound et fleeCombat refusent sans combat', () => {
  assert.throws(() => fightRound(story, start(), minRoll), /Aucun combat/);
  assert.throws(() => fleeCombat(story, start()), /Impossible de fuir/);
});

test('itemChanges liste les objets gagnés et perdus lors de la transition', () => {
  const state = start();
  assert.deepEqual(state.itemChanges, []);
  const withKey = pick(state, 'Avancer');
  assert.deepEqual(withKey.itemChanges, [{ item: 'clef', action: 'add' }]);
  const back = pick(withKey, 'Retour');
  assert.deepEqual(back.itemChanges, []);
});

test('itemChanges détecte une perte sur les effets du paragraphe', () => {
  const losing = makeStory({
    '1': { text: 'Départ', choices: [{ text: 'Boire', to: '2' }] },
    '2': { text: 'Bu', effects: [{ type: 'item', action: 'remove', item: 'clef' }] },
  }, { hero: { stats: { habilete: { label: 'H', value: 10 }, endurance: { label: 'E', value: 20 }, chance: { label: 'C', value: 8 } }, inventory: ['clef'] } });
  const state = createGame(losing, minRoll);
  const drunk = choose(losing, state, listChoices(losing, state)[0]);
  assert.deepEqual(drunk.itemChanges, [{ item: 'clef', action: 'remove' }]);
});

test('statChanges liste les caractéristiques modifiées lors de la transition', () => {
  const state = start();
  assert.deepEqual(state.statChanges, []);
  const fled = fleeCombat(story, pick(state, 'Gobelin'));
  assert.deepEqual(fled.statChanges, [{ stat: 'endurance', delta: -2 }]);
  const luck = resolveTest(story, pick(state, 'Pont'), minRoll).state;
  assert.deepEqual(luck.statChanges, [{ stat: 'chance', delta: -1 }]);
  assert.deepEqual(pick(fled, 'Retour').statChanges, []);
});

test('hasChosen signale les choix déjà pris sur une page', () => {
  const state = start();
  const [advance, , trap] = listChoices(story, state);
  assert.equal(hasChosen(story, state, advance), false);
  const back = pick(pick(state, 'Avancer'), 'Retour');
  assert.equal(hasChosen(story, back, advance), true);
  assert.equal(hasChosen(story, back, trap), false);
  assert.deepEqual(back.chosen, ['1:0', '2:0']);
  assert.deepEqual(pick(pick(back, 'Avancer'), 'Retour').chosen, ['1:0', '2:0']);
});

const pointBuy = makeStory(story.paragraphs, {
  hero: {
    stats: {
      habilete: { label: 'H', description: 'Adresse au combat.', base: 7, max: 12 },
      endurance: { label: 'E', base: 14, max: 24 },
      chance: { label: 'C', base: 7, max: 12 },
    },
    points: 8,
  },
});

test('describeCreation décrit la réserve, les bornes et les descriptions, ou null sans réserve', () => {
  assert.equal(describeCreation(story), null);
  assert.deepEqual(describeCreation(pointBuy), {
    points: 8,
    stats: [
      { name: 'habilete', label: 'H', description: 'Adresse au combat.', base: 7, max: 12 },
      { name: 'endurance', label: 'E', description: undefined, base: 14, max: 24 },
      { name: 'chance', label: 'C', description: undefined, base: 7, max: 12 },
    ],
  });
});

test('createGame applique la répartition sur les bases', () => {
  const state = createGame(pointBuy, minRoll, { habilete: 3, endurance: 4, chance: 1 });
  assert.deepEqual(state.stats, { habilete: 10, endurance: 18, chance: 8 });
  assert.deepEqual(state.initialStats, state.stats);
});

test('createGame refuse une répartition incomplète, excessive ou hors bornes', () => {
  assert.throws(() => createGame(pointBuy, minRoll, { habilete: 3 }), /8 points à répartir, 3 placés/);
  assert.throws(() => createGame(pointBuy, minRoll, { habilete: 5, endurance: 4 }), /8 points à répartir, 9 placés/);
  assert.throws(() => createGame(pointBuy, minRoll, { habilete: 6, endurance: 2 }), /invalide pour H/);
  assert.throws(() => createGame(pointBuy, minRoll, { habilete: -1, endurance: 9 }), /invalide pour H/);
});

const market = makeStory({
  '1': {
    text: 'Étal',
    shop: {
      currency: 'or',
      sell: [{ item: 'potion', price: 5 }, { item: 'corde', price: 3 }],
      buy: [{ item: 'clef', price: 4 }],
    },
    choices: [{ text: 'Partir', to: '2' }],
  },
  '2': { text: 'Fin' },
}, {
  hero: {
    stats: {
      habilete: { label: 'H', value: 10 },
      endurance: { label: 'E', value: 20 },
      chance: { label: 'C', value: 8 },
      or: { label: 'Or', value: 6, capped: false, unit: "pièce d'or" },
    },
    inventory: ['clef'],
  },
  items: { clef: { name: 'Clef' }, potion: { name: 'Potion' }, corde: { name: 'Corde' } },
});

test('listOffers décrit la boutique selon la bourse et l\'inventaire', () => {
  const state = createGame(market, minRoll);
  assert.equal(listOffers(story, start()), null);
  assert.deepEqual(listOffers(market, state), {
    currency: 'or',
    purse: 6,
    sell: [
      { item: 'potion', price: 5, name: 'Potion', owned: false, affordable: true },
      { item: 'corde', price: 3, name: 'Corde', owned: false, affordable: true },
    ],
    buy: [{ item: 'clef', price: 4, name: 'Clef', owned: true }],
  });
});

test('buyItem débite la bourse, ajoute l\'objet et refuse ensuite', () => {
  const state = buyItem(market, createGame(market, minRoll), 'potion');
  assert.equal(state.stats.or, 1);
  assert.deepEqual(state.inventory, ['clef', 'potion']);
  assert.deepEqual(state.itemChanges, [{ item: 'potion', action: 'add' }]);
  assert.deepEqual(state.statChanges, [{ stat: 'or', delta: -5 }]);
  assert.throws(() => buyItem(market, state, 'potion'), /Achat impossible/);
  assert.throws(() => buyItem(market, state, 'corde'), /Achat impossible/);
});

test('sellItem crédite la bourse sans plafond et retire l\'objet', () => {
  const state = sellItem(market, createGame(market, minRoll), 'clef');
  assert.equal(state.stats.or, 10);
  assert.deepEqual(state.inventory, []);
  assert.throws(() => sellItem(market, state, 'clef'), /Vente impossible/);
});

test('createGame fige les caractéristiques à valeur fixe hors de la répartition', () => {
  const withGold = makeStory(story.paragraphs, {
    hero: {
      stats: {
        habilete: { label: 'H', base: 7, max: 12 },
        endurance: { label: 'E', base: 14, max: 24 },
        chance: { label: 'C', base: 7, max: 12 },
        or: { label: 'Or', value: 6, capped: false },
      },
      points: 8,
    },
  });
  assert.deepEqual(describeCreation(withGold).stats.map((stat) => stat.name), ['habilete', 'endurance', 'chance']);
  const state = createGame(withGold, minRoll, { habilete: 3, endurance: 4, chance: 1 });
  assert.equal(state.stats.or, 6);
  assert.deepEqual(state.caps, { habilete: 10, endurance: 18, chance: 8 });
});

test('un combat peut se jouer sur une autre caractéristique, et fuir coûte les dégâts de l\'adversaire', () => {
  const chase = makeStory({
    '1': { text: 'Départ', choices: [{ text: 'Courir', to: '2' }] },
    '2': { text: 'Poursuite', combat: { name: 'Chiens', stat: 'endurance', habilete: 5, endurance: 2, damage: 3, win: '3', flee: { to: '3' } } },
    '3': { text: 'Fin' },
  }, { modifiers: [
    { label: 'Hache', if: { type: 'stat', stat: 'habilete', op: '>=', value: 1 }, combat: { attack: 5, stat: 'habilete' } },
    { label: 'Bottes', if: { type: 'stat', stat: 'habilete', op: '>=', value: 1 }, combat: { attack: 1, stat: 'endurance' } },
  ] });
  const state = choose(chase, createGame(chase, minRoll), listChoices(chase, createGame(chase, minRoll))[0]);
  assert.equal(state.combat.enemy.stat, 'endurance');
  const { round } = fightRound(chase, state, minRoll);
  assert.equal(round.heroBonus, 1);
  assert.equal(round.heroAttack, 2 + 20 + 1);
  assert.equal(fleeCombat(chase, state).stats.endurance, 17);
});

test('une caractéristique avec tick avance à chaque choix, en silence, mais pas sur un test', () => {
  const clock = makeStory({
    '1': { text: 'Départ', choices: [{ text: 'Avancer', to: '2' }] },
    '2': { text: 'Couloir', effects: [{ type: 'stat', stat: 'temps', delta: -5 }], choices: [{ text: 'Sauter', to: '3' }] },
    '3': { text: 'Saut', test: { type: 'stat', stat: 'habilete', dice: '1d6', success: '2', failure: '2' } },
    '4': { text: 'Trop tard' },
  }, {
    hero: { stats: { habilete: { label: 'H', value: 10 }, endurance: { label: 'E', value: 20 }, chance: { label: 'C', value: 8 }, temps: { label: 'Temps', value: 10, capped: false, tick: -2 } } },
    triggers: [{ label: 'Trop tard', if: { type: 'stat', stat: 'temps', op: '=', value: 0 }, to: '4' }],
  });
  const first = createGame(clock, minRoll);
  assert.equal(first.stats.temps, 10);
  const second = choose(clock, first, listChoices(clock, first)[0]);
  assert.equal(second.stats.temps, 3);
  assert.deepEqual(second.statChanges, [{ stat: 'temps', delta: -5 }]);
  assert.equal(second.ticked, undefined);
  const third = choose(clock, second, listChoices(clock, second)[0]);
  assert.equal(third.stats.temps, 1);
  const fourth = resolveTest(clock, third, minRoll).state;
  assert.equal(fourth.stats.temps, 0);
  assert.deepEqual(fourth.statChanges, [{ stat: 'temps', delta: -1 }]);
  const fifth = choose(clock, fourth, listChoices(clock, fourth)[0]);
  assert.equal(fifth.paragraphId, '4');
  assert.equal(fifth.status, 'ended');
});

test('isFavorable lit une jauge inversée à l\'envers', async () => {
  const { isFavorable } = await import('../src/engine/game.js');
  const story = makeStory({ '1': { text: 'Fin' } }, { hero: { stats: { endurance: { label: 'E', value: 10 }, radiation: { label: 'R', value: 0, inverted: true } } } });
  assert.equal(isFavorable(story, 'endurance', 2), true);
  assert.equal(isFavorable(story, 'endurance', -2), false);
  assert.equal(isFavorable(story, 'radiation', 2), false);
  assert.equal(isFavorable(story, 'radiation', -2), true);
});
