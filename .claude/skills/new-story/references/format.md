# Fiche du format d'histoire

Fichier : `stories/<id>/story.json`, enregistré dans `stories/index.json` : `{ "id": "<id>", "path": "stories/<id>/story.json" }`.
La référence complète est dans `README.md` à la racine. Cette fiche donne un exemple minimal par mécanique.

## Squelette

```json
{
  "id": "crypte", "title": "Titre", "summary": "Deux phrases pour l'accueil.",
  "start": "1", "death": "mort",
  "hero": {
    "stats": {
      "habilete":  { "label": "Habileté",  "description": "Adresse au combat.", "base": 7,  "max": 12 },
      "endurance": { "label": "Endurance", "description": "Points de vie.",     "base": 14, "max": 24 },
      "chance":    { "label": "Chance",    "description": "Le sort, qui s'use.", "base": 7,  "max": 12 },
      "or":        { "label": "Or", "value": 6, "capped": false, "unit": "pièce d'or" }
    },
    "points": 8,
    "inventory": ["epee"],
    "flags": {}
  },
  "items": { "epee": { "name": "Épée" } },
  "paragraphs": { "1": { "text": "…", "choices": [] }, "mort": { "text": "…" } }
}
```

- `habilete`, `endurance`, `chance` sont les noms attendus par les règles de combat et de chance. Les labels et descriptions sont libres.
- Sans `hero.points`, chaque caractéristique prend `roll` (ex : `"2d6+12"`) ou `value` et la partie démarre sans écran de création.
- Une ressource (`capped: false`) s'accumule sans plafond ; `unit` au singulier.
- Une jauge inversée (`"inverted": true`) est une mauvaise nouvelle quand elle monte (radiation, faim, dette) : l'interface colore sa hausse en rouge et sa baisse en vert.
- Une horloge (`"tick": -1` sur la caractéristique) perd 1 à chaque choix pris sans l'annoncer ; les tests et les assauts ne comptent pas. Les gros coûts restent des effets chiffrés dans le texte. À combiner avec un déclencheur à 0.

## Paragraphe

`text` : chaîne ou tableau de chaînes (un élément par alinéa). `effects` optionnels appliqués à l'arrivée. Puis **un seul** parmi `choices`, `combat`, `test`. Un paragraphe sans les trois est une fin. `shop` s'ajoute à côté de `choices`.

`image` optionnel : `{ "src": "images/7.webp", "alt": "…", "prompt": "…" }`, généré par `scripts/story-illustrate.mjs` avec le style commun `art.style` de l'histoire. Illustrer le lieu, pas l'issue ; ne pas montrer le héros de face.

```json
"7": {
  "text": ["Alinéa 1.", "Alinéa 2."],
  "effects": [{ "type": "stat", "stat": "endurance", "delta": -2 }],
  "choices": [
    { "text": "Ouvrir avec la clef", "to": "8", "if": { "type": "item", "item": "clef" } },
    { "text": "Payer le passeur (3 pièces d'or)", "to": "9",
      "if": { "type": "stat", "stat": "or", "op": ">=", "value": 3 },
      "effects": [{ "type": "stat", "stat": "or", "delta": -3 }] },
    { "text": "Rebrousser chemin", "to": "6" }
  ]
}
```

## Combat

```json
"combat": { "name": "Squelette gardien", "habilete": 6, "endurance": 6, "win": "10", "flee": { "to": "6" } }
"combat": { "name": "Ours", "habilete": 7, "endurance": 10, "damage": 4, "armor": 1, "win": "12" }
"combat": { "name": "Les chiens", "stat": "endurance", "habilete": 8, "endurance": 6, "damage": 3, "win": "20", "flee": { "to": "21" } }
```
Chaque assaut : 2d6 + caractéristique de duel par camp (Habileté par défaut ; `stat` la remplace côté héros, `habilete` reste le score de l'adversaire). Le héros perdant encaisse `damage` (2 par défaut) ; l'adversaire perdant encaisse 2 moins `armor`. `flee` optionnel, fuir coûte `damage`. Mort du héros à 0 Endurance → paragraphe `death`.

Un duel sur une autre caractéristique change le sens des assauts, pas les règles : une course se joue sur l'Endurance (toucher = gagner du terrain, être touché = une pierre reçue), une joute sur la Volonté, une partie truquée sur la Chance. Le texte du paragraphe doit dire sur quoi ça se joue. Un modificateur de combat peut se limiter à un type de duel avec `combat.stat`.

Repères d'équilibrage pour un héros à 9 ou 10 d'Habileté : adversaire 5 à 6 = anecdotique, 7 à 8 = sérieux, 9 à 10 = redoutable, 11+ = boss à ne pas affronter sans préparation. L'Endurance de l'adversaire règle la durée (2 points par touche, moins l'armure). `damage` 3 ou 4 fait d'un adversaire moyen un danger mortel ; `armor` 1 double presque la durée du combat. Un duel sur l'Endurance oppose un score de 14 à 24 : donner à l'adversaire 12 à 18 d'`habilete`, pas 7.

## Tests

```json
"test": { "type": "luck", "success": "12", "failure": "13" }
"test": { "type": "stat", "stat": "habilete", "dice": "2d6", "success": "15", "failure": "17" }
```
Chance : réussite si 2d6 ≤ Chance, puis Chance −1 quoi qu'il arrive. Caractéristique : réussite si le jet ≤ valeur. Les paragraphes `success` et `failure` racontent le résultat dans leur texte.

## Conditions

```json
{ "type": "item", "item": "clef" }                      { "type": "item", "item": "clef", "present": false }
{ "type": "flag", "flag": "porte_ouverte" }             { "type": "flag", "flag": "x", "value": false }
{ "type": "stat", "stat": "or", "op": ">=", "value": 5 }   // op : < <= = != >= >
{ "type": "all", "conditions": [ … ] }  { "type": "any", "conditions": [ … ] }  { "type": "not", "condition": { … } }
```
Un choix dont la condition échoue est masqué, pas grisé.

## Effets

```json
{ "type": "stat", "stat": "endurance", "delta": -4 }      { "type": "setStat", "stat": "chance", "value": 12 }
{ "type": "flag", "flag": "autel_profane" }               { "type": "flag", "flag": "x", "value": false }
{ "type": "item", "action": "add", "item": "potion" }     { "type": "item", "action": "remove", "item": "potion" }
```
Les objets sont uniques : ajouter un objet déjà possédé ne fait rien. Une quantité se modélise en ressource, pas en objet.

## Déclencheurs

```json
"triggers": [
  { "label": "Le petit ne se réveille pas", "if": { "type": "stat", "stat": "souffle", "op": "=", "value": 0 }, "to": "134" }
]
```
Bloc à la racine. Évalué à chaque déplacement sur l'état au moment où le joueur agit : le paragraphe où la condition a basculé a donc été lu, et c'est le déplacement suivant qui est détourné vers `to`. Une fois par défaut ; `"once": false` pour une règle récurrente (elle ne tire jamais vers le paragraphe courant). Sert aux règles globales : mort d'un compagnon, seuil de faim ou de peur, dette qui déborde, réputation qui tombe. Le paragraphe cible doit avoir ses propres sorties ; il peut aussi être une fin.

Règle d'écriture : le paragraphe cible commence par constater ce qui s'est passé (« Le petit ne se réveille pas. »), car le joueur arrive de n'importe où.

## Modificateurs

```json
"modifiers": [
  { "label": "Hachette", "if": { "type": "item", "item": "hachette" }, "combat": { "attack": 1 } },
  { "label": "Le petit à protéger", "if": { "type": "stat", "stat": "souffle", "op": "<=", "value": 3 }, "combat": { "attack": -2 } },
  { "label": "Manteau de cuir", "if": { "type": "item", "item": "manteau" }, "combat": { "damageTaken": -1 } },
  { "label": "Mains gelées", "if": { "type": "flag", "flag": "mains_gelees" }, "test": { "stat": "habilete", "bonus": -2 } }
]
```
Bloc à la racine de l'histoire. Une règle est active tant que sa condition est vraie ; elle modifie l'attaque du héros (`attack`), les dégâts qu'il inflige (`damageDealt`) ou subit (`damageTaken`, négatif = armure), ou le seuil d'un test (`test.stat`, `test.bonus` ; `chance` pour le test de chance). Le `label` est affiché au joueur avec le signe : court, concret, 1 à 3 mots. C'est le mécanisme pour qu'un objet, un état ou un compagnon pèse sur les règles sans toucher au moteur.

Repères : +1 d'attaque vaut environ 7 % de victoires en plus sur un assaut équilibré ; −2 fait d'un adversaire sérieux un adversaire redoutable. Un bonus de test de +2 équivaut à deux points de caractéristique.

## Marchand

```json
"shop": { "currency": "or", "sell": [{ "item": "potion", "price": 5 }], "buy": [{ "item": "clef", "price": 4 }] }
```
Un article trop cher ou possédé reste visible mais grisé. Le paragraphe garde des `choices` pour sortir.

## Ce que l'interface fait toute seule

- Surligne dans le texte le nom d'un objet gagné ou perdu (nom complet ou premier mot) et la mention « N points d'Endurance » ou « N pièces d'or ». Ce qui n'est pas nommé est résumé sous le texte.
- Marque les choix déjà pris dans la partie.
- Anime dés, combats et tests, sauvegarde automatiquement.
