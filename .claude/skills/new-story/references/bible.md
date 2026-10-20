# Bible d'une histoire longue

La bible est le document que tous les rédacteurs d'une histoire en chapitres reçoivent, à la place de l'histoire entière. Elle tient en 150 à 300 lignes dans `stories/<id>/source/bible.md`. Tout ce qu'un chapitre doit savoir du monde, des personnages, des objets et des fins s'y trouve ; ce qui n'y est pas n'existe pas pour un rédacteur, qui ne doit rien inventer de structurant (pas de nouvel objet, de nouveau drapeau, de nouvelle fin).

## Gabarit

```markdown
# <Titre>

## Pitch
Cinq lignes : lieu, objectif du héros, antagoniste, enjeu en cas d'échec, twist.

## Style et ton
Le style retenu (`styles.md`) et le ton, en trois lignes, avec deux phrases d'exemple écrites dans cette voix.
Les mots interdits ou obligatoires s'il y en a (vouvoiement, capitales des règles, unités).
Les refrains voulus : les tournures qui ont le droit de revenir d'un chapitre à l'autre (une formule rituelle, un bruit signature), pour que `story-prose.mjs` ne les compte pas comme des tics sans qu'on le sache.

## Diapason
Deux ou trois paragraphes écrits par l'auteur dans la voix exacte de l'histoire, de longueurs différentes (une scène dialoguée, une transition, une action). Les rédacteurs les reçoivent tels quels et les imitent avant d'appliquer toute règle. Si l'auteur n'en écrit pas, l'orchestrateur en propose un et le marque « provisoire ».

## Héros
Les caractéristiques avec leur `description`, la réserve de points, l'inventaire initial et pourquoi chaque objet initial servira.
Les ressources (or, vivres, souffle…) et les horloges (`tick`) avec ce qui les fait monter et descendre.

## Lieux
Une entrée par région (un acte en compte 3 à 8), chacune en cinq lignes : nom, aspect, ce qu'on y trouve, qui y vit, ce qui y menace.
Les chapitres se rattachent à une région ; deux chapitres d'une même région partagent ces lignes mot pour mot.

## Personnages
Une fiche de voix par personnage récurrent : nom, rôle, apparence en une phrase, ce qu'il veut, ce qu'il sait et tait. Puis sa voix : registre (tutoie ou vouvoie, phrases longues ou courtes, vocabulaire), trois répliques types, un tic verbal, ce qu'il ne dit jamais. Un rédacteur fait parler le personnage avec ces répliques comme modèle, jamais en les recopiant.
Un personnage qui n'apparaît que dans un chapitre n'est pas ici : le rédacteur du chapitre l'invente, avec une voix.

## Glossaire
Les noms propres et les termes du monde avec leur graphie exacte (majuscules, accents, article). Le rédacteur copie, il ne reformule pas.

## Économie des objets
Le catalogue complet (`items` du manifeste), une ligne par objet : identifiant, nom affiché, chapitre où on l'obtient, chapitre(s) où il sert, s'il se consomme.
Un objet s'obtient dans un chapitre et sert dans un autre, jamais l'inverse en amont.

## Drapeaux
Une ligne par drapeau : identifiant, ce qu'il mémorise, chapitre qui le pose, chapitre(s) qui le testent.

## Modificateurs et déclencheurs
Recopiés du manifeste avec, pour chacun, la façon dont un rédacteur doit l'écrire dans la prose (« avec ça, on se bat mieux », « le petit ne se réveille pas »).

## Actes et convergences
La liste des actes, et pour chaque passage d'un acte au suivant, le ou les chapitres de convergence par lesquels tout le monde passe, avec l'état garanti du héros à ce point (ce qu'il a forcément, ce qu'il peut avoir).

## Fins
Chaque fin hors mort : son nom, le chapitre qui la porte, ce qu'elle exige (objets, drapeaux, seuil), ce qu'elle raconte en deux lignes.
La mort : le texte du paragraphe `death`, et dans quels actes elle peut survenir par combat et par piège.
```

## Résumé de chapitre (`summary` du contrat)

Le `summary` d'un chapitre est **ce que le lecteur sait et possède en sortant**, pas le résumé de l'intrigue. Deux à quatre phrases, au passé composé, qui permettent au rédacteur du chapitre suivant d'enchaîner sans lire le chapitre :

> Le héros a traversé le marché de nuit et sait que le Prévôt achète les enfants des tanneurs. Il a pu obtenir la clef rouillée (chez l'apothicaire) et poser `pretre_vu` s'il est passé par la chapelle. Il sort vers le port (c05) blessé ou vers les tanneries (c07) avec le molosse à ses trousses.

Chaque sortie du chapitre apparaît dans le résumé avec l'état dans lequel on la franchit. Les entrées du chapitre suivant reprennent ces mots dans leur description.
