// Contrôle d'une histoire : validation du moteur, atteignabilité, objets et drapeaux orphelins,
// surlignage possible, grille de couverture des mécaniques.
// Usage :
//   node scripts/story-lint.mjs stories/<id>/story.json                               histoire jouable
//   node scripts/story-lint.mjs stories/<id>                                          histoire en chapitres : contrats, fusion, mêmes contrôles
//   node scripts/story-lint.mjs --chapter stories/<id>/source/chapters/<nn>-<nom>.json un chapitre seul, cibles externes déclarées tolérées
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { validateStory, isEnding } from '../src/engine/story.js';
import {
  buildGraph, checkHighlights, checkImages, checkOrphans, countCoverage, listEndings, listHubs, listUnreachable,
} from './lib/story-checks.mjs';
import { checkChapterContract, checkSourceContracts, isWritten } from './lib/story-contracts.mjs';
import { checkSourceStructure, isChapterStory, mergeSource, readChapter, readSource, resolveStoryDir } from './lib/story-source.mjs';

const USAGE = [
  'Usage : node scripts/story-lint.mjs stories/<id>/story.json',
  '        node scripts/story-lint.mjs stories/<id>                      (histoire en chapitres)',
  '        node scripts/story-lint.mjs --chapter stories/<id>/source/chapters/<nn>-<nom>.json',
].join('\n');

const args = process.argv.slice(2);
const chapterIndex = args.indexOf('--chapter');
const path = chapterIndex === -1 ? args.find((arg) => !arg.startsWith('--')) : args[chapterIndex + 1];
if (!path || !existsSync(path)) {
  console.error(path ? `${path} : introuvable\n${USAGE}` : USAGE);
  process.exit(2);
}

if (chapterIndex !== -1) lintChapter(path);
else if (statSync(path).isDirectory() || isChapterStory(resolveStoryDir(path))) lintSource(resolveStoryDir(path));
else lintStory(JSON.parse(readFileSync(path, 'utf8')), dirname(path));

function fail(errors) {
  console.log(`✗ ${errors.length} erreur(s)`);
  errors.forEach((error) => console.log(`  - ${error}`));
  process.exit(1);
}

function printWarnings(warnings) {
  if (warnings.length > 0) {
    console.log(`\n${warnings.length} avertissement(s)`);
    warnings.forEach((warning) => console.log(`  - ${warning}`));
  } else {
    console.log('\nAucun avertissement');
  }
}

// Histoire jouable : les contrôles complets.
function lintStory(story, storyDir, warnings = []) {
  const errors = validateStory(story);
  if (errors.length > 0) fail(errors);
  const paragraphs = story.paragraphs;
  const { edges, incoming } = buildGraph(paragraphs);

  listUnreachable(story, edges).forEach((id) => warnings.push(`paragraphe "${id}" inatteignable depuis le départ`));
  const endings = listEndings(story);
  if (endings.length < 2) warnings.push(`seulement ${endings.length} fin(s) hors mort, visez au moins 3`);
  if (!story.death) warnings.push('pas de paragraphe "death" : la mort affichera le paragraphe courant');
  const hubs = listHubs(paragraphs, incoming);
  if (hubs.length === 0) warnings.push('aucun carrefour (paragraphe rejoint par 2 chemins avec 2 choix ou plus)');
  warnings.push(...checkOrphans(story), ...checkImages(paragraphs, storyDir), ...checkHighlights(story));

  const coverage = countCoverage(story);
  const resources = Object.entries(story.hero.stats).filter(([, definition]) => definition.capped === false).map(([name]) => name);
  console.log(`✓ ${story.title} : ${Object.keys(paragraphs).length} paragraphes, ${endings.length} fin(s) hors mort, ${hubs.length} carrefour(s) [${hubs.join(', ')}]`);
  console.log(`  héros : ${story.hero.points !== undefined ? `répartition de ${story.hero.points} points` : 'tirage aux dés'}${resources.length ? `, ressource(s) : ${resources.join(', ')}` : ''}`);
  console.log('\nCouverture des mécaniques');
  for (const [feature, count] of Object.entries(coverage)) {
    console.log(`  ${count > 0 ? '✓' : '·'} ${feature.padEnd(28)} ${count}`);
  }
  const missing = Object.entries(coverage).filter(([, count]) => count === 0).map(([feature]) => feature);
  if (missing.length > 0) console.log(`\n  Mécaniques absentes : ${missing.join(', ')}`);
  printWarnings(warnings);
}

// Histoire en chapitres : structure, contrat de chaque chapitre, cohérence des contrats, puis les contrôles
// complets sur la fusion (identifiants de la source, lisibles) si tous les chapitres sont écrits.
function lintSource(storyDir) {
  const source = readSource(storyDir);
  const errors = checkSourceStructure(source);
  if (errors.length > 0) fail(errors);
  const warnings = [];
  for (const chapter of source.chapters) {
    const result = checkChapterContract(chapter);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }
  const contracts = checkSourceContracts(source);
  errors.push(...contracts.errors);
  warnings.push(...contracts.warnings);

  const unwritten = source.chapters.filter((chapter) => !isWritten(chapter));
  console.log(`${source.manifest.title} : ${source.chapters.length} chapitre(s), ${source.chapters.length - unwritten.length} écrit(s)`);
  for (const chapter of source.chapters) {
    const count = Object.keys(chapter.paragraphs).length;
    const endings = Object.values(chapter.paragraphs).filter((paragraph) => isEnding(paragraph)).length;
    const status = count === 0 ? 'à écrire' : `${String(count).padStart(3)} paragraphes, ${endings} fin(s)`;
    console.log(`  ${chapter.prefix}  ${String(chapter.title ?? '').padEnd(32)} ${status}   → ${Object.keys(chapter.exits ?? {}).map((id) => id.split('-')[0]).filter((prefix, index, list) => list.indexOf(prefix) === index).join(' ') || '(aucune sortie)'}`);
  }
  console.log('');
  if (errors.length > 0) fail(errors);
  if (unwritten.length > 0) {
    console.log(`Contrats cohérents. ${unwritten.length} chapitre(s) à écrire : ${unwritten.map((chapter) => chapter.prefix).join(', ')}`);
    printWarnings(warnings);
    return;
  }
  lintStory(mergeSource(source), storyDir, warnings);
}

// Un chapitre seul : son contrat, puis la validation du moteur sur le chapitre complété par des paragraphes
// factices pour ses sorties déclarées, si le manifeste est à portée.
function lintChapter(file) {
  const chapter = readChapter(file);
  const { errors, warnings } = checkChapterContract(chapter);
  if (errors.length > 0) fail(errors);
  if (!isWritten(chapter)) {
    console.log(`${chapter.prefix} ${chapter.title} : contrat valide, aucun paragraphe`);
    printWarnings(warnings);
    return;
  }

  const sourceDir = dirname(dirname(file));
  const manifestFile = join(sourceDir, 'story.src.json');
  if (!existsSync(manifestFile)) {
    warnings.push(`manifeste ${manifestFile} introuvable : objets, caractéristiques et surlignage non vérifiés`);
  } else {
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
    const stubs = Object.fromEntries(Object.keys(chapter.exits).map((id) => [id, { text: `[${id}]` }]));
    const story = { ...manifest, start: Object.keys(chapter.entries)[0], paragraphs: { ...stubs, ...chapter.paragraphs } };
    delete story.triggers;
    if (!chapter.paragraphs[story.death]) delete story.death;
    const invalid = validateStory(story);
    if (invalid.length > 0) fail(invalid);
    warnings.push(...checkHighlights(story, chapter.paragraphs), ...checkImages(chapter.paragraphs, dirname(sourceDir)));
  }

  const paragraphs = Object.entries(chapter.paragraphs);
  const endings = paragraphs.filter(([, paragraph]) => isEnding(paragraph)).map(([id]) => id);
  const combats = paragraphs.filter(([, paragraph]) => paragraph.combat).length;
  const tests = paragraphs.filter(([, paragraph]) => paragraph.test).length;
  const { incoming } = buildGraph(chapter.paragraphs);
  const hubs = listHubs(chapter.paragraphs, incoming);
  console.log(`✓ ${chapter.prefix} ${chapter.title} : ${paragraphs.length} paragraphes, ${combats} combat(s), ${tests} test(s), ${hubs.length} carrefour(s) [${hubs.join(', ')}]`);
  console.log(`  entrées : ${Object.keys(chapter.entries).join(', ')}`);
  console.log(`  sorties : ${Object.keys(chapter.exits).join(', ') || 'aucune'}${endings.length ? ` ; fins : ${endings.join(', ')}` : ''}`);
  printWarnings(warnings);
}
