// Mesure de la prose d'une histoire : longueurs, rythme, discours direct, chutes courtes, liste noire,
// tournures répétées ; par chapitre quand l'histoire en a. Les seuils sont des avertissements à justifier.
// Usage :
//   node scripts/story-prose.mjs stories/<id>                                    histoire en chapitres (source/) ou story.json
//   node scripts/story-prose.mjs stories/<id>/story.json                         story.json, groupé par chapitre si build-map.json existe
//   node scripts/story-prose.mjs --chapter stories/<id>/source/chapters/<nn>-<nom>.json
//   node scripts/story-prose.mjs --diff avant.json apres.json                    échoue si autre chose que `text` a changé
// Options : --blacklist <fichier> (défaut : .claude/skills/new-story/references/prose-blacklist.txt)
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { THRESHOLDS, checkProse, diffProse, measureGroup, readBlacklist } from './lib/story-prose.mjs';
import { isChapterStory, prefixOf, readBuildMap, readChapter, readSource, resolveStoryDir } from './lib/story-source.mjs';

const USAGE = [
  'Usage : node scripts/story-prose.mjs stories/<id>',
  '        node scripts/story-prose.mjs stories/<id>/story.json',
  '        node scripts/story-prose.mjs --chapter stories/<id>/source/chapters/<nn>-<nom>.json',
  '        node scripts/story-prose.mjs --diff avant.json apres.json',
].join('\n');
const DEFAULT_BLACKLIST = '.claude/skills/new-story/references/prose-blacklist.txt';

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
};
const blacklistFile = option('--blacklist') ?? DEFAULT_BLACKLIST;
const blacklist = existsSync(blacklistFile) ? readBlacklist(blacklistFile) : [];

if (args.includes('--diff')) {
  const index = args.indexOf('--diff');
  const [beforeFile, afterFile] = [args[index + 1], args[index + 2]];
  if (!beforeFile || !afterFile || !existsSync(beforeFile) || !existsSync(afterFile)) usage();
  const { errors, rewritten } = diffProse(read(beforeFile), read(afterFile));
  if (errors.length > 0) {
    console.log(`✗ ${errors.length} erreur(s)`);
    errors.forEach((error) => console.log(`  - ${error}`));
    process.exit(1);
  }
  console.log(`✓ ${rewritten.length} paragraphe(s) réécrit(s), mécanique intacte`);
  if (rewritten.length > 0) console.log(`  ${rewritten.join(', ')}`);
} else if (args.includes('--chapter')) {
  const file = option('--chapter');
  if (!file || !existsSync(file)) usage();
  const chapter = readChapter(file);
  report([{ label: `${chapter.prefix} ${chapter.title ?? ''}`.trim(), paragraphs: chapter.paragraphs }]);
} else {
  const path = args.find((arg) => !arg.startsWith('--') && arg !== blacklistFile);
  if (!path || !existsSync(path)) usage();
  report(groupsOf(path));
}

function usage() {
  console.error(USAGE);
  process.exit(2);
}

function read(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

// Les groupes à mesurer : un par chapitre (source/ ou build-map.json), sinon l'histoire entière.
function groupsOf(path) {
  const storyDir = resolveStoryDir(path);
  if (statSync(path).isDirectory() || isChapterStory(storyDir)) {
    if (isChapterStory(storyDir)) {
      return readSource(storyDir).chapters.filter((chapter) => Object.keys(chapter.paragraphs).length > 0)
        .map((chapter) => ({ label: `${chapter.prefix} ${chapter.title ?? ''}`.trim(), paragraphs: chapter.paragraphs }));
    }
    path = join(storyDir, 'story.json');
  }
  const story = read(path);
  const map = readBuildMap(path);
  if (!map) return [{ label: story.title, paragraphs: story.paragraphs }];
  const byChapter = {};
  for (const [built, source] of Object.entries(map.ids)) {
    const prefix = prefixOf(source);
    (byChapter[prefix] ??= {})[source] = story.paragraphs[built];
  }
  return Object.entries(byChapter).sort(([a], [b]) => a.localeCompare(b))
    .map(([prefix, paragraphs]) => ({ label: `${prefix} ${map.chapters[prefix]?.title ?? ''}`.trim(), paragraphs }));
}

function report(groups) {
  const pct = (value) => `${String(Math.round(value * 100)).padStart(3)} %`;
  const warnings = [];
  console.log(`${'chapitre'.padEnd(34)} para   mots min/méd/max   phrase méd   dialogue   chutes   nominales   liste noire   répétées`);
  for (const group of groups) {
    const m = measureGroup(group.paragraphs, blacklist);
    warnings.push(...checkProse(m, THRESHOLDS, group.label));
    const black = Object.values(m.blacklist).reduce((sum, n) => sum + n, 0);
    console.log(`${group.label.slice(0, 33).padEnd(34)} ${String(m.count).padStart(4)}   ${String(m.words.min).padStart(3)} / ${String(m.words.median).padStart(3)} / ${String(m.words.max).padStart(3)}        ${String(m.sentence.median).padStart(3)}      ${pct(m.dialogue)}    ${pct(m.shortClose)}     ${pct(m.nominalClose)}       ${String(black).padStart(5)}        ${String(m.ngrams.length).padStart(3)}`);
  }
  if (groups.length > 1) {
    const all = Object.assign({}, ...groups.map((group) => group.paragraphs));
    const m = measureGroup(all, blacklist);
    const black = Object.entries(m.blacklist).sort(([, a], [, b]) => b - a);
    console.log(`\nEnsemble : ${m.count} paragraphes, ${m.words.p10} à ${m.words.p90} mots pour 80 % d'entre eux (médiane ${m.words.median}), phrases de ${m.sentence.median} mots en médiane (p10 ${m.sentence.p10}, p90 ${m.sentence.p90})`);
    console.log(`  dialogue ${pct(m.dialogue).trim()}, chutes courtes ${pct(m.shortClose).trim()}, clôtures nominales ${pct(m.nominalClose).trim()}`);
    if (black.length > 0) console.log(`  liste noire : ${black.map(([expr, n]) => `${expr} ×${n}`).join(', ')}`);
    if (m.ngrams.length > 0) console.log(`  tournures répétées dans toute l'histoire : ${m.ngrams.slice(0, 15).map(({ gram, count }) => `« ${gram} » ×${count}`).join(', ')}${m.ngrams.length > 15 ? `, … (${m.ngrams.length})` : ''}`);
  }
  if (warnings.length > 0) {
    console.log(`\n${warnings.length} avertissement(s)`);
    warnings.forEach((warning) => console.log(`  - ${warning}`));
  } else {
    console.log('\nAucun avertissement');
  }
}
