import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateStory, isEnding } from '../src/engine/story.js';
import { makeStory } from './helpers.js';

const demo = JSON.parse(readFileSync(new URL('../stories/demo/story.json', import.meta.url), 'utf8'));

test('une histoire minimale est valide', () => {
  const story = makeStory({ '1': { text: 'Fin' } });
  assert.deepEqual(validateStory(story), []);
});

test('les cibles, objets et caractéristiques inconnus sont signalés', () => {
  const story = makeStory({
    '1': {
      text: 'Départ',
      effects: [{ type: 'item', action: 'add', item: 'fantome' }],
      choices: [
        { text: 'Aller', to: '99', if: { type: 'stat', stat: 'force', op: '>', value: 1 } },
      ],
      combat: { name: 'X', habilete: 1, endurance: 1, win: '98', flee: { to: '97' } },
      test: { type: 'stat', stat: 'magie', dice: '1d6', success: '96', failure: '95' },
    },
  }, { start: '0', death: 'ailleurs' });
  const errors = validateStory(story);
  for (const needle of ['"0"', '"ailleurs"', '"fantome"', '"99"', '"force"', '"98"', '"97"', '"magie"', '"96"', '"95"']) {
    assert.ok(errors.some((error) => error.includes(needle)), `erreur attendue pour ${needle} :\n${errors.join('\n')}`);
  }
});

test('isEnding : seul un paragraphe sans choix, combat ni test est une fin', () => {
  assert.equal(isEnding({ text: 'x' }), true);
  assert.equal(isEnding({ text: 'x', choices: [] }), true);
  assert.equal(isEnding({ text: 'x', choices: [{ text: 'a', to: '1' }] }), false);
  assert.equal(isEnding({ text: 'x', combat: {} }), false);
  assert.equal(isEnding({ text: 'x', test: {} }), false);
});

test("l'histoire de démo est valide", () => {
  assert.deepEqual(validateStory(demo), []);
});

test("tous les paragraphes de la démo sont atteignables depuis le départ", () => {
  const reachable = new Set([demo.death]);
  const queue = [demo.start];
  while (queue.length > 0) {
    const id = queue.pop();
    if (reachable.has(id)) continue;
    reachable.add(id);
    const paragraph = demo.paragraphs[id];
    (paragraph.choices ?? []).forEach((choice) => queue.push(choice.to));
    if (paragraph.combat) queue.push(paragraph.combat.win);
    if (paragraph.combat?.flee) queue.push(paragraph.combat.flee.to);
    if (paragraph.test) queue.push(paragraph.test.success, paragraph.test.failure);
  }
  const unreachable = Object.keys(demo.paragraphs).filter((id) => !reachable.has(id));
  assert.deepEqual(unreachable, []);
});

test('une réserve de points exige base, max et une capacité suffisante', () => {
  const story = makeStory({ '1': { text: 'Fin' } }, {
    hero: {
      stats: {
        habilete: { label: 'H', base: 7, max: 8 },
        endurance: { label: 'E', base: 14 },
        chance: { label: 'C', base: 7, max: 6 },
      },
      points: 10,
    },
  });
  const errors = validateStory(story);
  assert.ok(errors.some((error) => error.includes('hero.stats.endurance') && error.includes('"max"')));
  assert.ok(errors.some((error) => error.includes('hero.stats.chance') && error.includes('inférieur')));
  assert.ok(errors.some((error) => error.includes('hero.points')));
});

test('une boutique exige une monnaie connue, des objets connus, des prix valides et une sortie', () => {
  const story = makeStory({
    '1': {
      text: 'Étal',
      shop: { currency: 'argent', sell: [{ item: 'fantome', price: -1 }], buy: [{ item: 'clef', price: 'x' }] },
    },
  });
  const errors = validateStory(story);
  assert.ok(errors.some((error) => error.includes('"argent"')));
  assert.ok(errors.some((error) => error.includes('"fantome"')));
  assert.ok(errors.filter((error) => error.includes('prix invalide')).length === 2);
  assert.ok(errors.some((error) => error.includes('quitter la boutique')));
});

test('un combat valide sa caractéristique, ses dégâts et son armure', () => {
  const story = makeStory({
    '1': { text: 'x', combat: { name: 'X', stat: 'force', habilete: 1, endurance: 1, damage: -1, armor: 'x', win: '2' } },
    '2': { text: 'Fin' },
  });
  const errors = validateStory(story);
  assert.ok(errors.some((error) => error.includes('"force"')));
  assert.ok(errors.some((error) => error.includes('damage doit être')));
  assert.ok(errors.some((error) => error.includes('armor doit être')));
});

test('une illustration exige un fichier et un texte alternatif', () => {
  const story = makeStory({ '1': { text: 'Fin', image: { src: 'images/1.webp', alt: 'Une crypte' } } });
  assert.deepEqual(validateStory(story), []);
  const broken = makeStory({ '1': { text: 'Fin', image: { src: '', prompt: 42 } } }, { art: {} });
  const errors = validateStory(broken);
  for (const needle of ['image.src', 'image.alt', 'image.prompt', 'art.style']) {
    assert.ok(errors.some((error) => error.includes(needle)), `erreur attendue pour ${needle} :\n${errors.join('\n')}`);
  }
});
