# Frictions relevées sur l'histoire pilote (exauceur, 30 chapitres, 1016 paragraphes)

Relevé pendant 05-01, corrigé dans 05-02 sauf mention contraire.

## Scripts

- **Simulation non déterministe** : `fightRound` était appelé sans le `rng` injecté. Corrigé (la graine fait foi).
- **Le joueur simulé tournait en boucle dans les carrefours** et mourait par pièges répétés (le Bar à lui seul causait 10 % des morts). Corrigé : il préfère une page jamais lue, puis un choix jamais pris, comme un lecteur devant des choix marqués. Les chiffres des histoires existantes bougent de quelques points.
- **Pas de diagnostic par chapitre des morts** : impossible de savoir où une histoire longue tue. Ajouté : tableau « Morts par chapitre » (combat / piège).
- **La liste des paragraphes rares** devenait illisible à 1000 paragraphes. Plafonnée à 25 entrées.

## Skill et prompt de chapitre

- **Brief d'équilibrage trop dur** : « adversaires 8 à 10 d'habileté, pièges 3 à 6 points » appliqué par 30 rédacteurs donne une attrition que rien ne compense sur 150 actions (létalité 90 % en random). Corrigé par un passage global sur la source (habileté −2, dégâts −2, pièges plafonnés à −3, prose réécrite), puis dans `chapter-prompt.md` et `coverage.md` (repères pour les grands graphes).
- **Aucun lieu de repos** : les consommables sont uniques, donc la seule guérison répétable est le marchand. Ajouté un repos par hub (Bar payant, bunker, appartement, abri). Règle ajoutée à `coverage.md`.
- **Seuil de la seconde jauge** : 10 rads pour 2 à 4 rads par passage menait 70 % des parties au déclencheur. Passé à 30 (Irradié à 18). Règle : une jauge qui monte à chaque passage se dimensionne sur le nombre de passages d'une partie (100 à 150), pas sur un chapitre.
- **Les consommables n'étaient pas listés dans `requires`** de certains chapitres (sortie, Exauceur, C-Conscience) : les rédacteurs n'ont donc proposé aucune consommation, à juste titre. À lister systématiquement dans le macro-squelette.
- **Un rédacteur a laissé un objet requis inutile** (Décodeur au chapitre 29, servi au 27) : le lint le signale, le contrat a été corrigé. Les `requires` doivent être ce que le chapitre teste, pas ce que le joueur porte.
- **Limite de session** : trois sous-agents ont été coupés par la limite d'usage ; leurs fichiers étaient complets et lintés, aucune reprise nécessaire, mais l'orchestrateur doit relancer le lint lui-même plutôt que compter sur le rapport.

## Restes

- **Mode prudent à 46 %** de létalité contre 25 à 40 visés : compromis assumé après trois itérations (random 54 %, dans la cible). Le prochain levier est la Chance de départ ou une Trousse supplémentaire par acte.
- **La fin « Le Monolithe vous prend » (Radar sans Casque psi)** absorbe 28 à 36 % des parties simulées : le joueur simulé n'accomplit pas la chaîne Yantar → X-16 → Casque. Un lecteur averti y échappe ; un second test de Chance a été ajouté avant la fin.
- **Les chapitres 29 et 30** (porte secrète, C-Conscience) sont traversés par moins de 1 % des parties : la chaîne Clé USB → X-16 → PDA → Décodeur → palais est un secret assumé, vérifié par le lint d'atteignabilité, pas par la simulation.
- **Illustrations non générées** (30 prompts prêts, `story-illustrate.mjs` avec `OPENAI_API_KEY`).
