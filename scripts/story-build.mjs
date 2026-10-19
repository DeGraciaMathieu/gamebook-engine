// Fusionne une histoire en chapitres (stories/<id>/source/) en un stories/<id>/story.json jouable :
// paragraphes renumérotés de façon déterministe, correspondance écrite dans stories/<id>/build-map.json.
// Usage : node scripts/story-build.mjs stories/<id> [--seed 1]
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateStory } from '../src/engine/story.js';
import { checkSourceStructure, isChapterStory, mergeSource, readSource, renumberStory, resolveStoryDir } from './lib/story-source.mjs';

const args = process.argv.slice(2);
const path = args.find((arg) => !arg.startsWith('--'));
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};
if (!path) {
  console.error('Usage : node scripts/story-build.mjs stories/<id> [--seed 1]');
  process.exit(2);
}
const storyDir = resolveStoryDir(path);
if (!isChapterStory(storyDir)) {
  console.error(`${storyDir} : pas de source/story.src.json`);
  process.exit(2);
}
const seed = Number(option('seed', 1));

const source = readSource(storyDir);
const errors = checkSourceStructure(source);
const merged = mergeSource(source);
if (errors.length === 0) errors.push(...validateStory(merged));
if (errors.length > 0) {
  console.log(`✗ ${errors.length} erreur(s), story.json non écrit`);
  errors.forEach((error) => console.log(`  - ${error}`));
  process.exit(1);
}

const { story, map } = renumberStory(merged, source.chapters, seed);
writeFileSync(join(storyDir, 'story.json'), `${JSON.stringify(story, null, 2)}\n`);
writeFileSync(join(storyDir, 'build-map.json'), `${JSON.stringify(map, null, 2)}\n`);
const count = Object.keys(story.paragraphs).length;
console.log(`✓ ${story.title} : ${source.chapters.length} chapitre(s), ${count} paragraphes, graine ${seed}`);
console.log(`  ${join(storyDir, 'story.json')} et ${join(storyDir, 'build-map.json')} écrits`);
