import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  THRESHOLDS, checkProse, diffProse, hasDialogue, isNominal, measureGroup, measureParagraph, repeatedNgrams, sentences,
} from '../scripts/lib/story-prose.mjs';

const blacklist = [{ label: 'quelque chose', re: /\bquelque chose\b/iu }];

test('les phrases se découpent sur la ponctuation forte, guillemets fermants compris', () => {
  assert.deepEqual(sentences('Il demande : « Vous désirez ? » Vous ne répondez pas. Le silence.'), [
    'Il demande : « Vous désirez ? »', 'Vous ne répondez pas.', 'Le silence.',
  ]);
});

test('discours direct et phrase nominale se reconnaissent', () => {
  assert.ok(hasDialogue('Il dit : « Reste là. »'));
  assert.ok(hasDialogue('— Reste là, dit-il.'));
  assert.ok(!hasDialogue('Il dit de rester là.'));
  assert.ok(isNominal('Le silence.'));
  assert.ok(isNominal('Une cheminée noire.'));
  assert.ok(!isNominal('Le silence vous écrase.'));
});

test('un paragraphe se mesure : mots, phrases, chute courte, liste noire', () => {
  const m = measureParagraph({ text: ['Vous poussez la porte et quelque chose grince.', 'Rien ne bouge. Ils attendent.'] }, blacklist);
  assert.equal(m.words, 13);
  assert.deepEqual(m.sentences, [8, 3, 2]);
  assert.ok(m.shortClose);
  assert.ok(!m.nominalClose);
  assert.deepEqual(m.blacklist, ['quelque chose']);
});

test('les tournures répétées ignorent les mots-outils et la mécanique', () => {
  const texts = Array.from({ length: 6 }, (_, i) => `Le détecteur crépite une fois. Vous perdez 2 points d'Endurance. Et vous allez dans la cour ${i}.`);
  const grams = repeatedNgrams(texts).map(({ gram }) => gram);
  assert.ok(grams.includes('le détecteur crépite une fois'));
  assert.ok(!grams.some((gram) => gram.includes('points')));
  assert.ok(!grams.some((gram) => gram.includes('perdez')));
});

test('un groupe uniforme et haché déclenche les avertissements attendus', () => {
  const paragraphs = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [String(i), {
    text: `Vous marchez vers le bâtiment numéro ${i} sous la pluie fine. Le mur est gris. Ils vous attendent.`,
  }]));
  const warnings = checkProse(measureGroup(paragraphs, blacklist), THRESHOLDS, 'c01');
  assert.ok(warnings.some((w) => w.includes('longueurs uniformes')));
  assert.ok(warnings.some((w) => w.includes('chute de 4 mots')));
  assert.ok(warnings.some((w) => w.includes('discours direct')));
  assert.ok(warnings.some((w) => w.includes('tournure répétée')));
  assert.ok(warnings.every((w) => w.startsWith('c01 : ')));
});

test('un groupe trop petit n\'est pas évalué', () => {
  assert.deepEqual(checkProse(measureGroup({ '1': { text: 'Fin.' } }, blacklist)), []);
});

test('le diff de prose n\'accepte que les changements de texte', () => {
  const before = { title: 'X', paragraphs: { '1': { text: 'A', choices: [{ text: 'Aller', to: '2' }] }, '2': { text: 'B' } } };
  const same = diffProse(before, { ...before, paragraphs: { ...before.paragraphs, '2': { text: 'B réécrit' } } });
  assert.deepEqual(same, { errors: [], rewritten: ['2'] });
  const broken = diffProse(before, { title: 'Y', paragraphs: { '1': { text: 'A', choices: [{ text: 'Partir', to: '2' }] }, '3': { text: 'C' } } });
  assert.ok(broken.errors.some((e) => e.includes('hors paragraphes')));
  assert.ok(broken.errors.some((e) => e.includes('"2" supprimé')));
  assert.ok(broken.errors.some((e) => e.includes('"3" ajouté')));
  assert.ok(broken.errors.some((e) => e.includes('"1" : autre chose que le texte')));
});
