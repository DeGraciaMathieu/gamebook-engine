import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkChapterContract, checkSourceContracts } from '../scripts/lib/story-contracts.mjs';

const chapter = (prefix, overrides = {}) => ({
  prefix,
  file: `${prefix.slice(1)}-x.json`,
  title: `Chapitre ${prefix}`,
  summary: 'Résumé.',
  entries: { [`${prefix}-1`]: 'Entrée' },
  exits: {},
  paragraphs: { [`${prefix}-1`]: { text: 'Fin' } },
  ...overrides,
});
const has = (list, needle) => list.some((message) => message.includes(needle));

test('un chapitre complet et cohérent passe sans erreur ni avertissement', () => {
  const result = checkChapterContract(chapter('c01', {
    exits: { 'c02-1': 'Suite' },
    provides: { items: ['clef'], flags: [] },
    paragraphs: {
      'c01-1': { text: 'Clef', effects: [{ type: 'item', action: 'add', item: 'clef' }], choices: [{ text: 'Aller', to: 'c02-1' }] },
    },
  }));
  assert.deepEqual(result, { errors: [], warnings: [] });
});

test('le contrat exige titre, résumé, entrées et sorties sous forme d\'objets', () => {
  const { errors } = checkChapterContract({ prefix: 'c01', entries: [], exits: 'c02-1', provides: { items: 'clef' }, image: 3, paragraphs: {} });
  for (const needle of ['"title"', '"summary"', '"entries"', '"exits"', '"provides"', '"image"']) {
    assert.ok(has(errors, needle), `erreur attendue pour ${needle} :\n${errors.join('\n')}`);
  }
});

test('entrées hors chapitre, sorties internes et cibles externes non déclarées sont des erreurs', () => {
  const { errors, warnings } = checkChapterContract(chapter('c01', {
    entries: { 'c02-1': 'Ailleurs', 'c01-9': 'Absente' },
    exits: { 'c01-1': 'Interne', 'c03-1': 'Jamais visée' },
    paragraphs: { 'c01-1': { text: 'x', choices: [{ text: 'a', to: 'c02-5' }] } },
  }));
  assert.ok(has(errors, 'entrée "c02-1" hors du chapitre'));
  assert.ok(has(errors, 'entrée "c01-9" absente'));
  assert.ok(has(errors, 'sortie "c01-1" est interne'));
  assert.ok(has(errors, 'vise "c02-5", ni dans le chapitre ni déclaré dans exits'));
  assert.ok(has(warnings, 'sortie "c03-1" déclarée mais aucun paragraphe'));
});

test('provides et requires sont confrontés aux effets et conditions du chapitre', () => {
  const { warnings } = checkChapterContract(chapter('c01', {
    provides: { items: ['fantome'], flags: [] },
    requires: { items: ['inutile'], flags: [] },
    paragraphs: {
      'c01-1': {
        text: 'x',
        effects: [{ type: 'item', action: 'add', item: 'clef' }, { type: 'flag', flag: 'vu' }],
        choices: [{ text: 'a', to: 'c01-2', if: { type: 'item', item: 'lampe' } }, { text: 'b', to: 'c01-2', if: { type: 'flag', flag: 'ailleurs' } }],
      },
      'c01-2': { text: 'Fin' },
    },
  }));
  assert.ok(has(warnings, 'objet "clef" obtenu mais absent de provides.items'));
  assert.ok(has(warnings, 'provides.items "fantome" déclaré mais jamais obtenu'));
  assert.ok(has(warnings, 'objet "lampe" utilisé mais ni fourni ni déclaré dans requires.items'));
  assert.ok(has(warnings, 'requires.items "inutile" déclaré mais jamais utilisé'));
  assert.ok(has(warnings, 'drapeau "vu" posé mais absent de provides.flags'));
  assert.ok(has(warnings, 'drapeau "ailleurs" testé mais ni fourni ni déclaré dans requires.flags'));
});

test('un paragraphe inatteignable depuis les entrées est signalé', () => {
  const { warnings } = checkChapterContract(chapter('c01', {
    paragraphs: { 'c01-1': { text: 'Fin' }, 'c01-2': { text: 'Perdu' } },
  }));
  assert.ok(has(warnings, '"c01-2" inatteignable depuis les entrées'));
});

test('une illustration par chapitre, celle du contrat', () => {
  const image = { src: 'images/x.webp', alt: 'x' };
  const { errors, warnings } = checkChapterContract(chapter('c01', {
    image: 'c01-3',
    paragraphs: { 'c01-1': { text: 'x', image, choices: [{ text: 'a', to: 'c01-2' }] }, 'c01-2': { text: 'Fin', image } },
  }));
  assert.ok(has(errors, 'image "c01-3" ne désigne aucun paragraphe'));
  assert.ok(has(warnings, '"c01-1" illustré sans être l\'image du contrat'));
  const missing = checkChapterContract(chapter('c01', { image: 'c01-1' }));
  assert.ok(has(missing.warnings, '"c01-1" devrait porter l\'illustration'));
});

test('un chapitre sans paragraphes ne vérifie que son contrat', () => {
  const result = checkChapterContract(chapter('c01', { exits: { 'c02-1': 'Suite' }, paragraphs: {} }));
  assert.deepEqual(result, { errors: [], warnings: [] });
});

test('les sorties doivent viser des entrées déclarées et chaque chapitre doit être atteignable', () => {
  const { errors, warnings } = checkSourceContracts({
    manifest: { start: 'c01-1', death: 'c01-9', triggers: [{ to: 'c02-7' }] },
    chapters: [
      chapter('c01', { exits: { 'c02-4': 'Pas une entrée', 'c09-1': 'Inconnu' } }),
      chapter('c02'),
      chapter('c03'),
    ],
  });
  assert.ok(has(errors, 'sortie "c02-4" n\'est pas une entrée déclarée du chapitre "02-x.json"'));
  assert.ok(has(errors, 'sortie "c09-1" vers un chapitre inconnu'));
  assert.ok(!has(warnings, 'chapitre "02-x.json" inatteignable'), 'c02 est atteint par le déclencheur');
  assert.ok(has(warnings, 'chapitre "03-x.json" inatteignable'));
  assert.ok(has(warnings, 'déclencheur 1 : cible "c02-7" n\'est pas une entrée'));
  assert.ok(has(warnings, 'death "c01-9" n\'est pas une entrée'));
});

test('un objet requis doit être fourni en amont, par un chapitre ou par le héros', () => {
  const { errors, warnings } = checkSourceContracts({
    manifest: { start: 'c01-1', hero: { inventory: ['epee'], flags: {} } },
    chapters: [
      chapter('c01', { exits: { 'c02-1': 'Suite', 'c03-1': 'Ailleurs' } }),
      chapter('c02', { requires: { items: ['epee', 'clef', 'lampe'], flags: ['vu'] }, exits: { 'c03-1': 'Suite' } }),
      chapter('c03', { provides: { items: ['clef'], flags: ['vu'] } }),
    ],
  });
  assert.ok(has(errors, 'requires.items "lampe" n\'est fourni par aucun chapitre'));
  assert.ok(has(warnings, 'objet "clef" requis mais fourni seulement par c03'));
  assert.ok(has(warnings, 'drapeau "vu" requis mais fourni seulement par c03'));
  assert.ok(!has(warnings, '"epee"'));
  assert.ok(!has(errors, '"epee"'));
});

test('un chapitre peut fournir lui-même ce qu\'il requiert, et le départ fournit tout l\'aval', () => {
  const { errors, warnings } = checkSourceContracts({
    manifest: { start: 'c01-1' },
    chapters: [
      chapter('c01', { exits: { 'c02-1': 'Suite' }, provides: { items: ['clef'], flags: [] } }),
      chapter('c02', { requires: { items: ['clef'], flags: ['vu'] }, provides: { items: [], flags: ['vu'] } }),
    ],
  });
  assert.deepEqual({ errors, warnings }, { errors: [], warnings: [] });
});
