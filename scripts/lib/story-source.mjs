// Histoire en chapitres : lecture de stories/<id>/source/ (manifeste story.src.json + chapters/<nn>-<nom>.json),
// fusion des chapitres en une histoire jouable, renumérotation déterministe des paragraphes.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { createSeededRng } from '../../src/engine/dice.js';

const CHAPTER_FILE = /^(\d{2})-[a-z0-9-]+\.json$/;
const MANIFEST = 'story.src.json';

// Accepte stories/<id>, stories/<id>/source ou stories/<id>/source/story.src.json.
export function resolveStoryDir(path) {
  if (basename(path) === MANIFEST) return dirname(dirname(path));
  if (basename(path) === 'source') return dirname(path);
  return path;
}

export function isChapterStory(storyDir) {
  return existsSync(join(storyDir, 'source', MANIFEST));
}

export function chapterPrefix(file) {
  const match = CHAPTER_FILE.exec(basename(file));
  if (!match) throw new Error(`chapitre "${basename(file)}" : nom de fichier attendu <nn>-<nom>.json`);
  return `c${match[1]}`;
}

export function prefixOf(id) {
  return String(id).split('-')[0];
}

export function readChapter(file) {
  const chapter = JSON.parse(readFileSync(file, 'utf8'));
  return { ...chapter, prefix: chapterPrefix(file), file, paragraphs: chapter.paragraphs ?? {} };
}

export function readSource(storyDir) {
  const dir = join(storyDir, 'source');
  const manifest = JSON.parse(readFileSync(join(dir, MANIFEST), 'utf8'));
  const chaptersDir = join(dir, 'chapters');
  const files = existsSync(chaptersDir) ? readdirSync(chaptersDir).filter((file) => file.endsWith('.json')).sort() : [];
  return { manifest, chapters: files.map((file) => readChapter(join(chaptersDir, file))) };
}

// Erreurs de structure : numéros de chapitre en double, paragraphes mal préfixés, collisions d'identifiants.
export function checkSourceStructure({ manifest, chapters }) {
  const errors = [];
  const filesByPrefix = new Map();
  const filesById = new Map();
  if (manifest.paragraphs) errors.push(`${MANIFEST} : les paragraphes vont dans chapters/, pas dans le manifeste`);
  for (const chapter of chapters) {
    const name = basename(chapter.file);
    if (filesByPrefix.has(chapter.prefix)) errors.push(`chapitres "${filesByPrefix.get(chapter.prefix)}" et "${name}" : même numéro ${chapter.prefix}`);
    filesByPrefix.set(chapter.prefix, name);
    for (const id of Object.keys(chapter.paragraphs)) {
      if (!id.startsWith(`${chapter.prefix}-`)) errors.push(`chapitre "${name}" : paragraphe "${id}" non préfixé par "${chapter.prefix}-"`);
      if (filesById.has(id)) errors.push(`paragraphe "${id}" défini dans "${filesById.get(id)}" et "${name}"`);
      filesById.set(id, name);
    }
  }
  return errors;
}

export function mergeSource({ manifest, chapters }) {
  const paragraphs = {};
  for (const chapter of chapters) Object.assign(paragraphs, chapter.paragraphs);
  return { ...manifest, paragraphs };
}

// Renumérote les paragraphes de 1 à N dans un ordre tiré de la graine, réécrit toutes les cibles,
// et rend la correspondance (build-map.json). Une cible inconnue est laissée telle quelle.
export function renumberStory(story, chapters, seed) {
  const sourceIds = chapters.flatMap((chapter) => Object.keys(chapter.paragraphs));
  const numbers = shuffle(sourceIds.map((_, index) => String(index + 1)), createSeededRng(seed));
  const mapping = new Map(sourceIds.map((id, index) => [id, numbers[index]]));
  const rename = (id) => (id === undefined ? undefined : (mapping.get(id) ?? id));

  const renumbered = structuredClone(story);
  renumbered.start = rename(story.start);
  if (story.death !== undefined) renumbered.death = rename(story.death);
  for (const trigger of renumbered.triggers ?? []) trigger.to = rename(trigger.to);
  renumbered.paragraphs = {};
  const entries = Object.entries(story.paragraphs).map(([id, paragraph]) => [rename(id), renameTargets(paragraph, rename)]);
  entries.sort(([a], [b]) => Number(a) - Number(b));
  for (const [id, paragraph] of entries) renumbered.paragraphs[id] = paragraph;

  const map = { seed, chapters: {}, ids: {} };
  for (const chapter of chapters) {
    const paragraphs = Object.fromEntries(Object.keys(chapter.paragraphs).map((id) => [id, mapping.get(id)]));
    map.chapters[chapter.prefix] = { file: basename(chapter.file), title: chapter.title, paragraphs };
  }
  for (const [sourceId, builtId] of mapping) map.ids[builtId] = sourceId;
  return { story: renumbered, map };
}

function renameTargets(paragraph, rename) {
  const copy = structuredClone(paragraph);
  for (const choice of copy.choices ?? []) choice.to = rename(choice.to);
  if (copy.combat) {
    copy.combat.win = rename(copy.combat.win);
    if (copy.combat.flee) copy.combat.flee.to = rename(copy.combat.flee.to);
  }
  if (copy.test) {
    copy.test.success = rename(copy.test.success);
    copy.test.failure = rename(copy.test.failure);
  }
  return copy;
}

function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function readBuildMap(storyPath) {
  const file = join(dirname(storyPath), 'build-map.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}
