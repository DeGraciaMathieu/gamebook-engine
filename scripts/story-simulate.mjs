// Simulation Monte-Carlo d'une histoire sur le moteur pur : distribution des fins, létalité,
// longueur, paragraphes jamais atteints en pratique, dangerosité de chaque combat.
// Usage : node scripts/story-simulate.mjs stories/<id>/story.json [--runs 2000] [--seed 1] [--strategy random|prudent]
import { readFileSync } from 'node:fs';
import { createSeededRng } from '../src/engine/dice.js';
import { validateStory, getParagraph } from '../src/engine/story.js';
import {
  createGame, describeCreation, listChoices, choose, resolveTest, fightRound, fleeCombat, listOffers, buyItem,
} from '../src/engine/game.js';

const args = process.argv.slice(2);
const path = args.find((arg) => !arg.startsWith('--'));
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};
if (!path) {
  console.error('Usage : node scripts/story-simulate.mjs stories/<id>/story.json [--runs 2000] [--seed 1] [--strategy random|prudent]');
  process.exit(2);
}
const runs = Number(option('runs', 2000));
const seed = Number(option('seed', 1));
const strategy = option('strategy', 'random');
const MAX_STEPS = 400;
const PRUDENT_THRESHOLD = 6;

const story = JSON.parse(readFileSync(path, 'utf8'));
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
  for (let step = 0; step < MAX_STEPS; step++) {
    if (state.status !== 'playing') {
      return { ending: `${state.paragraphId} (${state.status === 'dead' ? 'mort' : 'fin'})`, dead: state.status === 'dead', steps: step, visited, fired: state.fired ?? [] };
    }
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
        state = fightRound(story, state).state;
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
      let choices = listChoices(story, state);
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
  deaths: 0,
  steps: 0,
  visits: new Map(Object.keys(story.paragraphs).map((id) => [id, 0])),
  combats: new Map(Object.entries(story.paragraphs).filter(([, p]) => p.combat).map(([id, p]) => [id, { name: p.combat.name, fought: 0, deaths: 0, fled: 0 }])),
  triggers: (story.triggers ?? []).map(() => 0),
};
for (let i = 0; i < runs; i++) {
  const result = playOne(report);
  report.endings.set(result.ending, (report.endings.get(result.ending) ?? 0) + 1);
  report.deaths += result.dead ? 1 : 0;
  report.steps += result.steps;
  result.visited.forEach((id) => report.visits.set(id, report.visits.get(id) + 1));
  result.fired.forEach((index) => { report.triggers[index] += 1; });
}

const percent = (value) => `${(100 * value / runs).toFixed(1)} %`;
console.log(`${story.title} : ${runs} parties, stratégie ${strategy}, graine ${seed}`);
console.log(`  létalité ${percent(report.deaths)}, longueur moyenne ${(report.steps / runs).toFixed(1)} actions`);
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
const rare = [...report.visits.entries()].filter(([, count]) => count < runs * 0.02).map(([id, count]) => `${id} (${percent(count)})`);
console.log(`\nParagraphes rares (moins de 2 % des parties) : ${rare.length ? rare.join(', ') : 'aucun'}`);
