import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeModifiers, combatBonus, testBonus } from '../src/engine/modifiers.js';
import { createGame, listChoices, choose, fightRound, describeTest, resolveTest } from '../src/engine/game.js';
import { validateStory } from '../src/engine/story.js';
import { makeStory, makeState, minRoll } from './helpers.js';

const modifiers = [
  { label: 'Hache', if: { type: 'item', item: 'hache' }, combat: { attack: 2, damageDealt: 1 } },
  { label: 'Blessé', if: { type: 'stat', stat: 'endurance', op: '<=', value: 5 }, combat: { attack: -1 }, test: { stat: 'habilete', bonus: -2 } },
  { label: 'Amulette', if: { type: 'flag', flag: 'beni' }, combat: { damageTaken: -1 }, test: { stat: 'chance', bonus: 2 } },
];
const story = makeStory({
  '1': { text: 'Départ', choices: [{ text: 'Gobelin', to: '2' }, { text: 'Pont', to: '3' }, { text: 'Porte', to: '4' }] },
  '2': { text: 'Gobelin', combat: { name: 'Gobelin', habilete: 8, endurance: 4, win: '5' } },
  '3': { text: 'Pont', test: { type: 'luck', success: '5', failure: '5' } },
  '4': { text: 'Porte', test: { type: 'stat', stat: 'habilete', dice: '2d6', success: '5', failure: '5' } },
  '5': { text: 'Fin' },
}, { items: { hache: { name: 'Hache' } }, modifiers });

test('activeModifiers ne garde que les règles dont la condition est vraie', () => {
  const state = makeState({ inventory: ['hache'], flags: { beni: true } });
  assert.deepEqual(activeModifiers(story, state).map((m) => m.label), ['Hache', 'Amulette']);
  assert.deepEqual(activeModifiers(story, makeState()).map((m) => m.label), []);
});

test('combatBonus additionne les règles actives par champ', () => {
  const state = makeState({ inventory: ['hache'], flags: { beni: true }, stats: { endurance: 4 } });
  const bonus = combatBonus(story, state);
  assert.equal(bonus.attack, 1);
  assert.equal(bonus.damageDealt, 1);
  assert.equal(bonus.damageTaken, -1);
  assert.deepEqual(bonus.active.map((m) => m.label), ['Hache', 'Blessé', 'Amulette']);
});

test('testBonus ne retient que les règles de la caractéristique testée', () => {
  const state = makeState({ flags: { beni: true }, stats: { endurance: 4 } });
  assert.deepEqual(testBonus(story, state, 'chance'), { bonus: 2, active: [modifiers[2]] });
  assert.equal(testBonus(story, state, 'habilete').bonus, -2);
  assert.equal(testBonus(story, state, 'endurance').bonus, 0);
});

test('fightRound applique les modificateurs du héros', () => {
  let state = createGame(story, minRoll);
  state = { ...state, inventory: ['hache'] };
  state = choose(story, state, listChoices(story, state)[0]);
  const { round } = fightRound(story, state, minRoll);
  assert.equal(round.heroBonus, 2);
  assert.equal(round.heroAttack, 14);
  assert.equal(round.outcome, 'hit');
  assert.equal(round.enemyDamage, 3);
});

test('describeTest et resolveTest intègrent le bonus dans le seuil', () => {
  let state = createGame(story, minRoll);
  state = { ...state, flags: { beni: true } };
  state = choose(story, state, listChoices(story, state)[1]);
  const described = describeTest(story, state);
  assert.equal(described.threshold, 10);
  assert.equal(described.bonus, 2);
  assert.deepEqual(described.modifiers.map((m) => m.label), ['Amulette']);
  assert.equal(resolveTest(story, state, () => 0.8).threshold, 10);
});

test('validateStory contrôle les modificateurs', () => {
  const bad = makeStory({ '1': { text: 'Fin' } }, { modifiers: [
    { if: { type: 'item', item: 'fantome' } },
    { label: 'X', if: { type: 'flag', flag: 'f' }, combat: { attaque: 1, attack: 'x' } },
    { label: 'Y', if: { type: 'flag', flag: 'f' }, test: { stat: 'force', bonus: '2' } },
  ] });
  const errors = validateStory(bad);
  for (const needle of ['"label" manquant', '"fantome"', 'ni "combat" ni "test"', 'combat.attaque inconnu', 'combat.attack doit être un nombre', '"force"', 'test.bonus doit être un nombre']) {
    assert.ok(errors.some((error) => error.includes(needle)), `attendu : ${needle}\n${errors.join('\n')}`);
  }
  assert.deepEqual(validateStory(story), []);
});
