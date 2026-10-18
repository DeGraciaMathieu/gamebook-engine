// Contrôle d'une histoire : validation du moteur, atteignabilité, objets et drapeaux orphelins,
// surlignage possible, grille de couverture des mécaniques.
// Usage : node scripts/story-lint.mjs stories/<id>/story.json
import { readFileSync } from 'node:fs';
import { validateStory, isEnding } from '../src/engine/story.js';

const path = process.argv[2];
if (!path) {
  console.error('Usage : node scripts/story-lint.mjs stories/<id>/story.json');
  process.exit(2);
}
const story = JSON.parse(readFileSync(path, 'utf8'));
const errors = validateStory(story);
const warnings = [];
const paragraphs = Object.entries(story.paragraphs ?? {});

if (errors.length > 0) {
  console.log(`✗ ${errors.length} erreur(s) de validation`);
  errors.forEach((error) => console.log(`  - ${error}`));
  process.exit(1);
}

// Graphe
const edges = new Map();
for (const [id, paragraph] of paragraphs) {
  const targets = [
    ...(paragraph.choices ?? []).map((choice) => choice.to),
    paragraph.combat?.win,
    paragraph.combat?.flee?.to,
    paragraph.test?.success,
    paragraph.test?.failure,
  ].filter(Boolean);
  edges.set(id, targets);
}
const incoming = new Map(paragraphs.map(([id]) => [id, 0]));
for (const targets of edges.values()) targets.forEach((target) => incoming.set(target, incoming.get(target) + 1));

const reachable = new Set();
const queue = [story.start, ...(story.triggers ?? []).map((trigger) => trigger.to)];
while (queue.length > 0) {
  const id = queue.pop();
  if (reachable.has(id)) continue;
  reachable.add(id);
  queue.push(...edges.get(id));
}
const unreachable = paragraphs.map(([id]) => id).filter((id) => !reachable.has(id) && id !== story.death);
unreachable.forEach((id) => warnings.push(`paragraphe "${id}" inatteignable depuis le départ`));

const endings = paragraphs.filter(([id, paragraph]) => isEnding(paragraph) && id !== story.death).map(([id]) => id);
if (endings.length < 2) warnings.push(`seulement ${endings.length} fin(s) hors mort, visez au moins 3`);
if (!story.death) warnings.push('pas de paragraphe "death" : la mort affichera le paragraphe courant');

const hubs = paragraphs.filter(([id, paragraph]) => incoming.get(id) >= 2 && (paragraph.choices?.length ?? 0) >= 2).map(([id]) => id);
if (hubs.length === 0) warnings.push('aucun carrefour (paragraphe rejoint par 2 chemins avec 2 choix ou plus)');

// Couverture des mécaniques
const coverage = {
  'combat': 0, 'combat avec fuite': 0, 'test de chance': 0, 'test de caractéristique': 0,
  'condition objet': 0, 'condition drapeau': 0, 'condition caractéristique': 0, 'condition all': 0, 'condition any': 0, 'condition not': 0,
  'effet caractéristique': 0, 'effet objet (gain)': 0, 'effet objet (perte)': 0, 'effet drapeau': 0, 'effet sur un choix': 0,
  'boutique (vente)': 0, 'boutique (rachat)': 0, 'modificateur de combat': 0, 'modificateur de test': 0, 'déclencheur': 0, 'combat sur une autre caractéristique': 0, 'adversaire à dégâts ou armure': 0,
};

// Objets et drapeaux
const items = Object.keys(story.items ?? {});
const itemsAdded = new Set(story.hero.inventory ?? []);
const itemsUsed = new Set();
const flagsSet = new Set();
const flagsTested = new Set();
const walkCondition = (condition) => {
  if (!condition) return;
  if (condition.type === 'item') itemsUsed.add(condition.item);
  if (condition.type === 'flag') flagsTested.add(condition.flag);
  if (condition.type === 'not') walkCondition(condition.condition);
  (condition.conditions ?? []).forEach(walkCondition);
};
const walkEffects = (effects) => {
  for (const effect of effects ?? []) {
    if (effect.type === 'item' && effect.action === 'add') itemsAdded.add(effect.item);
    if (effect.type === 'item' && effect.action === 'remove') itemsUsed.add(effect.item);
    if (effect.type === 'flag') flagsSet.add(effect.flag);
  }
};
for (const [, paragraph] of paragraphs) {
  walkEffects(paragraph.effects);
  for (const choice of paragraph.choices ?? []) {
    walkCondition(choice.if);
    walkEffects(choice.effects);
  }
  (paragraph.shop?.sell ?? []).forEach((offer) => itemsAdded.add(offer.item));
  (paragraph.shop?.buy ?? []).forEach((offer) => itemsUsed.add(offer.item));
}
for (const modifier of story.modifiers ?? []) {
  if (modifier.combat) coverage['modificateur de combat'] += 1;
  if (modifier.test) coverage['modificateur de test'] += 1;
  walkCondition(modifier.if);
}
for (const trigger of story.triggers ?? []) {
  coverage['déclencheur'] += 1;
  walkCondition(trigger.if);
}
items.filter((item) => !itemsAdded.has(item)).forEach((item) => warnings.push(`objet "${item}" déclaré mais jamais obtenu`));
items.filter((item) => itemsAdded.has(item) && !itemsUsed.has(item)).forEach((item) => warnings.push(`objet "${item}" obtenu mais jamais utile (aucune condition, vente ni retrait)`));
[...flagsSet].filter((flag) => !flagsTested.has(flag)).forEach((flag) => warnings.push(`drapeau "${flag}" posé mais jamais testé`));
[...flagsTested].filter((flag) => !flagsSet.has(flag)).forEach((flag) => warnings.push(`drapeau "${flag}" testé mais jamais posé`));

// Surlignage : le texte doit nommer ce qu'il modifie
const mentions = (text, candidates) => candidates.some((candidate) => candidate && new RegExp(candidate, 'i').test(text));
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const [id, paragraph] of paragraphs) {
  const text = [].concat(paragraph.text).join(' ');
  for (const effect of paragraph.effects ?? []) {
    if (effect.type === 'item') {
      const name = story.items[effect.item].name;
      if (!mentions(text, [escape(name), escape(name.split(/[\s']/)[0])])) {
        warnings.push(`paragraphe "${id}" : le texte ne nomme pas l'objet "${name}", le surlignage tombera en résumé`);
      }
    }
    if (effect.type === 'stat') {
      const definition = story.hero.stats[effect.stat];
      const unit = definition.unit ? `\\d+ ${escape(definition.unit.split(' ')[0])}s?` : `\\d+ points? (?:d['’]|de |du )${escape(definition.label)}`;
      if (!mentions(text, [unit])) {
        warnings.push(`paragraphe "${id}" : le texte ne chiffre pas la variation de ${definition.label} (« N ${definition.unit ?? `points de ${definition.label}`} »)`);
      }
    }
  }
}

const countCondition = (condition) => {
  if (!condition) return;
  const key = { item: 'condition objet', flag: 'condition drapeau', stat: 'condition caractéristique', all: 'condition all', any: 'condition any', not: 'condition not' }[condition.type];
  coverage[key] += 1;
  if (condition.type === 'not') countCondition(condition.condition);
  (condition.conditions ?? []).forEach(countCondition);
};
const countEffects = (effects) => {
  for (const effect of effects ?? []) {
    if (effect.type === 'stat' || effect.type === 'setStat') coverage['effet caractéristique'] += 1;
    if (effect.type === 'item') coverage[effect.action === 'add' ? 'effet objet (gain)' : 'effet objet (perte)'] += 1;
    if (effect.type === 'flag') coverage['effet drapeau'] += 1;
  }
};
for (const [, paragraph] of paragraphs) {
  if (paragraph.combat) coverage.combat += 1;
  if (paragraph.combat?.flee) coverage['combat avec fuite'] += 1;
  if (paragraph.combat?.stat && paragraph.combat.stat !== 'habilete') coverage['combat sur une autre caractéristique'] += 1;
  if (paragraph.combat && (paragraph.combat.damage !== undefined || paragraph.combat.armor !== undefined)) coverage['adversaire à dégâts ou armure'] += 1;
  if (paragraph.test?.type === 'luck') coverage['test de chance'] += 1;
  if (paragraph.test?.type === 'stat') coverage['test de caractéristique'] += 1;
  countEffects(paragraph.effects);
  for (const choice of paragraph.choices ?? []) {
    countCondition(choice.if);
    if (choice.effects?.length) coverage['effet sur un choix'] += 1;
    countEffects(choice.effects);
  }
  if (paragraph.shop?.sell?.length) coverage['boutique (vente)'] += 1;
  if (paragraph.shop?.buy?.length) coverage['boutique (rachat)'] += 1;
}
const resources = Object.entries(story.hero.stats).filter(([, definition]) => definition.capped === false).map(([name]) => name);

console.log(`✓ ${story.title} : ${paragraphs.length} paragraphes, ${endings.length} fin(s) hors mort, ${hubs.length} carrefour(s) [${hubs.join(', ')}]`);
console.log(`  héros : ${story.hero.points !== undefined ? `répartition de ${story.hero.points} points` : 'tirage aux dés'}${resources.length ? `, ressource(s) : ${resources.join(', ')}` : ''}`);
console.log('\nCouverture des mécaniques');
for (const [feature, count] of Object.entries(coverage)) {
  console.log(`  ${count > 0 ? '✓' : '·'} ${feature.padEnd(28)} ${count}`);
}
const missing = Object.entries(coverage).filter(([, count]) => count === 0).map(([feature]) => feature);
if (missing.length > 0) console.log(`\n  Mécaniques absentes : ${missing.join(', ')}`);

if (warnings.length > 0) {
  console.log(`\n${warnings.length} avertissement(s)`);
  warnings.forEach((warning) => console.log(`  - ${warning}`));
} else {
  console.log('\nAucun avertissement');
}
