# Roadmap : Histoires longues (1000 paragraphes)

## Vue d'ensemble

On construit d'abord l'outillage qui rend une histoire multi-fichiers possible (format chapitres, fusion), puis les contrôles qui rendent ce découpage sûr (contrats, lint local et global, simulation adaptée). Ensuite viennent les documents partagés par tous les rédacteurs (bible, règles de graphe pour les grands volumes), puis le skill hiérarchique qui orchestre l'écriture par sous-agents. On termine par une histoire pilote de 1000 paragraphes qui valide toute la chaîne.

## Phases

- [x] **Phase 1 : Chapitres et build** - format multi-fichiers et script de fusion vers un `story.json` jouable
- [x] **Phase 2 : Contrats et lint** - contrat de chapitre, lint local et global, simulation à l'échelle
- [x] **Phase 3 : Bible et règles** - bible d'histoire, résumés de chapitre, règles de graphe pour les grands volumes
- [x] **Phase 4 : Skill hiérarchique** - `/new-long-story`, prompt de sous-agent par chapitre, adaptation de `extend-story` et `story-lint`
- [x] **Phase 5 : Histoire pilote** - une histoire de 1000 paragraphes générée, contrôlée, illustrée, jouable

## Détail des phases

### Phase 1 : Chapitres et build
**Objectif** : une histoire peut vivre dans `stories/<id>/source/` (manifeste + `chapters/*.json`) et `story-build.mjs` produit `stories/<id>/story.json` que le moteur charge sans modification.
**Dépend de** : rien
**Plans** : 3

Plans :
- [x] 01-01 : format source (manifeste `story.src.json` + `chapters/<nn>-<nom>.json`), script `story-build.mjs` qui fusionne les paragraphes avec identifiants préfixés `c<nn>-<n>` et refuse les collisions ; tests `node:test`.
- [x] 01-02 : renumérotation aléatoire déterministe (`--seed`) à la fusion, réécriture de toutes les cibles (`to`, `win`, `flee.to`, `success`, `failure`, `start`, `death`, triggers), `build-map.json` ; tests.
- [x] 01-03 : scripts npm (`build:story`), section README « Histoire en chapitres », `.gitignore` ou politique de commit du `story.json` généré (décision : commité, pour rester jouable sans build).

### Phase 2 : Contrats et lint
**Objectif** : un chapitre se contrôle seul et l'ensemble fusionné se contrôle globalement ; la simulation tient 1000 paragraphes et dit ce qui n'est jamais visité.
**Dépend de** : Phase 1
**Plans** : 3

Plans :
- [x] 02-01 : schéma du contrat de chapitre (`entries`, `exits` vers d'autres chapitres, `provides` / `requires` objets et drapeaux, `summary`, `image` optionnelle) ; `story-lint.mjs --chapter <fichier>` qui tolère les cibles externes déclarées dans `exits` et signale celles non déclarées.
- [x] 02-02 : lint global sur la source (avant fusion) : collisions d'identifiants, chaque `exit` pointe vers une `entry` existante, chaque `requires` est fourni par un chapitre atteignable en amont, chapitres inatteignables ; conserve les contrôles actuels sur le fusionné.
- [x] 02-03 : `story-simulate.mjs` : `MAX_STEPS` paramétrable (défaut 2000), taux de paragraphes jamais visités global et par chapitre (lecture de `build-map.json` si présent), temps d'exécution acceptable à 3000 parties sur 1000 paragraphes.

### Phase 3 : Bible et règles
**Objectif** : les documents partagés qui garantissent la cohérence entre rédacteurs et la jouabilité d'un grand graphe.
**Dépend de** : Phase 2 (le contrat de chapitre est connu)
**Plans** : 2

Plans :
- [x] 03-01 : référence `bible.md` (gabarit : lieux, personnages, glossaire, économie des objets et drapeaux, conditions des fins, ton) et gabarit de `summary` de chapitre (ce que le lecteur sait en sortant) ; rangés dans `.claude/skills/new-story/references/` pour partage.
- [x] 03-02 : `coverage.md` : section « grands graphes » (régions reliées par carrefours, points de convergence entre actes, cible de 100 à 150 paragraphes vus par partie, taux maximal de paragraphes jamais visités, un carrefour par chapitre, fins réparties sur plusieurs chapitres).

### Phase 4 : Skill hiérarchique
**Objectif** : `/new-long-story <thème>` écrit une histoire de 1000 paragraphes par sous-agents, et les skills existants savent travailler sur une histoire en chapitres.
**Dépend de** : Phase 3
**Plans** : 3

Plans :
- [x] 04-01 : `.claude/skills/new-long-story/SKILL.md` : phase 1 cadrage + bible (validation), phase 2 macro-squelette de 20 à 40 chapitres avec contrats (validation), phase 4 fusion + lint global + simulation, phase 5 rapport.
- [x] 04-02 : `references/chapter-prompt.md` : le prompt donné à chaque sous-agent (bible, contrat, résumés des chapitres voisins, style, 25 à 50 paragraphes, lint local obligatoire avant de rendre) et la boucle d'orchestration (parallélisme, reprise d'un chapitre refusé par le lint).
- [x] 04-03 : `extend-story` et `story-lint` : détection d'une histoire en chapitres (présence de `source/`), greffe dans un chapitre ou nouveau chapitre, rebuild avant simulation.

### Phase 5 : Histoire pilote
**Objectif** : la chaîne entière prouvée sur une vraie histoire de 1000 paragraphes.
**Dépend de** : Phase 4
**Plans** : 2

Plans :
- [x] 05-01 : générer l'histoire pilote avec `/new-long-story` (thème à choisir au lancement), jusqu'à lint sans erreur et simulation dans les cibles ; noter les frictions du skill dans ISSUES.md.
- [x] 05-02 : corriger les frictions relevées dans les scripts et le skill, illustrer une image par chapitre (`story-illustrate.mjs` lit `image` du contrat ou `--only`), vérifier le chargement et la sauvegarde dans le navigateur.

## Progression

| Phase | Plans terminés | Statut | Terminée le |
|-------|----------------|--------|-------------|
| 1. Chapitres et build | 3/3 | Terminée | 2026-10-19 |
| 2. Contrats et lint | 3/3 | Terminée | 2026-10-19 |
| 3. Bible et règles | 2/2 | Terminée | 2026-10-19 |
| 4. Skill hiérarchique | 3/3 | Terminée | 2026-10-19 |
| 5. Histoire pilote | 2/2 | Terminée (illustrations à générer, voir ISSUES.md) | 2026-10-19 |
