---
name: new-story
description: Écrire une histoire complète pour le moteur de livre-jeu (stories/<id>/story.json) en exploitant toutes ses mécaniques, puis la contrôler et la simuler. Utiliser pour « nouvelle histoire », « écris un scénario », « génère une aventure », /new-story <thème>.
---

# Écrire une histoire : /new-story <thème>

Tu écris une histoire pour le moteur de ce dépôt. Le moteur est pur et validé : tu peux donc contrôler et simuler ce que tu écris. Lis d'abord les trois références de ce dossier :

- `references/format.md` : le JSON, un exemple par mécanique, repères d'équilibrage.
- `references/writing.md` : ce que le texte doit nommer pour que l'interface le surligne, règles valables pour tous les styles.
- `references/styles.md` : les styles d'écriture au choix (Défis Fantastiques, sobre, picaresque), avec leurs règles propres.
- `references/coverage.md` : contraintes de graphe, grille de couverture, cibles de létalité.

Le déroulé a cinq phases. Chaque phase se termine par un livrable montré à l'utilisateur. Les phases 1 et 2 attendent sa validation (AskUserQuestion) ; les suivantes s'enchaînent sans question sauf blocage.

## Phase 1 : cadrage

Si l'argument ne le dit pas, pose au plus quatre questions en un seul appel : style d'écriture (Défis Fantastiques, sobre, picaresque, voir `references/styles.md`), ton (sombre, héroïque, humoristique, étrange), taille (court 25, moyen 50, long 90 paragraphes), difficulté (douce, standard, rude). Si l'utilisateur nomme un livre ou un auteur, propose le style le plus proche et dis pourquoi. Puis livre :

1. **Pitch** en cinq lignes : lieu, objectif du héros, antagoniste, enjeu en cas d'échec, twist possible.
2. **Fiche du héros** : les trois caractéristiques avec `description` (une phrase chacune), réserve de points, or de départ, inventaire initial (2 objets au plus, chacun utile plus tard).
3. **Catalogue des objets** : identifiant, nom affiché, où on l'obtient, à quoi il sert. 6 à 12 objets selon la taille. Chaque objet a au moins un usage (condition, revente, consommation, modificateur).
4. **Modificateurs** : les règles qui pèsent sur les combats et les tests (arme, armure, blessure, faim, compagnon), avec leur condition et leur valeur. Au moins un bonus et un malus.
5. **Déclencheurs** : les règles globales qui détournent le récit quand un seuil est franchi (compagnon qui meurt, faim, dette), avec leur condition et leur paragraphe cible. Zéro si l'histoire n'en a pas besoin, mais toute seconde jauge en appelle un.

Demande validation avant la phase 2.

## Phase 2 : squelette

Avant toute prose, le graphe sous forme de tableau Markdown, une ligne par paragraphe :

| id | rôle | mécanique | sorties | accès conditionné |
|---|---|---|---|---|

Rôles possibles : départ, carrefour, scène, combat, test, marchand, verrou, fin, mort. Applique les contraintes de `references/coverage.md` et montre explicitement :

- les carrefours et les boucles,
- les trois fins hors mort et ce que chacune exige,
- où chaque objet s'obtient et où il sert,
- où la ressource se gagne et se dépense,
- où chaque modificateur devient actif ou cesse de l'être,
- où chaque déclencheur peut se déclencher et où il mène,
- la grille de couverture cochée mécanique par mécanique.

Les identifiants sont mélangés (pas dans l'ordre de lecture). Demande validation avant la phase 3 ; si l'utilisateur ajuste, reprends le tableau complet.

## Phase 3 : écriture

Écris le JSON en une passe, paragraphe par paragraphe, dans `stories/<id>/story.json`, puis ajoute l'entrée dans `stories/index.json`. Applique le style choisi tel que `references/styles.md` le décrit (voix, longueur, formules, règles en capitales ou non, choix annoncés en prose ou non), et respecte `references/writing.md` à la lettre, en particulier : nommer les objets avec le nom du catalogue, chiffrer les variations avec leur unité, annoncer les tests dans le texte, dire le résultat dès la première phrase des paragraphes cibles.

Ne montre pas le JSON à l'utilisateur à ce stade : la phase 4 le contrôle d'abord.

## Phase 4 : contrôle et équilibrage

Exécute dans l'ordre, et corrige jusqu'à satisfaction :

```bash
npm test
node scripts/story-lint.mjs stories/<id>/story.json
node scripts/story-simulate.mjs stories/<id>/story.json --runs 3000
node scripts/story-simulate.mjs stories/<id>/story.json --runs 3000 --strategy prudent
```

- Le lint doit sortir sans erreur. Chaque avertissement est soit corrigé, soit justifié dans le rapport final (un objet purement narratif se justifie, un paragraphe inatteignable jamais).
- Aucune mécanique absente dans la grille de couverture.
- La létalité et la distribution des fins doivent entrer dans les cibles de `references/coverage.md` pour la difficulté demandée. Pour ajuster : Habileté et Endurance des adversaires, dégâts des pièges, prix du marchand, placement des potions, ajout d'une fuite, valeur ou condition d'un modificateur. Relance la simulation après chaque ajustement. Trois itérations au plus ; au-delà, expose le compromis à l'utilisateur.

## Phase 5 : rapport

Un message court pour l'utilisateur :

1. Pitch en deux lignes, style retenu et chemin vers le fichier.
2. Le graphe résumé : nombre de paragraphes, carrefours, fins et leurs conditions.
3. Les chiffres de simulation (les deux stratégies) dans un petit tableau.
4. Les choix de conception discutables et les avertissements du lint laissés volontairement.
5. La commande pour jouer : `npm start` puis http://localhost:8080.

Ne commite pas sans qu'on te le demande.

## Garde-fous

- Le moteur ne se modifie pas pendant cette commande. Si une mécanique manque, note-la dans le rapport final au lieu de l'implémenter.
- Un paragraphe ne porte qu'un seul de `choices`, `combat`, `test` (`shop` accompagne `choices`).
- Jamais de choix masqué sans alternative visible : le joueur doit toujours pouvoir avancer.
- Les objets sont uniques ; une quantité est une ressource.
