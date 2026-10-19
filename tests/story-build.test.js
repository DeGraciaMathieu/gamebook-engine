import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { validateStory } from '../src/engine/story.js';
import {
  chapterPrefix, checkSourceStructure, mergeSource, readSource, renumberStory, resolveStoryDir,
} from '../scripts/lib/story-source.mjs';

const fixture = fileURLToPath(new URL('./fixtures/chapitres', import.meta.url));

const chapter = (file, paragraphs) => ({ file, prefix: chapterPrefix(file), paragraphs });
const manifest = { id: 'x', title: 'X', start: 'c01-1' };

test('resolveStoryDir accepte le dossier, source/ ou le manifeste', () => {
  assert.equal(resolveStoryDir('stories/x'), 'stories/x');
  assert.equal(resolveStoryDir('stories/x/source'), 'stories/x');
  assert.equal(resolveStoryDir('stories/x/source/story.src.json'), 'stories/x');
});

test('le préfixe vient du numéro du fichier', () => {
  assert.equal(chapterPrefix('chapters/07-le-port.json'), 'c07');
  assert.throws(() => chapterPrefix('chapters/port.json'), /<nn>-<nom>\.json/);
});

test('la source fixture se lit et se fusionne en une histoire valide', () => {
  const source = readSource(fixture);
  assert.equal(source.chapters.length, 2);
  assert.deepEqual(source.chapters.map((c) => c.prefix), ['c01', 'c02']);
  assert.deepEqual(checkSourceStructure(source), []);
  const story = mergeSource(source);
  assert.equal(Object.keys(story.paragraphs).length, 11);
  assert.deepEqual(validateStory(story), []);
});

test('numéros de chapitre en double, préfixes absents et collisions sont des erreurs', () => {
  const errors = checkSourceStructure({
    manifest: { ...manifest, paragraphs: {} },
    chapters: [
      chapter('01-a.json', { 'c01-1': { text: 'a' }, '12': { text: 'b' } }),
      chapter('01-b.json', { 'c01-1': { text: 'c' } }),
    ],
  });
  assert.ok(errors.some((e) => e.includes('même numéro c01')));
  assert.ok(errors.some((e) => e.includes('"12" non préfixé')));
  assert.ok(errors.some((e) => e.includes('"c01-1" défini dans "01-a.json" et "01-b.json"')));
  assert.ok(errors.some((e) => e.includes('story.src.json')));
});

test('la renumérotation réécrit toutes les cibles et reste valide', () => {
  const source = readSource(fixture);
  const merged = mergeSource(source);
  const { story, map } = renumberStory(merged, source.chapters, 7);
  assert.deepEqual(validateStory(story), []);
  const ids = Object.keys(story.paragraphs);
  assert.deepEqual(ids, ids.map((_, i) => String(i + 1)), 'identifiants de 1 à N dans l\'ordre');
  assert.equal(story.start, map.chapters.c01.paragraphs['c01-1']);
  assert.equal(story.death, map.chapters.c01.paragraphs['c01-mort']);
  assert.equal(story.triggers[0].to, map.chapters.c02.paragraphs['c02-3']);
  const forced = story.paragraphs[map.chapters.c01.paragraphs['c01-2']];
  assert.equal(forced.test.success, map.chapters.c02.paragraphs['c02-2']);
  assert.equal(forced.test.failure, map.chapters.c01.paragraphs['c01-4']);
  const guard = story.paragraphs[map.chapters.c02.paragraphs['c02-1']];
  assert.equal(guard.combat.win, map.chapters.c02.paragraphs['c02-4']);
  assert.equal(guard.combat.flee.to, map.chapters.c02.paragraphs['c02-2']);
  for (const [builtId, sourceId] of Object.entries(map.ids)) {
    assert.deepEqual(Object.keys(story.paragraphs[builtId]).sort(), Object.keys(merged.paragraphs[sourceId]).sort());
  }
  assert.equal(map.seed, 7);
  assert.equal(map.chapters.c01.file, '01-vestibule.json');
  assert.equal(map.chapters.c01.title, 'Le vestibule');
});

test('le chemin des images ne change pas à la renumérotation', () => {
  const source = readSource(fixture);
  const { story, map } = renumberStory(mergeSource(source), source.chapters, 1);
  assert.equal(story.paragraphs[map.chapters.c01.paragraphs['c01-2']].image.src, 'images/c01-2.webp');
});

test('la même graine donne la même numérotation, une autre graine en donne une autre', () => {
  const source = readSource(fixture);
  const merged = mergeSource(source);
  const first = renumberStory(merged, source.chapters, 3);
  const again = renumberStory(merged, source.chapters, 3);
  const other = renumberStory(merged, source.chapters, 4);
  assert.deepEqual(first.map.ids, again.map.ids);
  assert.notDeepEqual(first.map.ids, other.map.ids);
  assert.deepEqual(first.story, again.story);
});

test('la fusion ne modifie pas la source', () => {
  const source = readSource(fixture);
  const merged = mergeSource(source);
  const before = JSON.stringify(merged);
  renumberStory(merged, source.chapters, 1);
  assert.equal(JSON.stringify(merged), before);
});
