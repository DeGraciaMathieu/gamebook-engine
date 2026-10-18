# Livre-jeu

Moteur de « livre dont vous êtes le héros » pour téléphone, en vanilla JS sans build.
Le moteur (`src/engine/`) ne connaît aucune histoire : chaque histoire est un fichier JSON dans `stories/`.

## Lancer

```bash
npm start        # sert le dossier sur http://localhost:8080, sans cache
npm test         # tests du moteur (node:test)
```

Les histoires sont chargées par `fetch`, il faut donc un serveur HTTP (pas d'ouverture en `file://`).

Les lancers de dés sont animés, avec un son synthétisé (Web Audio, sans fichier) et une vibration sur les appareils qui le permettent. Le son se coupe depuis le panneau ☰ ; la préférence est mémorisée.

## Contrôler et simuler une histoire

```bash
node scripts/story-lint.mjs stories/demo/story.json                 # validation, atteignabilité, orphelins, couverture des mécaniques
node scripts/story-simulate.mjs stories/demo/story.json --runs 3000  # parties jouées au hasard : fins, létalité, combats
node scripts/story-simulate.mjs stories/demo/story.json --strategy prudent
```

Avec Claude Code, `/new-story <thème>` écrit une histoire complète en passant par ces contrôles, `/story-lint <id>` diagnostique une histoire existante, `/extend-story <id> <ajout>` greffe une branche. Les skills sont dans `.claude/skills/`.

## Structure

```
index.html, style.css      page unique, thème livre papier
src/main.js                bootstrap, navigation accueil ↔ jeu, sauvegarde
src/engine/                moteur pur, sans DOM, testé
  dice.js                  formules de dés (2d6+12), aléatoire injectable
  conditions.js            conditions des choix
  effects.js               effets sur stats, flags, inventaire
  combat.js                règles de combat (Défis Fantastiques)
  game.js                  déroulé d'une partie : créer, choisir, tester, combattre, fuir
  story.js                 chargement et validation d'une histoire
src/storage.js             sauvegarde auto en localStorage, une par histoire
src/ui/                    rendu DOM : accueil, page de jeu
stories/index.json         liste des histoires disponibles
stories/<id>/story.json    une histoire
scripts/                   contrôle (story-lint) et simulation (story-simulate) d'une histoire
tests/                     tests du moteur
.claude/skills/            commandes Claude Code : new-story, story-lint, extend-story
```

## Ajouter une histoire

1. Créer `stories/<id>/story.json` (format ci-dessous).
2. L'ajouter dans `stories/index.json` : `{ "id": "<id>", "path": "stories/<id>/story.json" }`.

Une histoire invalide (cible manquante, objet inconnu…) est refusée au chargement avec la liste des erreurs.

## Format d'une histoire

```json
{
  "id": "demo",
  "title": "Titre affiché",
  "summary": "Résumé affiché sur l'accueil.",
  "start": "1",
  "death": "mort",
  "hero": {
    "stats": {
      "habilete":  { "label": "Habileté",  "base": 7,  "max": 12 },
      "endurance": { "label": "Endurance", "base": 14, "max": 24 },
      "chance":    { "label": "Chance",    "base": 7,  "max": 12 },
      "or":        { "label": "Or", "value": 6, "capped": false, "unit": "pièce d'or" }
    },
    "points": 8,
    "inventory": ["epee"],
    "flags": {}
  },
  "items": { "epee": { "name": "Épée" } },
  "paragraphs": { "1": { "...": "..." } }
}
```

- `start` : paragraphe de départ. `death` (optionnel) : paragraphe affiché quand l'endurance tombe à 0.
- `hero.stats` : chaque caractéristique a un `label`, une `description` optionnelle en quelques mots (affichée sur l'écran de création), et sa valeur de départ selon l'un des deux modèles ci-dessous. Les règles de combat utilisent `habilete` et `endurance`, le test de chance utilise `chance`. Une caractéristique ne dépasse jamais sa valeur de départ.
  - **Tirage aux dés** : `roll` (formule de dés) ou `value` (fixe). La partie commence directement.
  - **Répartition de points** : `hero.points` donne une réserve, chaque caractéristique a une `base` et un `max`. Un écran de création demande au joueur de placer toute la réserve avant de commencer. Une caractéristique avec `value` reste fixe et hors de la répartition.
- **Ressources** comme l'or : une caractéristique avec `"capped": false` n'a pas de plafond et s'affiche sans maximum. `unit`, au singulier (ex : `"pièce d'or"`), sert au surlignage de « 5 pièces d'or » dans le texte et à l'affichage du marchand.
- `items` : catalogue des objets, référencés par leur clé.

### Paragraphe

```json
"7": {
  "text": "Un seul paragraphe, ou un tableau de chaînes pour plusieurs.",
  "effects": [ { "type": "stat", "stat": "endurance", "delta": -2 } ],
  "choices": [
    { "text": "Ouvrir la porte", "to": "8", "if": { "type": "item", "item": "clef" }, "effects": [] }
  ]
}
```

Un paragraphe contient `text`, des `effects` optionnels appliqués à l'arrivée, puis **un seul** parmi :

- `choices` : liste de choix. Un choix dont la condition `if` échoue est masqué.
- `combat` : `{ "name", "habilete", "endurance", "win": "<id>", "flee": { "to": "<id>" } }`. `flee` est optionnel ; fuir coûte 2 points d'endurance.
- `test` : `{ "type": "luck", "success": "<id>", "failure": "<id>" }` (réussite si 2d6 ≤ chance, puis chance −1) ou `{ "type": "stat", "stat": "habilete", "dice": "2d6", "success", "failure" }` (réussite si jet ≤ caractéristique).

Un paragraphe sans `choices`, `combat` ni `test` est une fin.

### Marchand

```json
"shop": {
  "currency": "or",
  "sell": [ { "item": "potion", "price": 5 } ],
  "buy":  [ { "item": "clef_rouillee", "price": 4 } ]
}
```

`sell` liste ce que le marchand vend, `buy` ce qu'il reprend. Un article déjà possédé ou trop cher reste visible mais grisé. Un paragraphe avec `shop` garde des `choices` pour quitter la boutique. Péages, récompenses ou paris s'écrivent sans bloc dédié, avec une condition `stat` et un effet `delta` sur la ressource.

Quand un objet est obtenu ou perdu en arrivant sur une page, son nom est surligné dans le texte (nom complet, sinon son premier mot). Quand une caractéristique change, la mention « N points d'Endurance » (sinon le mot « Endurance ») est surlignée. Ce qui n'est pas mentionné dans le texte est récapitulé en italique sous le dernier paragraphe (« Vous obtenez : Clef rouillée · Endurance −2 »).

### Conditions

```json
{ "type": "flag", "flag": "porte_ouverte" }                 // "value": false pour tester l'absence
{ "type": "item", "item": "clef" }                           // "present": false pour tester l'absence
{ "type": "stat", "stat": "endurance", "op": ">=", "value": 5 }   // op : < <= = != >= >
{ "type": "all", "conditions": [ ... ] }
{ "type": "any", "conditions": [ ... ] }
{ "type": "not", "condition": { ... } }
```

### Effets

```json
{ "type": "stat", "stat": "endurance", "delta": -2 }
{ "type": "setStat", "stat": "chance", "value": 12 }
{ "type": "flag", "flag": "porte_ouverte" }                 // "value": false pour retirer
{ "type": "item", "action": "add", "item": "potion" }       // ou "remove"
```

### Déclencheurs

```json
"triggers": [
  { "label": "Le petit ne se réveille pas", "if": { "type": "stat", "stat": "souffle", "op": "=", "value": 0 }, "to": "134" },
  { "label": "Faim", "if": { "type": "stat", "stat": "vivres", "op": "=", "value": 0 }, "to": "60", "once": false }
]
```

À chaque déplacement (choix, issue d'un test, victoire ou fuite), le moteur évalue les déclencheurs sur l'état du héros au moment où il agit. Le premier dont la condition est vraie détourne vers son paragraphe `to` à la place de la destination prévue. Par défaut un déclencheur ne tire qu'une fois (`once: true`) ; répétable, il ne tire jamais vers le paragraphe où l'on se trouve déjà. C'est le moyen d'écrire une règle globale (mort d'un compagnon, seuil de faim, dette qui déborde) sans la répéter à chaque carrefour.

### Modificateurs

```json
"modifiers": [
  { "label": "Hachette", "if": { "type": "item", "item": "hachette" }, "combat": { "attack": 1 } },
  { "label": "Blessé", "if": { "type": "stat", "stat": "endurance", "op": "<=", "value": 5 }, "combat": { "attack": -1, "damageTaken": 1 } },
  { "label": "Amulette", "if": { "type": "flag", "flag": "beni" }, "test": { "stat": "chance", "bonus": 2 } }
]
```

Une règle s'applique tant que sa condition (même syntaxe que les choix) est vraie. `combat.attack` s'ajoute au jet du héros, `combat.damageDealt` et `combat.damageTaken` aux 2 points de dégâts (jamais sous zéro). `test.bonus` s'ajoute au seuil du test de la caractéristique `test.stat` (`chance` pour le test de chance). Les règles actives sont affichées avec leur signe dans le panneau de combat ou de test.

## Règles de combat

À chaque assaut, chaque camp lance 2d6 + Habileté. Le camp au score le plus bas perd 2 points d'Endurance ; égalité sans effet. Le combat se termine quand l'adversaire tombe à 0 (le jeu va au paragraphe `win`) ou quand le héros tombe à 0 (mort).
