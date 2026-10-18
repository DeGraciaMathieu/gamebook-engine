import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, listChoices, choose, resolveTest, fightRound, fleeCombat } from '../src/engine/game.js';
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
  const result = resolveTest(story, state, minRoll);
  assert.equal(result.roll, 2);
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
  const result = resolveTest(story, pick(start(), 'Force'), minRoll);
  assert.equal(result.success, true);
  assert.equal(result.state.paragraphId, '2');
  assert.equal(result.state.stats.chance, 8);
});

test('combat : la victoire mène au paragraphe win', () => {
  let state = pick(start(), 'Gobelin');
  assert.equal(state.combat.enemy.name, 'Gobelin');
  assert.deepEqual(listChoices(story, state), []);
  state = fightRound(story, state, minRoll);
  assert.equal(state.combat, null);
  assert.equal(state.paragraphId, '3');
  assert.equal(state.status, 'ended');
});

test('combat : le héros peut mourir', () => {
  const weak = makeStory(story.paragraphs, {
    death: 'mort',
    hero: { stats: { habilete: { label: 'H', value: 1 }, endurance: { label: 'E', value: 2 }, chance: { label: 'C', value: 8 } } },
  });
  const state = fightRound(weak, pick(createGame(weak, minRoll), 'Gobelin'), minRoll);
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
