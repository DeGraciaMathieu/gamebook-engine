# Livre-jeu

Moteur de « livre dont vous êtes le héros » pour téléphone, en vanilla JS sans build.
Le moteur (`src/engine/`) ne connaît aucune histoire : chaque histoire est un fichier JSON dans `stories/`.

## Lancer

```bash
npm start        # sert le dossier sur http://localhost:8080
npm test         # tests du moteur (node:test)
```

Les histoires sont chargées par `fetch`, il faut donc un serveur HTTP (pas d'ouverture en `file://`).

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
tests/                     tests du moteur
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
      "habilete":  { "label": "Habileté",  "roll": "1d6+6" },
      "endurance": { "label": "Endurance", "roll": "2d6+12" },
      "chance":    { "label": "Chance",    "value": 9 }
    },
    "inventory": ["epee"],
    "flags": {}
  },
  "items": { "epee": { "name": "Épée" } },
  "paragraphs": { "1": { "...": "..." } }
}
```

- `start` : paragraphe de départ. `death` (optionnel) : paragraphe affiché quand l'endurance tombe à 0.
- `hero.stats` : chaque caractéristique a un `label` et soit `roll` (formule de dés), soit `value`. Les règles de combat utilisent `habilete` et `endurance`, le test de chance utilise `chance`. Une caractéristique ne dépasse jamais sa valeur de départ.
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

## Règles de combat

À chaque assaut, chaque camp lance 2d6 + Habileté. Le camp au score le plus bas perd 2 points d'Endurance ; égalité sans effet. Le combat se termine quand l'adversaire tombe à 0 (le jeu va au paragraphe `win`) ou quand le héros tombe à 0 (mort).
