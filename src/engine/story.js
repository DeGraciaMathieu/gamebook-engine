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
  (story.hero?.inventory ?? []).forEach((item) => checkItem(item, 'hero.inventory'));

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
      checkTarget(paragraph.combat.win, `${combatWhere} (win)`);
      if (paragraph.combat.flee) checkTarget(paragraph.combat.flee.to, `${combatWhere} (flee)`);
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
