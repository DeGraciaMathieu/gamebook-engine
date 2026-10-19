# Contraintes de graphe et grille de couverture

## Structure obligatoire
- **Carrefours** : au moins 1 par tranche de 25 paragraphes, rejoint par 2 chemins et offrant 2 choix ou plus. C'est là que le marquage des choix déjà pris prend son sens.
- **Fins** : au moins 3 hors mort, dont :
  - une **victoire pleine** qui exige de combiner deux branches (objet d'une branche, information ou drapeau d'une autre),
  - une **victoire au rabais** accessible par la force ou la chance seule,
  - une **survie amère** : le héros s'en sort mais échoue dans sa mission.
- **Mort** : paragraphe `death` dédié. La mort doit pouvoir survenir par un combat et par au moins un piège d'effets.
- **Verrous** : un passage conditionné par un objet, un par un drapeau, un par la ressource, un par une caractéristique.
- **Boucle** : un détour possible qui ramène au carrefour, jamais une boucle obligatoire.
- **Déclencheurs** : toute règle qui doit valoir « partout » (une seconde jauge qui tombe à zéro, un seuil franchi) s'écrit en déclencheur, jamais en verrous répétés à chaque carrefour. Un déclencheur sans aucune façon d'atteindre sa condition est une règle morte.
- **Modificateurs** : au moins un objet qui change les règles (arme ou armure) et un état qui pèse (blessure, faim, peur), de signes opposés. Un modificateur jamais actif en simulation est un objet mal placé.
- **Économie** : le marchand arrive avant une dépense qui compte ; la ressource se gagne à 2 endroits au moins et se dépense à 2 endroits au moins. Vendre un objet doit avoir un prix narratif (il manquera plus loin).
- **Pas d'impasse** : tout paragraphe non terminal a une sortie ; tout paragraphe est atteignable ; aucun objet n'est exigé sans pouvoir être obtenu avant.

## Grille de couverture
Chaque ligne au moins une fois dans l'histoire, vérifiée par `node scripts/story-lint.mjs`.

| Mécanique | Usage typique |
|---|---|
| combat sans fuite | boss, gardien d'une fin |
| combat avec fuite | gardien d'un trésor optionnel |
| combat sur une autre caractéristique | course sur l'Endurance, joute sur la Volonté |
| adversaire à dégâts ou armure | bête qui frappe fort, ennemi cuirassé |
| test de chance | pont, piège, hasard |
| test de caractéristique | forcer, escalader, convaincre |
| condition objet | clef, laissez-passer |
| condition drapeau | « vous avez déjà parlé au prêtre » |
| condition caractéristique | péage, seuil de force |
| condition all / any / not | fin pleine (all), accès alternatif (any), interdit si (not) |
| effet caractéristique | blessure, soin, gain d'or |
| effet objet gain / perte | trouvaille, consommation |
| effet drapeau | mémoire d'une action |
| effet sur un choix | payer, offrir, consommer en choisissant |
| boutique vente / rachat | marchand, receleur |
| modificateur de combat | arme, armure, blessure, compagnon à protéger |
| modificateur de test | gants, fièvre, bénédiction, faim |
| déclencheur | mort d'un compagnon, seuil de faim ou de peur, dette qui déborde |

## Cibles d'équilibrage (simulation)
`node scripts/story-simulate.mjs stories/<id>/story.json --runs 3000` puis `--strategy prudent`.

| Difficulté | Létalité (random) | Létalité (prudent) |
|---|---|---|
| douce | 10 à 25 % | moins de 10 % |
| standard | 25 à 45 % | 10 à 25 % |
| rude | 45 à 65 % | 25 à 40 % |

- Aucune fin ne doit dépasser 70 % des parties, aucune fin hors mort ne doit être sous 3 %.
- Un combat « mortel » au-delà de 50 % des rencontres est un boss : il doit être évitable ou préparable (potion, fuite, chemin alternatif).
- Un paragraphe « rare » (moins de 2 %) est soit un secret assumé, soit un bug de conception.

## Grands graphes (histoires en chapitres, 500 à 1000 paragraphes)

Les règles ci-dessus valent chapitre par chapitre. À cette échelle s'ajoutent des règles de structure, contrôlées par `node scripts/story-lint.mjs stories/<id>` (contrats) et par le tableau par chapitre de `node scripts/story-simulate.mjs`.

- **Actes et régions** : 3 à 5 actes, chacun fait de 4 à 10 chapitres qui sont des régions (un quartier, une forêt, un étage). Un chapitre fait 25 à 50 paragraphes, a 1 à 3 entrées et 1 à 4 sorties vers d'autres chapitres.
- **Un carrefour par chapitre** : chaque chapitre a son carrefour (rejoint par 2 chemins, 2 choix ou plus) et une boucle optionnelle qui y ramène. Les carrefours d'une même région sont reliés entre eux : le joueur circule dans la région avant d'en sortir.
- **Points de convergence** : entre deux actes, tous les chemins passent par 1 à 3 chapitres de convergence. C'est là que l'histoire vérifie ce que le héros a rapporté de l'acte (objet, drapeau, seuil) et que les rédacteurs de l'acte suivant peuvent compter sur un état connu, décrit dans la bible.
- **Dépendances en amont seulement** : un chapitre ne requiert que ce que fournissent les chapitres en amont (ou le héros au départ), jamais un chapitre parallèle du même acte. Deux branches parallèles d'un acte fournissent des moyens différents d'atteindre la même convergence (`any`).
- **Ce qu'une partie voit** : 100 à 150 paragraphes par partie sur 1000, soit une longueur moyenne de 80 à 150 actions. En dessous, les actes sont trop courts ; au-dessus, les boucles tournent à vide.
- **Jamais visités** : sur 3000 parties, au plus 10 % des paragraphes jamais visités en tout, et au plus 25 % dans un chapitre. Un chapitre traversé par moins de 3 % des parties est un secret assumé ou un bug de conception ; un chapitre traversé par toutes les parties est une convergence et doit être écrit comme telle.
- **Fins réparties** : au moins 5 fins hors mort, portées par 3 chapitres au moins et pas toutes dans le dernier acte (une sortie précoce, amère ou au rabais, dans l'acte 2 ou 3). La mort par combat et par piège doit être possible dans chaque acte.
- **Économie par acte** : la ressource se gagne et se dépense dans chaque acte ; un marchand par acte au moins, avant la dépense qui compte.
- **Attrition** : sur 150 actions, les dégâts s'additionnent et les consommables sont uniques. Adversaires courants 6 à 8 d'habileté, dégâts 2 ; pièges 2 à 3 points d'Endurance ; un lieu de repos par hub (une fois par visite, ou payant) ; Endurance de départ 18 à 20. Une jauge qui monte à chaque passage (radiation, faim) se dimensionne sur 100 à 150 passages, pas sur un chapitre.
- **Consommables** : listés dans `requires` de chaque chapitre où l'on peut souffler, sinon le rédacteur n'en propose aucun.
- **Illustrations** : une à trois par chapitre, désignées par le contrat (`images`) : le carrefour, un lieu marquant, un moment fort. Le lieu plutôt que l'issue, jamais le héros de face.
- **Identifiants** : `c<nn>-<n>` à l'écriture, renumérotés à la fusion par `story-build.mjs` ; `build-map.json` fait la correspondance dans les deux sens.
