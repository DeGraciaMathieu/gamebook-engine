// Mesure de la prose d'une histoire : longueurs, rythme des phrases, discours direct, chutes courtes,
// phrases nominales, expressions d'une liste noire, tournures répétées d'un paragraphe à l'autre.
// Les mesures sont des approximations lexicales, pensées pour signaler des tics, pas pour juger un texte.
import { readFileSync } from 'node:fs';

export const THRESHOLDS = {
  minParagraphs: 10, // en dessous, un groupe n'est pas évalué
  minSpread: 30, // écart p90 − p10 des longueurs en mots
  maxShortClose: 0.2, // part des paragraphes fermés par une phrase de 4 mots au plus
  maxNominalClose: 0.05, // part des paragraphes fermés par une phrase nominale
  minDialogue: 0.15, // part des paragraphes avec discours direct
  blacklistPer: 50, // une occurrence tolérée pour N paragraphes
  ngramMin: 3,
  ngramMax: 5,
  ngramParagraphs: 5, // une tournure présente dans N paragraphes ou plus (ou 2 % du groupe) est répétée
};

const STOPWORDS = new Set(('le la les l un une des du de d au aux et ou ni que qui quoi dont où ne pas plus en y à a vous votre vos il elle ils elles on se sa son ses ce cet cette ces c est sont sur sous dans par pour avec sans vers chez entre jusqu puis mais car si là ici tout toute tous toutes même aussi encore déjà très bien peu rien quelque chose comme plus moins y en lui leur leurs me te nous n\'y c\'est qu\'il qu\'elle qu\'on d\'un d\'une n\'est n\'a s\'il'
).split(/\s+/));

const MECHANICS = /\d|\b(points?|rads?|roubles?|pièces?|minutes?|chance|habileté|endurance|souffle|sang-froid|temps|testez|tentez|perdez|gagnez|regagnez|prenez|videz)\b/i;

export function textOf(paragraph) {
  return [].concat(paragraph.text ?? []).join(' ');
}

export function words(text) {
  return text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token));
}

// Découpe en phrases sur . ! ? … ; les guillemets ou parenthèses fermants restent collés à la phrase.
export function sentences(text) {
  const parts = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?…])\s+/);
  const result = [];
  for (const part of parts) {
    const closing = result.length > 0 && /^([»")\]]+)\s*(.*)$/s.exec(part);
    if (closing) {
      result[result.length - 1] += ` ${closing[1]}`;
      if (closing[2]) result.push(closing[2]);
    } else if (part) {
      result.push(part);
    }
  }
  return result.map((sentence) => sentence.trim()).filter((sentence) => words(sentence).length > 0);
}

export function hasDialogue(text) {
  return /«|“|(^|\s)— |^- /m.test(text);
}

// Phrase nominale : trois mots au plus, ouverte par un article. « Le silence. » « Une cheminée. »
export function isNominal(sentence) {
  const tokens = words(sentence);
  return tokens.length <= 3 && /^(le|la|les|l'|l’|un|une|des|du)\b/i.test(sentence);
}

export function readBlacklist(file) {
  return readFileSync(file, 'utf8').split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => ({ label: line.replace(/\\b/g, '').replace(/\\/g, ''), re: new RegExp(line, 'iu') }));
}

export function measureParagraph(paragraph, blacklist = []) {
  const text = textOf(paragraph);
  const phrases = sentences(text);
  const last = phrases[phrases.length - 1] ?? '';
  return {
    words: words(text).length,
    sentences: phrases.map((sentence) => words(sentence).length),
    dialogue: hasDialogue(text),
    shortClose: phrases.length > 0 && words(last).length <= 4,
    nominalClose: phrases.length > 0 && isNominal(last),
    blacklist: blacklist.filter(({ re }) => re.test(text)).map(({ label }) => label),
  };
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

function tokens(text) {
  return text.toLowerCase().replace(/[’]/g, '\'').split(/[^\p{L}\p{N}']+/u).filter(Boolean);
}

// Tournures de n mots présentes dans plusieurs paragraphes, hors suites de mots-outils et hors mécanique.
export function repeatedNgrams(texts, { ngramMin, ngramMax, ngramParagraphs } = THRESHOLDS) {
  const seen = new Map();
  texts.forEach((text, index) => {
    const list = tokens(text);
    for (let n = ngramMin; n <= ngramMax; n++) {
      for (let i = 0; i + n <= list.length; i++) {
        const gram = list.slice(i, i + n);
        if (gram.every((token) => STOPWORDS.has(token.replace(/'$/, '')))) continue;
        const key = gram.join(' ');
        if (MECHANICS.test(key)) continue;
        if (!seen.has(key)) seen.set(key, new Set());
        seen.get(key).add(index);
      }
    }
  });
  const repeated = [...seen.entries()].filter(([, set]) => set.size >= ngramParagraphs)
    .map(([gram, set]) => ({ gram, count: set.size }));
  // Une tournure contenue dans une tournure plus longue au même compte n'apporte rien.
  const kept = repeated.filter(({ gram, count }) => !repeated.some((other) => other.gram !== gram && other.gram.includes(gram) && other.count === count));
  return kept.sort((a, b) => b.count - a.count || a.gram.localeCompare(b.gram));
}

export function measureGroup(paragraphs, blacklist = [], thresholds = THRESHOLDS) {
  const list = Object.values(paragraphs);
  const measures = list.map((paragraph) => measureParagraph(paragraph, blacklist));
  const lengths = measures.map((m) => m.words).sort((a, b) => a - b);
  const sentenceLengths = measures.flatMap((m) => m.sentences).sort((a, b) => a - b);
  const count = measures.length;
  const blacklistCounts = {};
  for (const m of measures) for (const label of m.blacklist) blacklistCounts[label] = (blacklistCounts[label] ?? 0) + 1;
  return {
    count,
    words: { min: lengths[0] ?? 0, median: percentile(lengths, 0.5), max: lengths[lengths.length - 1] ?? 0, p10: percentile(lengths, 0.1), p90: percentile(lengths, 0.9) },
    sentence: { median: percentile(sentenceLengths, 0.5), p10: percentile(sentenceLengths, 0.1), p90: percentile(sentenceLengths, 0.9) },
    dialogue: count ? measures.filter((m) => m.dialogue).length / count : 0,
    shortClose: count ? measures.filter((m) => m.shortClose).length / count : 0,
    nominalClose: count ? measures.filter((m) => m.nominalClose).length / count : 0,
    blacklist: blacklistCounts,
    ngrams: repeatedNgrams(list.map(textOf), { ...thresholds, ngramParagraphs: Math.max(thresholds.ngramParagraphs, Math.round(count * 0.02)) }),
  };
}

export function checkProse(metrics, thresholds = THRESHOLDS, label = '') {
  const where = label ? `${label} : ` : '';
  const warnings = [];
  if (metrics.count < thresholds.minParagraphs) return warnings;
  const pct = (value) => `${Math.round(value * 100)} %`;
  if (metrics.words.p90 - metrics.words.p10 < thresholds.minSpread) {
    warnings.push(`${where}longueurs uniformes (${metrics.words.p10} à ${metrics.words.p90} mots pour 80 % des paragraphes), visez des scènes longues et des transitions courtes`);
  }
  if (metrics.shortClose > thresholds.maxShortClose) {
    warnings.push(`${where}${pct(metrics.shortClose)} des paragraphes se ferment sur une chute de 4 mots au plus (au plus ${pct(thresholds.maxShortClose)})`);
  }
  if (metrics.nominalClose > thresholds.maxNominalClose) {
    warnings.push(`${where}${pct(metrics.nominalClose)} des paragraphes se ferment sur une phrase nominale (au plus ${pct(thresholds.maxNominalClose)})`);
  }
  if (metrics.dialogue < thresholds.minDialogue) {
    warnings.push(`${where}${pct(metrics.dialogue)} des paragraphes portent un discours direct (au moins ${pct(thresholds.minDialogue)}, sauf chapitre sans personnage)`);
  }
  const tolerated = Math.max(1, Math.floor(metrics.count / thresholds.blacklistPer));
  for (const [expr, n] of Object.entries(metrics.blacklist)) {
    if (n > tolerated) warnings.push(`${where}« ${expr} » dans ${n} paragraphes (${tolerated} toléré)`);
  }
  for (const { gram, count } of metrics.ngrams) {
    warnings.push(`${where}tournure répétée « ${gram} » dans ${count} paragraphes`);
  }
  return warnings;
}

// Compare deux versions d'une histoire ou d'un chapitre : seuls les champs `text` des paragraphes ont le
// droit de changer. Rend les identifiants réécrits et les erreurs.
export function diffProse(before, after) {
  const errors = [];
  const rewritten = [];
  const strip = (value) => {
    const { paragraphs, ...rest } = value;
    return rest;
  };
  if (JSON.stringify(strip(before)) !== JSON.stringify(strip(after))) errors.push('un champ hors paragraphes a changé');
  const beforeIds = Object.keys(before.paragraphs ?? {});
  const afterIds = Object.keys(after.paragraphs ?? {});
  for (const id of beforeIds) if (!(id in (after.paragraphs ?? {}))) errors.push(`paragraphe "${id}" supprimé`);
  for (const id of afterIds) if (!(id in (before.paragraphs ?? {}))) errors.push(`paragraphe "${id}" ajouté`);
  for (const id of beforeIds) {
    const a = after.paragraphs?.[id];
    if (!a) continue;
    const { text: textBefore, ...restBefore } = before.paragraphs[id];
    const { text: textAfter, ...restAfter } = a;
    if (JSON.stringify(restBefore) !== JSON.stringify(restAfter)) errors.push(`paragraphe "${id}" : autre chose que le texte a changé`);
    if (JSON.stringify(textBefore) !== JSON.stringify(textAfter)) rewritten.push(id);
  }
  return { errors, rewritten };
}
