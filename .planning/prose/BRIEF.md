# Prose romancée (moins de marqueurs IA)

**One-liner** : rendre la prose des histoires plus romanesque et mieux écrite, en mesurant les tics d'écriture générée, en réécrivant les consignes, et en ajoutant une passe de réécriture et de relecture à la chaîne de fabrication.

## Problème

Les histoires passent le lint et la simulation, mais la prose se reconnaît comme générée. Mesures sur L'Exauceur de vœux (1016 paragraphes, style sobre), relevées le 2026-10-20 :

- **Longueur uniforme** : tous les paragraphes font 40 à 90 mots, médiane 58. Aucune scène ne s'étire, aucune transition ne respire.
- **Rythme haché** : phrases de 8 mots en médiane, un dixième à 3 mots ou moins ; 220 paragraphes se ferment sur une chute de 4 mots au plus (« Ils vous attendent. »). 94 phrases nominales du type « Le silence. ».
- **Motifs répétés** : « crépite » 51 fois, « se tait » 36, « Personne ne » 35, « longtemps » 35, « quelque part » 34, « comme si » 27, « ne bouge pas » 26, « comme on » 24, « dans le noir » 20, « Quelque chose » 19, « Puis plus rien » 15.
- **Presque pas de parole** : 86 paragraphes sur 1016 contiennent un dialogue, souvent au discours indirect. Les personnages récurrents (Barman, Guide, Sidorovitch) n'ont pas de voix.
- **Vignettes fermées** : chaque paragraphe est une image autonome. Rien ne se répond d'un chapitre à l'autre, aucune scène ne dure, aucun personnage n'évolue.

Les causes sont autant dans nos consignes que dans le modèle : `styles.md` demande « phrases courtes, ellipses, une image concrète par paragraphe », et tous les rédacteurs convergent vers le même registre ; le lint contrôle la mécanique, jamais la prose ; chaque chapitre est écrit en une seule passe, sans relecture, par un sous-agent qui ne voit ni les chapitres voisins ni un échantillon de la voix attendue.

## Critères de réussite

- [ ] `node scripts/story-prose.mjs stories/<id>` mesure longueurs, rythme, dialogue, liste noire, chutes courtes et tournures répétées, par histoire et par chapitre, avec des seuils en avertissements.
- [ ] `writing.md` et `styles.md` portent une section « Prose » (variation, rythme, liste noire, dialogues, scènes) et la bible un gabarit de fiche de voix par personnage et un emplacement pour un diapason écrit par l'auteur.
- [ ] `/new-long-story` fabrique chaque chapitre en trois passes (squelette, prose, relecture) et la passe de prose ne touche qu'aux champs `text`, vérifié par script.
- [ ] `/polish-story stories/<id>` applique les passes de prose et de relecture à une histoire existante, mécanique intacte.
- [ ] L'Exauceur de vœux repasse par `/polish-story` : les mesures avant/après sont dans ISSUES.md et deux chapitres ont été lus à l'aveugle par l'utilisateur avant de généraliser.

## Contraintes

- Le moteur (`src/engine/`) et le format d'un paragraphe ne changent pas.
- Une passe de prose ne modifie que `text` (paragraphes) ; identifiants, choix, cibles, effets, conditions, combats, tests, images restent identiques, et un script le vérifie par comparaison des deux JSON.
- Les règles de `writing.md` « ce que le texte doit dire pour que le moteur le montre » (objets nommés, variations chiffrées avec unité, tests annoncés, résultat en tête des cibles) restent obligatoires : la prose romancée doit toujours porter le surlignage.
- Les sous-agents reçoivent la bible, leur chapitre entier et les derniers paragraphes du chapitre précédent, jamais l'histoire entière.
- Aucune citation de texte sous droits dans les références : le diapason est écrit par l'auteur ou décrit, jamais copié.

## Décisions prises

- Mesurer avant de prescrire : la liste noire et les seuils viennent des chiffres relevés, et le script de mesure sert de porte à la relecture, pas de juge absolu (un avertissement se justifie).
- Trois passes plutôt qu'un prompt plus long : la prose s'écrit mieux quand la mécanique est déjà posée et que le rédacteur a le chapitre entier sous les yeux.
- Le diapason écrit par l'auteur est le levier principal : un rédacteur imite un échantillon mieux qu'il n'applique une règle. Il est optionnel mais recommandé dans la bible.

## Hors périmètre

- Nouvelles mécaniques de jeu ou changement des règles de combat.
- Réécriture du contenu narratif (intrigue, choix, fins) : on réécrit la prose, pas l'histoire.
- Génération ou régénération d'illustrations (les prompts d'image ne bougent pas).
- Les histoires « Défis Fantastiques » (mille-portes, nublar) gardent leur registre apprêté et explicatif : la section « Prose » s'y applique avec ses propres seuils, mais elles ne sont pas dans le pilote.
