// Contrat d'un chapitre (entries, exits, provides, requires, summary, image) : contrôle d'un chapitre seul,
// puis cohérence des contrats entre chapitres d'une source.
import { basename } from 'node:path';
import { buildGraph, collectUsage, reachableFrom, targetsOf } from './story-checks.mjs';
import { prefixOf } from './story-source.mjs';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isStringList = (value) => Array.isArray(value) && value.every((entry) => typeof entry === 'string');

export function chapterName(chapter) {
  return chapter.file ? basename(chapter.file) : chapter.prefix;
}

export function isWritten(chapter) {
  return Object.keys(chapter.paragraphs ?? {}).length > 0;
}

// Structure du contrat, cibles externes déclarées, entrées existantes, objets et drapeaux fournis ou requis,
// atteignabilité interne depuis les entrées, illustration unique.
export function checkChapterContract(chapter) {
  const errors = [];
  const warnings = [];
  const name = chapterName(chapter);
  const where = `chapitre "${name}"`;
  const paragraphs = chapter.paragraphs ?? {};

  if (typeof chapter.title !== 'string' || chapter.title === '') errors.push(`${where} : "title" manquant`);
  if (typeof chapter.summary !== 'string' || chapter.summary === '') errors.push(`${where} : "summary" manquant (ce que le lecteur sait en sortant)`);
  if (!isObject(chapter.entries) || Object.keys(chapter.entries).length === 0) errors.push(`${where} : "entries" doit associer au moins une entrée à sa description`);
  if (!isObject(chapter.exits)) errors.push(`${where} : "exits" doit associer chaque sortie à sa description (objet, éventuellement vide)`);
  for (const key of ['provides', 'requires']) {
    const block = chapter[key];
    if (block === undefined) continue;
    if (!isObject(block) || !isStringList(block.items ?? []) || !isStringList(block.flags ?? [])) errors.push(`${where} : "${key}" attend { "items": [...], "flags": [...] }`);
  }
  if (chapter.image !== undefined && typeof chapter.image !== 'string') errors.push(`${where} : "image" doit être l'identifiant du paragraphe illustré`);
  if (errors.length > 0) return { errors, warnings };

  const entries = Object.keys(chapter.entries);
  const exits = Object.keys(chapter.exits);
  for (const id of [...entries, ...exits]) {
    if (!/^c\d{2}-[A-Za-z0-9_]+$/.test(id)) errors.push(`${where} : identifiant "${id}" attendu sous la forme c<nn>-<n>`);
  }
  entries.filter((id) => prefixOf(id) !== chapter.prefix).forEach((id) => errors.push(`${where} : entrée "${id}" hors du chapitre ${chapter.prefix}`));
  exits.filter((id) => prefixOf(id) === chapter.prefix).forEach((id) => errors.push(`${where} : sortie "${id}" est interne au chapitre, une sortie mène à un autre chapitre`));
  if (chapter.image !== undefined && prefixOf(chapter.image) !== chapter.prefix) errors.push(`${where} : image "${chapter.image}" hors du chapitre`);

  if (!isWritten(chapter)) return { errors, warnings };

  entries.filter((id) => !paragraphs[id]).forEach((id) => errors.push(`${where} : entrée "${id}" absente des paragraphes`));

  const usedExits = new Set();
  for (const [id, paragraph] of Object.entries(paragraphs)) {
    for (const target of targetsOf(paragraph)) {
      if (paragraphs[target]) continue;
      if (chapter.exits[target] !== undefined) usedExits.add(target);
      else errors.push(`${where} : paragraphe "${id}" vise "${target}", ni dans le chapitre ni déclaré dans exits`);
    }
  }
  exits.filter((id) => !usedExits.has(id)).forEach((id) => warnings.push(`${where} : sortie "${id}" déclarée mais aucun paragraphe n'y mène`));

  const { edges } = buildGraph(paragraphs);
  const reachable = reachableFrom(edges, entries.filter((id) => paragraphs[id]));
  Object.keys(paragraphs).filter((id) => !reachable.has(id)).forEach((id) => warnings.push(`${where} : paragraphe "${id}" inatteignable depuis les entrées`));

  const usage = collectUsage({ paragraphs });
  const provides = { items: chapter.provides?.items ?? [], flags: chapter.provides?.flags ?? [] };
  const requires = { items: chapter.requires?.items ?? [], flags: chapter.requires?.flags ?? [] };
  compareDeclarations(warnings, where, 'objet', 'items', usage.itemsAdded, usage.itemsUsed, provides, requires);
  compareDeclarations(warnings, where, 'drapeau', 'flags', usage.flagsSet, usage.flagsTested, provides, requires);

  const illustrated = Object.keys(paragraphs).filter((id) => paragraphs[id].image);
  if (chapter.image !== undefined) {
    if (!paragraphs[chapter.image]) errors.push(`${where} : image "${chapter.image}" ne désigne aucun paragraphe du chapitre`);
    else if (!paragraphs[chapter.image].image) warnings.push(`${where} : le paragraphe "${chapter.image}" devrait porter l'illustration (image.src, alt, prompt)`);
  }
  illustrated.filter((id) => id !== chapter.image).forEach((id) => warnings.push(`${where} : paragraphe "${id}" illustré sans être l'image du contrat (une illustration par chapitre au plus)`));

  return { errors, warnings };
}

function compareDeclarations(warnings, where, label, key, given, used, provides, requires) {
  const provided = new Set(provides[key]);
  const required = new Set(requires[key]);
  [...given].filter((id) => !provided.has(id)).forEach((id) => warnings.push(`${where} : ${label} "${id}" ${label === 'objet' ? 'obtenu' : 'posé'} mais absent de provides.${key}`));
  [...provided].filter((id) => !given.has(id)).forEach((id) => warnings.push(`${where} : provides.${key} "${id}" déclaré mais jamais ${label === 'objet' ? 'obtenu' : 'posé'} dans le chapitre`));
  [...used].filter((id) => !provided.has(id) && !required.has(id)).forEach((id) => warnings.push(`${where} : ${label} "${id}" ${label === 'objet' ? 'utilisé' : 'testé'} mais ni fourni ni déclaré dans requires.${key}`));
  [...required].filter((id) => !used.has(id)).forEach((id) => warnings.push(`${where} : requires.${key} "${id}" déclaré mais jamais ${label === 'objet' ? 'utilisé' : 'testé'} dans le chapitre`));
}

// Cohérence entre chapitres : chaque sortie vise une entrée déclarée, chaque chapitre est atteignable depuis
// celui du départ, chaque objet ou drapeau requis est fourni par un chapitre en amont (ou par le héros au départ).
export function checkSourceContracts({ manifest, chapters }) {
  const errors = [];
  const warnings = [];
  const byPrefix = new Map(chapters.map((chapter) => [chapter.prefix, chapter]));
  const entryOwner = (id) => {
    const chapter = byPrefix.get(prefixOf(id));
    return chapter && isObject(chapter.entries) && chapter.entries[id] !== undefined ? chapter : null;
  };

  const edges = new Map(chapters.map((chapter) => [chapter.prefix, []]));
  for (const chapter of chapters) {
    const where = `chapitre "${chapterName(chapter)}"`;
    for (const exit of Object.keys(isObject(chapter.exits) ? chapter.exits : {})) {
      const target = byPrefix.get(prefixOf(exit));
      if (!target) errors.push(`${where} : sortie "${exit}" vers un chapitre inconnu`);
      else if (!entryOwner(exit)) errors.push(`${where} : sortie "${exit}" n'est pas une entrée déclarée du chapitre "${chapterName(target)}"`);
      else edges.get(chapter.prefix).push(target.prefix);
    }
  }

  const startChapter = byPrefix.get(prefixOf(manifest.start));
  if (!startChapter) errors.push(`start "${manifest.start}" : aucun chapitre ${prefixOf(manifest.start)}`);
  else if (!entryOwner(manifest.start)) warnings.push(`start "${manifest.start}" n'est pas une entrée déclarée du chapitre "${chapterName(startChapter)}"`);
  for (const [index, trigger] of (manifest.triggers ?? []).entries()) {
    const target = byPrefix.get(prefixOf(trigger.to));
    if (!target) errors.push(`déclencheur ${index + 1} : cible "${trigger.to}" dans un chapitre inconnu`);
    else if (!entryOwner(trigger.to)) warnings.push(`déclencheur ${index + 1} : cible "${trigger.to}" n'est pas une entrée déclarée du chapitre "${chapterName(target)}" (on y arrive de n'importe où)`);
  }
  if (manifest.death !== undefined) {
    const deathChapter = byPrefix.get(prefixOf(manifest.death));
    if (!deathChapter) errors.push(`death "${manifest.death}" : aucun chapitre ${prefixOf(manifest.death)}`);
    else if (!entryOwner(manifest.death)) warnings.push(`death "${manifest.death}" n'est pas une entrée déclarée du chapitre "${chapterName(deathChapter)}" (on y arrive de n'importe où)`);
  }

  const roots = [startChapter?.prefix, ...(manifest.triggers ?? []).map((trigger) => prefixOf(trigger.to))].filter((prefix) => byPrefix.has(prefix));
  const reachable = reachableFrom(edges, roots);
  chapters.filter((chapter) => !reachable.has(chapter.prefix)).forEach((chapter) => warnings.push(`chapitre "${chapterName(chapter)}" inatteignable depuis le départ`));

  const providers = { items: new Map(), flags: new Map() };
  const register = (key, id, prefix) => {
    if (!providers[key].has(id)) providers[key].set(id, new Set());
    providers[key].get(id).add(prefix);
  };
  if (startChapter) {
    (manifest.hero?.inventory ?? []).forEach((item) => register('items', item, startChapter.prefix));
    Object.keys(manifest.hero?.flags ?? {}).forEach((flag) => register('flags', flag, startChapter.prefix));
  }
  for (const chapter of chapters) {
    (chapter.provides?.items ?? []).forEach((item) => register('items', item, chapter.prefix));
    (chapter.provides?.flags ?? []).forEach((flag) => register('flags', flag, chapter.prefix));
  }
  const downstream = new Map(chapters.map((chapter) => [chapter.prefix, reachableFrom(edges, [chapter.prefix])]));
  for (const chapter of chapters) {
    const where = `chapitre "${chapterName(chapter)}"`;
    for (const [key, label] of [['items', 'objet'], ['flags', 'drapeau']]) {
      for (const id of chapter.requires?.[key] ?? []) {
        const sources = providers[key].get(id);
        if (!sources) errors.push(`${where} : requires.${key} "${id}" n'est fourni par aucun chapitre`);
        else if (![...sources].some((prefix) => downstream.get(prefix)?.has(chapter.prefix))) {
          warnings.push(`${where} : ${label} "${id}" requis mais fourni seulement par ${[...sources].join(', ')}, hors des chemins qui y mènent`);
        }
      }
    }
  }

  return { errors, warnings };
}
