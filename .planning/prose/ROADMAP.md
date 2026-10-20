# Roadmap : Prose romancée (moins de marqueurs IA)

## Vue d'ensemble

On commence par l'instrument de mesure, parce que tout le reste s'y réfère : les consignes citent ses seuils, la relecture s'en sert comme porte, le pilote s'évalue avec. Viennent ensuite les consignes d'écriture et la bible (fiches de voix, diapason), puis la chaîne de fabrication en trois passes dans `/new-long-story` et sa déclinaison `/polish-story` pour l'existant. On termine par un pilote sur L'Exauceur de vœux, mesuré avant et après et relu à l'aveugle.

## Phases

- [x] **Phase 1 : Mesurer la prose** - `story-prose.mjs`, rapport par histoire et par chapitre, seuils
- [x] **Phase 2 : Consignes et bible** - section « Prose », liste noire, fiches de voix, diapason
- [x] **Phase 3 : Trois passes par chapitre** - squelette, prose, relecture dans `/new-long-story`, contrôle « seul `text` change »
- [x] **Phase 4 : `/polish-story`** - réécriture de la prose d'une histoire existante, chapitre par chapitre
- [ ] **Phase 5 : Pilote sur l'Exauceur** - mesures avant/après, lecture à l'aveugle, généralisation

## Détail des phases

### Phase 1 : Mesurer la prose
**Objectif** : un script donne des chiffres objectifs sur la prose d'une histoire et signale ce qui dépasse des seuils.
**Dépend de** : rien
**Plans** : 2

Plans :
- [x] 01-01 : `scripts/lib/story-prose.mjs` + `scripts/story-prose.mjs stories/<id>` (histoire en chapitres via `build-map.json`, ou `story.json` seul) : par chapitre et au total, distribution des longueurs (min, médiane, max, écart), longueur des phrases (médiane, p10, p90), part de paragraphes avec discours direct, part de chutes de 4 mots au plus, phrases nominales, expressions d'une liste noire (fichier `references/prose-blacklist.txt`, comptées par paragraphe), n-grammes de 3 à 5 mots présents dans 5 paragraphes ou plus. Tests `node:test` sur une fixture.
- [x] 01-02 : seuils en avertissements (par chapitre : écart de longueurs trop faible, chutes courtes au-delà de 20 %, dialogue sous 15 % hors chapitres sans personnage, toute expression de la liste noire au-delà de 1 pour 50 paragraphes, tout n-gramme répété), option `--chapter <fichier>` pour la passe de relecture, option `--diff avant.json après.json` qui échoue si autre chose que `text` a changé. README : section « Mesurer la prose ».

### Phase 2 : Consignes et bible
**Objectif** : les rédacteurs reçoivent des consignes qui produisent de la variété, de la parole et des scènes, au lieu de vignettes au rythme uniforme.
**Dépend de** : Phase 1 (les seuils sont cités)
**Plans** : 2

Plans :
- [x] 02-01 : `writing.md`, section « Prose » : longueurs variées dans un chapitre (30 à 160 mots, au moins une scène longue et une transition courte), rythme alterné (une phrase longue à subordonnées par paragraphe au moins), la chute courte limitée à un paragraphe sur cinq, pas de phrase nominale en clôture, discours direct avec guillemets quand un personnage est présent, le concret nommé (marque, modèle, matière, nombre) plutôt que l'atmosphère (« quelque chose », « quelque part »), la liste noire. `styles.md` : le style sobre est réécrit (« phrases courtes » devient « phrases de longueur variée, ellipses rares et motivées »), et chaque style reçoit trois phrases d'exemple de plus montrant une scène dialoguée.
- [x] 02-02 : `bible.md` : gabarit de fiche de voix par personnage récurrent (registre, trois répliques types, un tic verbal, ce qu'il ne dit jamais, ce qu'il sait et tait) et emplacement « Diapason » : deux ou trois paragraphes écrits par l'auteur, donnés tels quels aux rédacteurs. `new-story` et `new-long-story` demandent le diapason en phase 1 (optionnel, recommandé). Fiches de voix écrites pour les personnages de l'Exauceur.

### Phase 3 : Trois passes par chapitre
**Objectif** : `/new-long-story` sépare la mécanique de la prose et ajoute une relecture, sans allonger le prompt d'un seul sous-agent.
**Dépend de** : Phase 2
**Plans** : 2

Plans :
- [x] 03-01 : `references/chapter-prompt.md` découpé en trois prompts : squelette (contrat, mécanique, `text` réduit à une didascalie d'une ligne par paragraphe, lint de chapitre), prose (chapitre entier en main, fiches de voix, diapason, derniers paragraphes du chapitre précédent, réécrit uniquement `text`, obligations de `writing.md` « ce que le texte doit dire »), relecture (lit dans l'ordre d'un parcours, rend la liste des tics et répétitions, corrige, relance `story-prose.mjs --chapter`). Boucle d'orchestration : la passe de prose est contrôlée par `--diff`, la relecture par les seuils ; une reprise au plus par passe.
- [x] 03-02 : `SKILL.md` de `new-long-story` : phase 3 en trois vagues de passes, rapport final avec les chiffres de `story-prose.mjs` ; `new-story` reçoit la passe de relecture (une histoire courte s'écrit en une passe, mais se relit).

### Phase 4 : `/polish-story`
**Objectif** : une histoire déjà écrite peut repasser par les passes de prose et de relecture sans toucher à sa mécanique.
**Dépend de** : Phase 3
**Plans** : 1

Plans :
- [x] 04-01 : `.claude/skills/polish-story/SKILL.md` : `/polish-story stories/<id> [--chapters 05,06]`. Pour une histoire en chapitres, passes de prose et de relecture par sous-agents sur chaque chapitre, vérification `--diff`, rebuild, lint, `story-prose.mjs` avant/après. Pour une histoire en un fichier, découpage par lots de 30 à 40 paragraphes à partir du graphe (`story-checks.mjs`), même passes. Ne commite pas.

### Phase 5 : Pilote sur l'Exauceur
**Objectif** : la chaîne prouvée sur l'histoire la plus longue, avec un jugement humain avant de généraliser.
**Dépend de** : Phase 4
**Plans** : 2

Plans :
- [ ] 05-01 : deux chapitres (le Bar, un chapitre d'action) passés par `/polish-story`, ancienne et nouvelle version présentées à l'aveugle à l'utilisateur, ajustement des consignes selon son verdict. Mesures avant/après dans ISSUES.md.
- [ ] 05-02 : les 28 autres chapitres, rebuild, lint, simulation (la létalité ne doit pas bouger : la mécanique est intacte), vérification dans le navigateur, puis La Cendre. Frictions dans ISSUES.md.

## Progression

| Phase | Plans terminés | Statut | Terminée le |
|-------|----------------|--------|-------------|
| 1. Mesurer la prose | 2/2 | Terminée | 2026-10-20 |
| 2. Consignes et bible | 2/2 | Terminée | 2026-10-20 |
| 3. Trois passes par chapitre | 2/2 | Terminée | 2026-10-20 |
| 4. `/polish-story` | 1/1 | Terminée | 2026-10-20 |
| 5. Pilote sur l'Exauceur | 0/2 | 05-01 réécrit et relu, en attente du verdict de lecture à l'aveugle | |
