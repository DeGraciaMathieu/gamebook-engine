import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, listChoices, choose, pendingTrigger, fightRound, resolveTest } from '../src/engine/game.js';
import { validateStory } from '../src/engine/story.js';
import { makeStory, minRoll } from './helpers.js';

const story = makeStory({
  '1': { text: 'Camp', choices: [{ text: 'Froid', to: '2', effects: [{ type: 'stat', stat: 'chance', delta: -8 }] }, { text: 'Gobelin', to: '5' }, { text: 'Pont', to: '6' }] },
  '2': { text: 'Nuit glaciale', choices: [{ text: 'Matin', to: '3' }] },
  '3': { text: 'Matin', choices: [{ text: 'Suite', to: '4' }] },
  '4': { text: 'Fin' },
  '5': { text: 'Gobelin', effects: [{ type: 'stat', stat: 'chance', delta: -8 }], combat: { name: 'Gobelin', habilete: 1, endurance: 2, win: '3' } },
  '6': { text: 'Pont', effects: [{ type: 'stat', stat: 'chance', delta: -8 }], test: { type: 'luck', success: '3', failure: '3' } },
  'silence': { text: 'Silence', choices: [{ text: 'Marcher', to: '4' }] },
}, { triggers: [{ label: 'Plus de chance', if: { type: 'stat', stat: 'chance', op: '=', value: 0 }, to: 'silence' }] });
const pick = (state, text) => choose(story, state, listChoices(story, state).find((c) => c.text === text));

test('le déclencheur ne détourne qu\'au déplacement suivant, le paragraphe fautif reste lisible', () => {
  const cold = pick(createGame(story, minRoll), 'Froid');
  assert.equal(cold.paragraphId, '2');
  assert.equal(cold.stats.chance, 0);
  assert.equal(pendingTrigger(story, cold).label, 'Plus de chance');
  const next = pick(cold, 'Matin');
  assert.equal(next.paragraphId, 'silence');
  assert.deepEqual(next.fired, [0]);
});

test('un déclencheur ne tire qu\'une fois par défaut', () => {
  const silence = pick(pick(createGame(story, minRoll), 'Froid'), 'Matin');
  const after = pick(silence, 'Marcher');
  assert.equal(after.paragraphId, '4');
  assert.equal(pendingTrigger(story, after), undefined);
});

test('un déclencheur répétable ne tire pas vers le paragraphe courant', () => {
  const repeating = makeStory(story.paragraphs, { triggers: [{ ...story.triggers[0], once: false }] });
  const pickIn = (state, text) => choose(repeating, state, listChoices(repeating, state).find((c) => c.text === text));
  const silence = pickIn(pickIn(createGame(repeating, minRoll), 'Froid'), 'Matin');
  assert.equal(silence.paragraphId, 'silence');
  assert.deepEqual(silence.fired, []);
  assert.equal(pendingTrigger(repeating, silence), undefined);
  assert.equal(pickIn(silence, 'Marcher').paragraphId, '4');
});

test('les déclencheurs valent aussi après un combat et un test', () => {
  const state = createGame(story, minRoll);
  const fight = pick(state, 'Gobelin');
  assert.equal(fight.paragraphId, '5');
  const won = fightRound(story, fight, minRoll).state;
  assert.equal(won.paragraphId, 'silence');
  const bridge = pick(state, 'Pont');
  assert.equal(bridge.paragraphId, '6');
  assert.equal(resolveTest(story, bridge, minRoll).state.paragraphId, 'silence');
});

test('validateStory contrôle les déclencheurs', () => {
  const bad = makeStory({ '1': { text: 'Fin' } }, { triggers: [{ to: '99' }, { if: { type: 'item', item: 'fantome' }, to: '1' }] });
  const errors = validateStory(bad);
  assert.ok(errors.some((error) => error.includes('déclencheur 1') && error.includes('"if"')));
  assert.ok(errors.some((error) => error.includes('"99"')));
  assert.ok(errors.some((error) => error.includes('"fantome"')));
  assert.deepEqual(validateStory(story), []);
});
