# Histoires longues (1000 paragraphes)

**One-liner** : permettre d'écrire, contrôler et jouer des histoires de 1000 paragraphes dans le moteur de livre-jeu, sans changer le moteur.

## Problème

Le skill `/new-story` écrit le JSON en une seule passe et fait valider un squelette d'une ligne par paragraphe. Au-delà de 150 à 200 paragraphes, la passe unique dépasse ce qu'une génération peut produire et le squelette n'est plus relisible. Le moteur, lui, encaisse un JSON de 1 Mo sans problème : le verrou est entièrement du côté de l'outillage d'écriture.

## Critères de réussite

- [ ] Une histoire s'écrit en plusieurs fichiers (`story.json` manifeste + `chapters/*.json`) et `node scripts/story-build.mjs` produit un `story.json` fusionné que le moteur charge tel quel.
- [ ] Le lint contrôle un chapitre seul (cibles externes déclarées tolérées) et l'histoire fusionnée (collisions, contrats objets/drapeaux, atteignabilité).
- [ ] La simulation tient 1000 paragraphes et rapporte le taux de paragraphes jamais visités, globalement et par chapitre.
- [ ] Un skill `/new-long-story <thème>` produit une histoire de 1000 paragraphes en passant par une bible, un macro-squelette validé, puis des sous-agents par chapitre.
- [ ] Une histoire pilote de 1000 paragraphes existe dans `stories/`, passe lint et simulation, et se joue dans le navigateur.

## Contraintes

- Le moteur (`src/engine/`) et le format d'un paragraphe ne changent pas : un `story.json` fusionné reste jouable par la version actuelle.
- Vanilla JS, sans build ni dépendance ; scripts en `.mjs` dans `scripts/`, tests `node:test`.
- Les histoires existantes (demo, la-cendre, mille-portes, nublar) restent en un seul fichier et ne sont pas converties.
- Les sous-agents d'écriture reçoivent la bible et leur contrat, jamais l'histoire entière.

## Décisions prises

- Nouveau skill `new-long-story` plutôt qu'une taille « épique » dans `new-story` : le déroulé est trop différent (macro-squelette, sous-agents) pour partager un seul SKILL.md. Les références (`format.md`, `writing.md`, `styles.md`, `coverage.md`) sont partagées.
- Identifiants préfixés par chapitre à l'écriture (`c03-17`), renumérotés aléatoirement à la fusion ; la correspondance est écrite dans `stories/<id>/build-map.json` pour retrouver un paragraphe.
- Illustrations rationnées : une par chapitre au plus, choisie dans le contrat du chapitre.

## Hors périmètre

- Chargement paresseux des chapitres dans le navigateur (inutile sous 2 Mo).
- Conversion des histoires existantes au format chapitres.
- Modification des règles de jeu, nouvelles mécaniques.
- Illustration d'un paragraphe sur deux ou plus.
