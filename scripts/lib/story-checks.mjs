// Contrôles d'une histoire jouable : graphe, fins, carrefours, objets et drapeaux orphelins,
// illustrations, surlignage, grille de couverture. Partagés par le lint complet et le lint d'un chapitre.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isEnding } from '../../src/engine/story.js';

export function targetsOf(paragraph) {
  return [
    ...(paragraph.choices ?? []).map((choice) => choice.to),
    paragraph.combat?.win,
    paragraph.combat?.flee?.to,
    paragraph.test?.success,
    paragraph.test?.failure,
  ].filter(Boolean);
}

export function buildGraph(paragraphs) {
  const edges = new Map();
  const incoming = new Map(Object.keys(paragraphs).map((id) => [id, 0]));
  for (const [id, paragraph] of Object.entries(paragraphs)) {
    const targets = targetsOf(paragraph);
    edges.set(id, targets);
    targets.forEach((target) => incoming.set(target, (incoming.get(target) ?? 0) + 1));
  }
  return { edges, incoming };
}

export function reachableFrom(edges, roots) {
  const reachable = new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const id = queue.pop();
    if (reachable.has(id)) continue;
    reachable.add(id);
    queue.push(...(edges.get(id) ?? []));
  }
  return reachable;
}

export function listUnreachable(story, edges) {
  const reachable = reachableFrom(edges, [story.start, ...(story.triggers ?? []).map((trigger) => trigger.to)]);
  return Object.keys(story.paragraphs).filter((id) => !reachable.has(id) && id !== story.death);
}

export function listEndings(story) {
  return Object.entries(story.paragraphs).filter(([id, paragraph]) => isEnding(paragraph) && id !== story.death).map(([id]) => id);
}

export function listHubs(paragraphs, incoming) {
  return Object.entries(paragraphs).filter(([id, paragraph]) => incoming.get(id) >= 2 && (paragraph.choices?.length ?? 0) >= 2).map(([id]) => id);
}

// Ce que les paragraphes donnent et testent ; `modifiers` et `triggers` comptent comme usages.
export function collectUsage(story) {
  const itemsAdded = new Set(story.hero?.inventory ?? []);
  const itemsUsed = new Set();
  const flagsSet = new Set(Object.keys(story.hero?.flags ?? {}));
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
  for (const paragraph of Object.values(story.paragraphs)) {
    walkEffects(paragraph.effects);
    for (const choice of paragraph.choices ?? []) {
      walkCondition(choice.if);
      walkEffects(choice.effects);
    }
    (paragraph.shop?.sell ?? []).forEach((offer) => itemsAdded.add(offer.item));
    (paragraph.shop?.buy ?? []).forEach((offer) => itemsUsed.add(offer.item));
  }
  (story.modifiers ?? []).forEach((modifier) => walkCondition(modifier.if));
  (story.triggers ?? []).forEach((trigger) => walkCondition(trigger.if));
  return { itemsAdded, itemsUsed, flagsSet, flagsTested };
}

export function checkOrphans(story) {
  const warnings = [];
  const { itemsAdded, itemsUsed, flagsSet, flagsTested } = collectUsage(story);
  const items = Object.keys(story.items ?? {});
  items.filter((item) => !itemsAdded.has(item)).forEach((item) => warnings.push(`objet "${item}" déclaré mais jamais obtenu`));
  items.filter((item) => itemsAdded.has(item) && !itemsUsed.has(item)).forEach((item) => warnings.push(`objet "${item}" obtenu mais jamais utile (aucune condition, vente ni retrait)`));
  [...flagsSet].filter((flag) => !flagsTested.has(flag)).forEach((flag) => warnings.push(`drapeau "${flag}" posé mais jamais testé`));
  [...flagsTested].filter((flag) => !flagsSet.has(flag)).forEach((flag) => warnings.push(`drapeau "${flag}" testé mais jamais posé`));
  return warnings;
}

// Le fichier d'une illustration doit exister dans le dossier de l'histoire.
export function checkImages(paragraphs, storyDir) {
  const warnings = [];
  for (const [id, paragraph] of Object.entries(paragraphs)) {
    if (paragraph.image && !existsSync(join(storyDir, paragraph.image.src))) {
      warnings.push(`paragraphe "${id}" : image "${paragraph.image.src}" absente${paragraph.image.prompt ? ' (à générer avec story-illustrate)' : ''}`);
    }
  }
  return warnings;
}

// Surlignage : le texte doit nommer l'objet et chiffrer la variation qu'il applique.
export function checkHighlights(story, paragraphs = story.paragraphs) {
  const warnings = [];
  const mentions = (text, candidates) => candidates.some((candidate) => candidate && new RegExp(candidate, 'i').test(text));
  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [id, paragraph] of Object.entries(paragraphs)) {
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
  return warnings;
}

export function countCoverage(story) {
  const coverage = {
    'combat': 0, 'combat avec fuite': 0, 'test de chance': 0, 'test de caractéristique': 0,
    'condition objet': 0, 'condition drapeau': 0, 'condition caractéristique': 0, 'condition all': 0, 'condition any': 0, 'condition not': 0,
    'effet caractéristique': 0, 'effet objet (gain)': 0, 'effet objet (perte)': 0, 'effet drapeau': 0, 'effet sur un choix': 0,
    'boutique (vente)': 0, 'boutique (rachat)': 0, 'modificateur de combat': 0, 'modificateur de test': 0, 'déclencheur': 0, 'combat sur une autre caractéristique': 0, 'adversaire à dégâts ou armure': 0,
  };
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
  for (const modifier of story.modifiers ?? []) {
    if (modifier.combat) coverage['modificateur de combat'] += 1;
    if (modifier.test) coverage['modificateur de test'] += 1;
  }
  coverage['déclencheur'] = (story.triggers ?? []).length;
  for (const paragraph of Object.values(story.paragraphs)) {
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
  return coverage;
}
