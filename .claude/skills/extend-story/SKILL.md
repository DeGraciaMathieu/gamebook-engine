---
name: extend-story
description: Greffer une branche, un marchand, un combat ou une fin à une histoire existante du moteur de livre-jeu sans casser son graphe. Utiliser pour « ajoute une branche », « rallonge l'histoire », /extend-story <id> <ce qu'on ajoute>.
---

# Étendre une histoire : /extend-story <id> <ajout>

Même méthode que `/new-story` (lis ses trois références dans `../new-story/references/`), en partant de l'existant.

1. **État des lieux** : lis `stories/<id>/story.json`, lance `node scripts/story-lint.mjs` et `node scripts/story-simulate.mjs` pour connaître le graphe, la couverture et la létalité actuels. Résume en dix lignes : carrefours, fins, objets et leur usage, mécaniques absentes.
2. **Greffe** : propose le tableau des paragraphes ajoutés ou modifiés (même format que la phase 2 de `/new-story`), avec le point d'ancrage (quel carrefour, quel choix nouveau) et ce que la branche apporte : une mécanique absente de la grille, un objet orphelin qui devient utile, une fin manquante. Les identifiants nouveaux ne réutilisent jamais un identifiant existant. Demande validation.
3. **Écriture** : modifie le JSON en touchant le moins possible aux paragraphes existants (un choix ajouté à un carrefour, pas une réécriture).
4. **Contrôle** : relance tests, lint et simulations ; compare l'avant/après de la létalité et de la distribution des fins. Une greffe ne doit pas déplacer la létalité de plus de 10 points sans que ce soit voulu.
5. **Rapport** court : ce qui a été ajouté, où ça s'accroche, les chiffres avant/après.

Ne commite pas sans qu'on te le demande.
