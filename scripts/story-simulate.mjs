// Simulation Monte-Carlo d'une histoire sur le moteur pur : distribution des fins, létalité,
// longueur, paragraphes jamais atteints en pratique, dangerosité de chaque combat. Le joueur simulé préfère
// une page jamais lue, puis un choix jamais pris, comme un lecteur devant des choix marqués.
// Pour une histoire en chapitres (build-map.json à côté du story.json), les identifiants sont traduits
// et le taux de paragraphes jamais visités est donné par chapitre.
// Usage : node scripts/story-simulate.mjs stories/<id>/story.json [--runs 2000] [--seed 1] [--strategy random|prudent] [--max-steps 2000]
import { readFileSync } from 'node:fs';
import { createSeededRng } from '../src/engine/dice.js';
import { validateStory, getParagraph } from '../src/engine/story.js';
import {
  createGame, describeCreation, listChoices, choose, hasChosen, resolveTest, fightRound, fleeCombat, listOffers, buyItem,
} from '../src/engine/game.js';
import { readBuildMap } from './lib/story-source.mjs';

const args = process.argv.slice(2);
const path = args.find((arg) => !arg.startsWith('--'));
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};
if (!path) {
  console.error('Usage : node scripts/story-simulate.mjs stories/<id>/story.json [--runs 2000] [--seed 1] [--strategy random|prudent] [--max-steps 2000]');
  process.exit(2);
}
const runs = Number(option('runs', 2000));
const seed = Number(option('seed', 1));
const strategy = option('strategy', 'random');
const MAX_STEPS = Number(option('max-steps', 2000));
const PRUDENT_THRESHOLD = 6;
const RARE_LISTED = 25;

const story = JSON.parse(readFileSync(path, 'utf8'));
const buildMap = readBuildMap(path);
const label = (id) => (buildMap?.ids[id] ? `${id} (${buildMap.ids[id]})` : id);
const errors = validateStory(story);
if (errors.length > 0) {
  console.error(`Histoire invalide :\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

const rng = createSeededRng(seed);
const pick = (list) => list[Math.floor(rng() * list.length)];

function randomAllocation() {
  const creation = describeCreation(story);
  if (!creation) return {};
  const allocation = Object.fromEntries(creation.stats.map((stat) => [stat.name, 0]));
  for (let point = 0; point < creation.points; point++) {
    const open = creation.stats.filter((stat) => stat.base + allocation[stat.name] < stat.max);
    allocation[pick(open).name] += 1;
  }
  return allocation;
}

function leadsToCombat(choice) {
  return Boolean(getParagraph(story, choice.to).combat);
}

function playOne(report) {
  let state = createGame(story, rng, randomAllocation());
  const visited = new Set([state.paragraphId]);
  let previous = state.paragraphId;
  let cause = 'piège';
  for (let step = 0; step < MAX_STEPS; step++) {
    if (state.status !== 'playing') {
      const dead = state.status === 'dead';
      return { ending: `${label(state.paragraphId)} (${dead ? 'mort' : 'fin'})`, dead, deathPlace: dead ? previous : null, cause, steps: step, visited, fired: state.fired ?? [] };
    }
    previous = state.paragraphId;
    cause = state.combat ? 'combat' : 'piège';
    if (state.combat) {
      const paragraph = getParagraph(story, state.paragraphId);
      const canFlee = Boolean(paragraph.combat.flee);
      const shouldFlee = strategy === 'prudent'
        ? canFlee && state.stats.endurance <= PRUDENT_THRESHOLD
        : canFlee && rng() < 0.1;
      const combatReport = report.combats.get(state.paragraphId);
      if (state.combat.round === 0) combatReport.fought += 1;
      if (shouldFlee) {
        combatReport.fled += 1;
        state = fleeCombat(story, state);
      } else {
        const before = state.paragraphId;
        state = fightRound(story, state, rng).state;
        if (state.status === 'dead') report.combats.get(before).deaths += 1;
      }
    } else if (getParagraph(story, state.paragraphId).test) {
      state = resolveTest(story, state, rng).state;
    } else {
      const offers = listOffers(story, state);
      const buyable = offers?.sell.filter((offer) => offer.affordable && !offer.owned) ?? [];
      if (buyable.length > 0 && rng() < 0.5) {
        state = buyItem(story, state, pick(buyable).item);
        continue;
      }
      // Comme un lecteur, on préfère une page jamais lue, sinon un choix jamais pris, sinon n'importe lequel.
      let choices = listChoices(story, state);
      const unread = choices.filter((choice) => !visited.has(choice.to));
      const fresh = unread.length > 0 ? unread : choices.filter((choice) => !hasChosen(story, state, choice));
      if (fresh.length > 0) choices = fresh;
      if (strategy === 'prudent' && state.stats.endurance <= PRUDENT_THRESHOLD) {
        const safe = choices.filter((choice) => !leadsToCombat(choice));
        if (safe.length > 0) choices = safe;
      }
      state = choose(story, state, pick(choices));
    }
    visited.add(state.paragraphId);
  }
  return { ending: 'boucle sans fin', dead: false, steps: MAX_STEPS, visited, fired: state.fired ?? [] };
}

const report = {
  endings: new Map(),
  deaths: new Map(),
  dead: 0,
  steps: 0,
  visits: new Map(Object.keys(story.paragraphs).map((id) => [id, 0])),
  combats: new Map(Object.entries(story.paragraphs).filter(([, p]) => p.combat).map(([id, p]) => [id, { name: p.combat.name, fought: 0, deaths: 0, fled: 0 }])),
  triggers: (story.triggers ?? []).map(() => 0),
  chapters: new Map(),
};
const chapterOf = (id) => buildMap?.ids[id]?.split('-')[0];
for (let i = 0; i < runs; i++) {
  const result = playOne(report);
  report.endings.set(result.ending, (report.endings.get(result.ending) ?? 0) + 1);
  report.dead += result.dead ? 1 : 0;
  report.steps += result.steps;
  result.visited.forEach((id) => report.visits.set(id, report.visits.get(id) + 1));
  if (buildMap) new Set([...result.visited].map(chapterOf)).forEach((prefix) => report.chapters.set(prefix, (report.chapters.get(prefix) ?? 0) + 1));
  if (result.dead) {
    const key = buildMap ? chapterOf(result.deathPlace) : result.deathPlace;
    const deaths = report.deaths.get(key) ?? { combat: 0, piège: 0 };
    deaths[result.cause] += 1;
    report.deaths.set(key, deaths);
  }
  result.fired.forEach((index) => { report.triggers[index] += 1; });
}

const percent = (value) => `${(100 * value / runs).toFixed(1)} %`;
console.log(`${story.title} : ${runs} parties, stratégie ${strategy}, graine ${seed}`);
console.log(`  létalité ${percent(report.dead)}, longueur moyenne ${(report.steps / runs).toFixed(1)} actions`);
console.log('\nFins');
[...report.endings.entries()].sort((a, b) => b[1] - a[1]).forEach(([ending, count]) => {
  console.log(`  ${ending.padEnd(16)} ${percent(count).padStart(7)}`);
});
console.log('\nCombats');
for (const combat of report.combats.values()) {
  const defeat = combat.fought ? (100 * combat.deaths / combat.fought).toFixed(1) : '0.0';
  console.log(`  ${combat.name.padEnd(20)} livré ${String(combat.fought).padStart(5)}×  mortel ${defeat.padStart(5)} %  fui ${combat.fled}×`);
}
if (report.triggers.length > 0) {
  console.log('\nDéclencheurs');
  (story.triggers ?? []).forEach((trigger, index) => {
    console.log(`  ${(trigger.label ?? `déclencheur ${index + 1}`).padEnd(20)} ${percent(report.triggers[index]).padStart(7)}`);
  });
}
if (report.dead > 0) {
  console.log(`\nMorts par ${buildMap ? 'chapitre' : 'paragraphe'} (part des morts, combat / piège)`);
  [...report.deaths.entries()].sort((a, b) => (b[1].combat + b[1].piège) - (a[1].combat + a[1].piège)).slice(0, 15).forEach(([place, deaths]) => {
    const total = deaths.combat + deaths.piège;
    console.log(`  ${String(buildMap ? `${place} ${buildMap.chapters[place]?.title ?? ''}` : place).padEnd(42)} ${`${(100 * total / report.dead).toFixed(1)} %`.padStart(7)}   combat ${deaths.combat}  piège ${deaths.piège}`);
  });
}
const never = [...report.visits.entries()].filter(([, count]) => count === 0).map(([id]) => id);
console.log(`\nParagraphes jamais visités : ${never.length} sur ${report.visits.size} (${percent(never.length * runs / report.visits.size)})`);
if (buildMap) {
  console.log(`\n  chap.  ${'titre'.padEnd(36)} parag.  jamais visités  parties qui y passent`);
  for (const [prefix, chapter] of Object.entries(buildMap.chapters)) {
    const ids = Object.values(chapter.paragraphs);
    const unvisited = ids.filter((id) => report.visits.get(id) === 0).length;
    const entered = report.chapters.get(prefix) ?? 0;
    console.log(`  ${prefix.padEnd(6)} ${String(chapter.title ?? '').padEnd(36)} ${String(ids.length).padStart(5)}  ${String(unvisited).padStart(5)} (${(ids.length ? 100 * unvisited / ids.length : 0).toFixed(0).padStart(3)} %)  ${percent(entered).padStart(7)}`);
  }
}
const rare = [...report.visits.entries()].filter(([, count]) => count < runs * 0.02).map(([id, count]) => `${label(id)} (${percent(count)})`);
const listed = rare.slice(0, RARE_LISTED).join(', ') + (rare.length > RARE_LISTED ? `, … et ${rare.length - RARE_LISTED} autres` : '');
console.log(`\nParagraphes rares (moins de 2 % des parties) : ${rare.length ? listed : 'aucun'}`);
