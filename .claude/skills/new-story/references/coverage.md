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
