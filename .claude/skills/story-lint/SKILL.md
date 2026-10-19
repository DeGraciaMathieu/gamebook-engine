---
name: story-lint
description: Contrôler et simuler une histoire existante du moteur de livre-jeu (validation, atteignabilité, couverture des mécaniques, létalité). Utiliser pour « vérifie l'histoire », « équilibre », « simule », /story-lint <id>.
---

# Contrôler une histoire : /story-lint <id>

Sans argument, liste les identifiants de `stories/index.json` et demande lequel.

1. Exécute et lis intégralement :
   ```bash
   node scripts/story-lint.mjs stories/<id>/story.json
   node scripts/story-simulate.mjs stories/<id>/story.json --runs 3000
   node scripts/story-simulate.mjs stories/<id>/story.json --runs 3000 --strategy prudent
   ```
   Si `stories/<id>/source/` existe (histoire en chapitres), rebuild d'abord puis contrôle la source, qui ajoute les contrats de chapitre et garde les identifiants lisibles :
   ```bash
   node scripts/story-build.mjs stories/<id>
   node scripts/story-lint.mjs stories/<id>
   ```
   La simulation, lancée sur `story.json`, donne alors le taux de paragraphes jamais visités par chapitre et traduit les identifiants (`412 (c03-5)`).
2. Compare aux cibles de `../new-story/references/coverage.md` (section « Grands graphes » pour une histoire en chapitres : paragraphes vus par partie, jamais visités en tout et par chapitre, chapitres sous 3 % de passage, fins réparties).
3. Livre un diagnostic, pas un correctif. Vérifie aussi que chaque modificateur peut devenir actif (son objet s'obtient, son drapeau se pose, son seuil s'atteint) et que l'histoire en a au moins un de chaque signe. Vérifie que chaque déclencheur a une cible qui commence par constater la situation et que sa condition peut survenir ; signale les verrous répétés à plusieurs carrefours qui devraient être un déclencheur. Pour chaque erreur, avertissement, mécanique absente ou chiffre hors cible, dis ce que ça change pour le joueur et propose la correction la plus petite (un chiffre, un choix, un objet). Classe par gravité : bloquant, déséquilibre, cosmétique.
4. Applique les corrections seulement si l'utilisateur le demande, puis relance les trois commandes et montre l'avant/après. En chapitres, corrige dans `source/chapters/`, jamais dans `story.json`, et rebuild avant de simuler.
