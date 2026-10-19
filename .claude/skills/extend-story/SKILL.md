---
name: extend-story
description: Greffer une branche, un marchand, un combat ou une fin à une histoire existante du moteur de livre-jeu sans casser son graphe. Utiliser pour « ajoute une branche », « rallonge l'histoire », /extend-story <id> <ce qu'on ajoute>.
---

# Étendre une histoire : /extend-story <id> <ajout>

Même méthode que `/new-story` (lis ses références dans `../new-story/references/`), en partant de l'existant. Repère d'abord le style de l'histoire (voir `styles.md`) et écris la greffe dans ce style, pas dans un autre.

**Histoire en chapitres** : si `stories/<id>/source/` existe, l'histoire s'écrit dans `source/chapters/*.json` et `story.json` est généré (voir `README.md`, « Histoire en chapitres »). On ne modifie jamais `story.json` à la main : on greffe dans un chapitre ou dans un nouveau chapitre, on rebuild. Lis `source/bible.md` avant d'écrire.

1. **État des lieux** : lis `stories/<id>/story.json`, lance `node scripts/story-lint.mjs` et `node scripts/story-simulate.mjs` pour connaître le graphe, la couverture et la létalité actuels. Résume en dix lignes : carrefours, fins, objets et leur usage, mécaniques absentes. En chapitres : `node scripts/story-lint.mjs stories/<id>` donne le tableau des chapitres, la simulation donne le taux de visite par chapitre ; `build-map.json` traduit un identifiant joué (`412`) en identifiant source (`c03-5`).
2. **Greffe** : propose le tableau des paragraphes ajoutés ou modifiés (même format que la phase 2 de `/new-story`), avec le point d'ancrage (quel carrefour, quel choix nouveau) et ce que la branche apporte : une mécanique absente de la grille, un objet orphelin qui devient utile, une fin manquante. Les identifiants nouveaux ne réutilisent jamais un identifiant existant. En chapitres : dis dans quel chapitre la greffe s'inscrit (identifiants `c<nn>-<n>` libres de ce chapitre) ou, si elle fait plus de 25 paragraphes ou change de lieu, le nouveau chapitre `<nn>-<nom>.json` avec son contrat complet ; une sortie ajoutée à un chapitre exige l'entrée correspondante dans l'autre, un objet nouveau s'ajoute au manifeste et à la bible. Demande validation.
3. **Écriture** : modifie le JSON en touchant le moins possible aux paragraphes existants (un choix ajouté à un carrefour, pas une réécriture). En chapitres : chaque chapitre touché passe `node scripts/story-lint.mjs --chapter <fichier>` sans erreur, puis `node scripts/story-build.mjs stories/<id>` regénère `story.json` (la numérotation change : c'est attendu, les sauvegardes en cours sont perdues).
4. **Contrôle** : relance tests, lint et simulations ; compare l'avant/après de la létalité et de la distribution des fins. Une greffe ne doit pas déplacer la létalité de plus de 10 points sans que ce soit voulu.
5. **Rapport** court : ce qui a été ajouté, où ça s'accroche, les chiffres avant/après.

Ne commite pas sans qu'on te le demande.
