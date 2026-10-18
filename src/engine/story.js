export function getParagraph(story, id) {
  const paragraph = story.paragraphs[id];
  if (!paragraph) {
    throw new Error(`Paragraphe introuvable : ${id}`);
  }
  return paragraph;
}

export function isEnding(paragraph) {
  return !paragraph.combat && !paragraph.test && !(paragraph.choices?.length > 0);
}

export async function loadStory(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Impossible de charger l'histoire : ${url}`);
  }
  const story = await response.json();
  const errors = validateStory(story);
  if (errors.length > 0) {
    throw new Error(`Histoire invalide (${story.id ?? url}) :\n- ${errors.join('\n- ')}`);
  }
  return story;
}

export function validateStory(story) {
  const errors = [];
  const paragraphs = story.paragraphs ?? {};
  const stats = Object.keys(story.hero?.stats ?? {});
  const items = Object.keys(story.items ?? {});

  const checkTarget = (id, where) => {
    if (!paragraphs[id]) errors.push(`${where} : paragraphe cible "${id}" introuvable`);
  };
  const checkStat = (stat, where) => {
    if (!stats.includes(stat)) errors.push(`${where} : caractéristique "${stat}" inconnue`);
  };
  const checkItem = (item, where) => {
    if (!items.includes(item)) errors.push(`${where} : objet "${item}" inconnu`);
  };
  const checkEffects = (effects, where) => {
    for (const effect of effects ?? []) {
      if (effect.type === 'stat' || effect.type === 'setStat') checkStat(effect.stat, where);
      if (effect.type === 'item') checkItem(effect.item, where);
    }
  };
  const checkCondition = (condition, where) => {
    if (!condition) return;
    if (condition.type === 'stat') checkStat(condition.stat, where);
    if (condition.type === 'item') checkItem(condition.item, where);
    if (condition.type === 'not') checkCondition(condition.condition, where);
    if (condition.type === 'all' || condition.type === 'any') {
      (condition.conditions ?? []).forEach((child) => checkCondition(child, where));
    }
  };

  if (!story.id) errors.push('Champ "id" manquant');
  if (!story.title) errors.push('Champ "title" manquant');
  if (!story.start) errors.push('Champ "start" manquant');
  else checkTarget(story.start, 'start');
  if (story.death) checkTarget(story.death, 'death');
  if (stats.length === 0) errors.push('Aucune caractéristique définie dans hero.stats');
  if (story.hero?.points !== undefined) checkCreation(story, errors);
  (story.hero?.inventory ?? []).forEach((item) => checkItem(item, 'hero.inventory'));

  for (const [index, trigger] of (story.triggers ?? []).entries()) {
    const where = `déclencheur ${index + 1}`;
    if (!trigger.if) errors.push(`${where} : condition "if" manquante`);
    checkCondition(trigger.if, where);
    checkTarget(trigger.to, where);
  }

  for (const [index, modifier] of (story.modifiers ?? []).entries()) {
    const where = `modificateur ${index + 1}`;
    if (!modifier.label) errors.push(`${where} : "label" manquant`);
    if (!modifier.if) errors.push(`${where} : condition "if" manquante`);
    checkCondition(modifier.if, where);
    if (!modifier.combat && !modifier.test) errors.push(`${where} : ni "combat" ni "test"`);
    for (const key of Object.keys(modifier.combat ?? {})) {
      if (key === 'stat') checkStat(modifier.combat.stat, `${where} (combat.stat)`);
      else if (!['attack', 'damageDealt', 'damageTaken'].includes(key)) errors.push(`${where} : champ combat.${key} inconnu`);
      else if (typeof modifier.combat[key] !== 'number') errors.push(`${where} : combat.${key} doit être un nombre`);
    }
    if (modifier.test) {
      checkStat(modifier.test.stat, `${where} (test)`);
      if (typeof modifier.test.bonus !== 'number') errors.push(`${where} : test.bonus doit être un nombre`);
    }
  }

  for (const [id, paragraph] of Object.entries(paragraphs)) {
    const where = `paragraphe "${id}"`;
    if (!paragraph.text) errors.push(`${where} : texte manquant`);
    checkEffects(paragraph.effects, where);

    for (const [index, choice] of (paragraph.choices ?? []).entries()) {
      const choiceWhere = `${where}, choix ${index + 1}`;
      if (!choice.text) errors.push(`${choiceWhere} : texte manquant`);
      checkTarget(choice.to, choiceWhere);
      checkCondition(choice.if, choiceWhere);
      checkEffects(choice.effects, choiceWhere);
    }

    if (paragraph.combat) {
      const combatWhere = `${where}, combat`;
      if (!paragraph.combat.name) errors.push(`${combatWhere} : nom de l'adversaire manquant`);
      if (paragraph.combat.stat !== undefined) checkStat(paragraph.combat.stat, `${combatWhere} (stat)`);
      for (const key of ['damage', 'armor']) {
        const value = paragraph.combat[key];
        if (value !== undefined && (typeof value !== 'number' || value < 0)) errors.push(`${combatWhere} : ${key} doit être un nombre positif`);
      }
      checkTarget(paragraph.combat.win, `${combatWhere} (win)`);
      if (paragraph.combat.flee) checkTarget(paragraph.combat.flee.to, `${combatWhere} (flee)`);
    }

    if (paragraph.shop) {
      const shopWhere = `${where}, boutique`;
      checkStat(paragraph.shop.currency, `${shopWhere} (currency)`);
      if (!(paragraph.choices?.length > 0)) errors.push(`${shopWhere} : aucun choix pour quitter la boutique`);
      for (const offer of [...(paragraph.shop.sell ?? []), ...(paragraph.shop.buy ?? [])]) {
        checkItem(offer.item, shopWhere);
        if (typeof offer.price !== 'number' || offer.price < 0) errors.push(`${shopWhere} : prix invalide pour "${offer.item}"`);
      }
    }

    if (paragraph.test) {
      const testWhere = `${where}, test`;
      if (!['luck', 'stat'].includes(paragraph.test.type)) {
        errors.push(`${testWhere} : type "${paragraph.test.type}" inconnu`);
      }
      if (paragraph.test.type === 'stat') checkStat(paragraph.test.stat, testWhere);
      checkTarget(paragraph.test.success, `${testWhere} (success)`);
      checkTarget(paragraph.test.failure, `${testWhere} (failure)`);
    }
  }

  return errors;
}

// Avec une réserve de points, chaque caractéristique a soit une valeur fixe, soit une base et un maximum,
// et la réserve doit pouvoir être placée.
function checkCreation(story, errors) {
  let capacity = 0;
  for (const [name, definition] of Object.entries(story.hero.stats)) {
    const where = `hero.stats.${name}`;
    if (definition.base === undefined && definition.max === undefined) {
      if (typeof definition.value !== 'number') errors.push(`${where} : "value" ou "base" et "max" manquants`);
      continue;
    }
    if (typeof definition.base !== 'number') errors.push(`${where} : "base" manquante`);
    if (typeof definition.max !== 'number') errors.push(`${where} : "max" manquant`);
    if (definition.max < definition.base) errors.push(`${where} : "max" inférieur à "base"`);
    capacity += Math.max(0, (definition.max ?? 0) - (definition.base ?? 0));
  }
  if (capacity < story.hero.points) {
    errors.push(`hero.points : ${story.hero.points} points ne peuvent pas tous être placés (capacité ${capacity})`);
  }
}
