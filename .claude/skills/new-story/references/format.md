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

## Paragraphe

`text` : chaîne ou tableau de chaînes (un élément par alinéa). `effects` optionnels appliqués à l'arrivée. Puis **un seul** parmi `choices`, `combat`, `test`. Un paragraphe sans les trois est une fin. `shop` s'ajoute à côté de `choices`.

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
```
Chaque assaut : 2d6 + Habileté par camp, le perdant perd 2 Endurance. `flee` optionnel, fuir coûte 2 Endurance. Mort du héros à 0 Endurance → paragraphe `death`.

Repères d'équilibrage pour un héros à 9 ou 10 d'Habileté : adversaire 5 à 6 = anecdotique, 7 à 8 = sérieux, 9 à 10 = redoutable, 11+ = boss à ne pas affronter sans préparation. L'Endurance de l'adversaire règle la durée (2 points par touche).

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
