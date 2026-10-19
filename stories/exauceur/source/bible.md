# L'Exauceur de vœux

## Pitch

La Zone d'exclusion de Tchernobyl a changé en 2006 : anomalies, mutants, artefacts, et au centre, derrière le Brûleur de cerveaux et la Centrale, une pierre dont tout le monde parle et dont personne n'est revenu : l'Exauceur de vœux. Vous êtes un stalker sans nom, sans souvenir d'avant la Zone, avec un détecteur et un pistolet. Vous allez au centre. L'antagoniste n'est pas un homme : c'est le Monolithe, la secte qui garde la Centrale, et derrière elle ce qui parle dans les têtes. Si vous échouez, la Zone vous garde, comme elle a gardé les autres. Twist : l'Exauceur est un leurre. Ce qui exauce, c'est un groupe de cerveaux dans une cuve sous le Sarcophage, la C-Conscience, qui fabrique la Zone et recrute ceux qui arrivent jusqu'à elle.

## Style et ton

Style « sobre » (`styles.md`). Deuxième personne, présent, phrases courtes, ellipses, une image concrète par paragraphe, 40 à 90 mots. Ton sombre et étrange : la Zone est silencieuse, les gens parlent peu et mentent un peu, les morts restent où ils tombent. Pas d'humour hormis celui, sec, des stalkers au feu. Jamais d'explication de ce que le joueur peut déduire.

Exemples de la voix :

> Le détecteur crépite une fois, puis se tait. Devant vous, l'air tremble au-dessus de la route comme au-dessus d'un capot chaud. Vous lancez un boulon. Il ne retombe pas.

> Sidorovitch ne lève pas les yeux de son carnet. Deux cents pour la veste. Vous n'avez pas deux cents. Il le sait.

Règles dans le texte : en toutes lettres, sans capitales ni injonction. « Vous perdez 2 points d'Endurance. » « Vous prenez 3 rads. » « Il vous reste 150 roubles. » Un objet est montré, jamais expliqué : « avec ça, les balles font moins mal » suffit.

Interdits : « rendez-vous au », conditionnelles annonçant les choix, « Testez votre » (dire : « Tentez votre Chance. » ou « Testez votre Habileté. » seulement, une fois, en fin de paragraphe de test), noms de marques modernes, références aux jeux vidéo. Vouvoiement du lecteur. Les personnages se tutoient entre eux.

## Héros

| Caractéristique | Départ | Rôle |
|---|---|---|
| Habileté | base 7, max 12 | combats, tests pour forcer, viser, lancer un boulon |
| Endurance | base 20, max 32 | vie ; à 0, mort (`c01-mort`) |
| Chance | base 7, max 11 | anomalies, hasards ; s'use à chaque test |
| Radiation | 0, sans plafond, unité « rad » | monte dans les zones irradiées (2 à 4 rads par passage), descend avec Anti-rad (−5) ou Vodka (−2). À 18 : « Irradié ». À 30 : déclencheur « Le corps cède » (`c01-rads`), fin |
| Roubles | 200, sans plafond, unité « rouble » | marchands, péages, paris de l'Arène |
| Batterie | 60, horloge −1 par décision | la pile du Détecteur Ours ; à 0 « Détecteur muet » ; des Piles la remettent à 60 (effet `setStat`) |

Réserve de 8 points à répartir. Inventaire initial : Couteau (trancher, menacer, revendre), Pistolet Makarov (abattre un chien, tirer dans une serrure, revendre), Détecteur Ours (trouver les artefacts ; bonus de Chance tant que la batterie tient).

Comment écrire la radiation : « Le compteur grimpe. Vous prenez 3 rads. » Comment écrire les soins : « Vous videz la trousse. Vous regagnez 6 points d'Endurance. » Un consommable est retiré par un effet `remove` dans le choix qui le consomme, et le texte du paragraphe d'arrivée le dit.

## Lieux

### Acte 1 : le Sud

**Le Cordon** (c01). Un village de débutants dans des maisons de bois, un feu permanent, le bunker de Sidorovitch creusé sous une colline. Au nord, le pont de chemin de fer tenu par les militaires, le tunnel du remblai à l'ouest. Champs d'orties, pylônes, un bus rouillé. Chiens aveugles. Des types de vingt ans qui jouent de la guitare et mourront dans un mois.

**Le Dépotoir** (c02). Des collines de ferraille irradiée, des camions empilés, un hangar de béton où les bandits attendent le passage. Des grappes de « Méduses » dans les anomalies électriques. L'air sent le fer chaud. On y traverse en courant d'un abri à l'autre.

**Agroprom** (c03). Une usine agricole en ruine, silos, une cour tenue par le Devoir, des militaires qui ratissent depuis la route. Sous l'usine, des galeries. Les herbes sont hautes, les tanks d'eau fuient, les pseudo-chiens hurlent la nuit.

**Les souterrains d'Agroprom** (c04). Galeries d'égout, eau jusqu'aux genoux, une salle de pompes, la cache de Strelok derrière une grille. Un Contrôleur vit là : quand il regarde, on voit double et on se tire dessus. Noir total sans lampe.

**La Vallée sombre** (c05). Une vallée de brume, la base de la Liberté dans une ancienne ferme (drapeaux verts, musique, fumée d'herbe), au fond une usine où les bandits de Borov font régner leur loi. Un pont effondré, des chiens, un pseudo-géant qu'on entend sans le voir.

**Le laboratoire X-18** (c06). Sous l'usine de la Vallée sombre, trois étages de béton, portes de fer, archives inondées, un gaz vert au niveau le plus bas. Des poltergeists jettent les objets. Un Pseudo-géant garde les documents. On n'y respire pas sans masque.

**Le poste du Devoir** (c07). Une barricade de wagons sur la route de Rostok, des hommes en gris-rouge qui vérifient les papiers et les sacs. Un canon antiaérien braqué sur le nord. Le sergent-chef Kouznetsov.

### Acte 2 : Rostok et les terres du milieu

**Le Bar « 100 Rads »** (c08). Dans l'usine de Rostok, une cave, le comptoir du Barman, l'odeur de saucisse et de chlore. Tout le monde passe par là : marchands, le Guide dans son coin, les combattants de l'Arène, les scientifiques en transit. Les nouvelles s'y échangent contre à boire.

**L'Arène** (c09). Une fosse sous le Bar, des grilles, des parieurs. On y combat des hommes puis des bêtes pour des roubles. Le gérant s'appelle Arnie.

**Les Terres sauvages** (c10). Entre Rostok et Yantar, des entrepôts, des ponts de fer, des snipers mercenaires sur les toits, et un camion renversé de scientifiques qu'il faut sortir de là. Une Boule de feu brûle quelque part dans un fossé.

**Yantar** (c11). Un lac mort, une usine chimique, le bunker des scientifiques (le professeur Sakharov) sous une bâche de plomb. Dehors, les zombies : des stalkers que le psi a vidés, qui marchent et marmonnent. Au bord du lac, l'entrée du X-16.

**Le laboratoire X-16** (c12). Sous Yantar, des cuves, un émetteur psi qui fait saigner le nez, des couloirs où les morts parlent. Au centre, l'installation qu'il faut éteindre et les Documents du X-16. Lumières rouges, ventilateurs qui tournent encore.

**Les Entrepôts militaires** (c13). Un village de datchas, des hangars, la base de la Liberté assiégée par le Monolithe venu du nord. Un sniper monolithien sur le château d'eau. Dans une datcha, le corps de Fantôme et son PDA. Un champ de mines sur la route de l'est.

**La Forêt rouge** (c14). Des pins rougis par la radiation, une route coupée, le refuge du Forestier. Au cœur, l'Oasis : une cave d'où monte une lumière, le Cœur de l'Oasis sur une pierre. Un pseudo-géant garde le pont. Les chiens y sont nombreux.

**La sortie** (c15). Le chemin du retour vers le sud, le poste militaire, les barbelés, le monde d'avant derrière. On y va avec assez de roubles ; on y va surtout pour ne pas aller plus loin.

**Le Radar** (c16). Une antenne de 150 mètres couchée en travers du ciel, l'installation Duga. Le Brûleur de cerveaux : passé la crête, les pensées viennent de l'extérieur. Un bunker, des escaliers, une salle de contrôle, le bouton. Des soldats du Monolithe aux yeux blancs. Sans Casque psi, on ne redescend pas.

**Le chemin du Guide** (c17). Un tunnel de service sous la crête, à l'ouest de l'antenne, connu du Guide et de personne. Eau, rats, une anomalie de gravité tous les cinquante mètres. Il débouche dans une cave de Pripyat.

### Acte 3 : le Nord

**Les faubourgs de Pripyat** (c18). La ville morte : la grande roue, les immeubles aux fenêtres sans vitres, la place. Le Monolithe tient les toits et la ville. On avance de porche en porche. Le carrefour de l'acte : de là, on part vers l'hôtel, le palais, l'hôpital, la piscine, et le pont de la Centrale.

**L'hôtel Polissya** (c19). Huit étages, l'escalier éventré, la chambre 26 où Fantôme a laissé le Décodeur, comme le dit son PDA. Des Sangsues dans les couloirs. Une Trousse de soins dans la salle de bain.

**Le palais de la Culture « Energetik »** (c20). Le Monolithe y tient ses rituels devant un bloc de pierre peint. On y voit ce qu'ils voient. On en ressort avec ce qu'il faut savoir du Monolithe, ou pas.

**L'hôpital** (c21). Sous-sols de carrelage, morgue, un laboratoire militaire abandonné, des Sangsues et le noir. Des Grenades F1 dans une armoire, une Trousse de soins.

**La piscine et le poste de police** (c22). Le bassin vide, le plongeoir, et à côté le poste de police où les monolithiens entreposent leurs morts. Une Tenue du Monolithe s'y prend sur un corps.

**Le pont de la Centrale** (c23). Le viaduc vers la Centrale, le poste de garde monolithien, les barrières. En tenue, on passe sans un mot. Sans, on force ou on contourne par le dessous.

### Acte 4 : la Centrale

**Le parvis de la Centrale** (c24). Le bâtiment immense, la cheminée, le Sarcophage de béton. Une Émission se lève pendant qu'on est là : le ciel rougit, le sol bourdonne, il faut un abri. Deux chemins : la salle des machines en bas, les toits en haut.

**La salle des machines** (c25). Turbines mortes, passerelles, 40 rads par mètre sans SEVA, une salle de contrôle du réacteur 4 avec ses cadrans à zéro.

**Les toits** (c26). Échelles, cheminée, vent, snipers du Monolithe, une passerelle qui pend au-dessus du vide.

**Le Sarcophage** (c27). L'intérieur du béton coulé : couloirs oranges, flaques de corium, un puits. Au bout, une salle avec une pierre qui brille : l'Exauceur. Sur le côté, une porte avec un clavier : le Décodeur l'ouvre.

**L'Exauceur de vœux** (c28). Une pierre grande comme une voiture, qui luit, qui bourdonne, qui écoute. Ce qu'on souhaite, on l'obtient à la lettre.

**La porte secrète** (c29). Derrière le clavier, des couloirs propres, des néons, une odeur de formol. Des gardes en tenue de laboratoire, des caméras.

**La C-Conscience** (c30). Une salle de cuves où flottent des corps branchés. Ils parlent dans votre tête, à plusieurs voix. Ils proposent. Ils ont déjà fait ça.

## Personnages

**Sidorovitch** (c01). Marchand du Cordon, gros, chemise tachée, carnet. Ne lève pas les yeux. Parle en chiffres. « Deux cents la veste. Cent cinquante l'anti-rad. Et tu me dois encore le dernier. » Veut des artefacts, achète tout, ne fait pas de cadeaux.

**Le Loup** (c01). Chef du village des débutants, veste kaki, calme. Explique une fois, pas deux. « Un boulon avant chaque pas. Le détecteur avant chaque boulon. » Sait où est le tunnel du remblai.

**Sergent-chef Kouznetsov** (c07). Devoir. Grand, gris, lunettes de visée relevées. « Papiers. Sac. Le nord n'est pas pour vous. » Laisse passer avec un laissez-passer, contre 500 roubles, ou pas du tout.

**Borov** (c05). Chef des bandits de la Vallée sombre, crâne rasé, gilet d'or sur un blouson de cuir. Parle à la troisième personne de lui-même. Garde la Clef du X-18 autour du cou.

**Le Barman** (c08). Tablier, bras épais, mémoire infinie. « Qu'est-ce que tu as, qu'est-ce que tu veux. » Achète les documents, vend tout ce qui se boit, dit où est le Guide quand on l'a mérité.

**Le Guide** (c08, c17). Un vieux stalker qui ne boit pas, veste grise, assis dos au mur. Le seul qui soit allé au nord et revenu. Parle par phrases de cinq mots. Donne sa carte à qui lui prouve qu'il sait pour Strelok.

**Arnie** (c09). Gérant de l'Arène, costume trop petit, cigare. « Trois rounds. Tu vis, tu touches. »

**Professeur Sakharov** (c11). Vieux, lunettes épaisses, blouse sous la combinaison. Parle vite, pose des questions sans attendre la réponse. Échange la Combinaison SEVA contre un artefact « Âme » ou 2 000 roubles, donne le Casque psi à qui éteint le X-16.

**Le Forestier** (c14). Un homme sans âge dans une cabane de la Forêt rouge, fusil sur les genoux. Sait tout de la forêt et rien d'ailleurs. Indique l'Oasis et le chemin du Radar.

**Fantôme** (mort, c13, c19). Compagnon de Strelok. Son corps est aux Entrepôts, son PDA dit où il a caché le Décodeur : hôtel Polissya, chambre 26.

**Strelok** (absent). Le stalker qui est allé au centre trois fois. Sa cache est sous Agroprom. Sa Clé USB contient ce qu'il a compris de la C-Conscience. Personne ne sait où il est. Vous ne savez pas qui vous êtes.

**Le Monolithe** (c13 à c30). Des hommes en combinaisons grises et masques, yeux blancs, qui parlent du Monolithe comme d'une personne. Ils ne négocient pas. Ils prient avant de tirer.

**La C-Conscience** (c30). Sept voix qui parlent ensemble dans la tête. Calmes, raisonnables. « Nous avons essayé de réparer. Nous avons besoin de bras. »

## Glossaire

Graphie exacte à recopier : la Zone ; le Cordon ; le Dépotoir ; Agroprom ; la Vallée sombre ; le X-18, le X-16 (« le laboratoire X-18 ») ; Rostok ; le Bar « 100 Rads » ; l'Arène ; les Terres sauvages ; Yantar ; les Entrepôts militaires ; la Forêt rouge ; l'Oasis ; le Radar ; le Brûleur de cerveaux ; Pripyat ; l'hôtel Polissya ; le palais de la Culture ; la Centrale ; le Sarcophage ; l'Exauceur de vœux (ou « l'Exauceur ») ; la C-Conscience ; le Monolithe (la secte et la pierre qu'elle prie) ; une Émission (majuscule) ; le Devoir, la Liberté (factions) ; les bandits ; les militaires ; les mercenaires.

Créatures : chien aveugle, pseudo-chien, Sangsue, Contrôleur, Poltergeist, Pseudo-géant, Chimère, Snork, zombie (minuscule), Brouilleur (jamais : on dit Brûleur de cerveaux).

Objets du monde : anomalie (« Trampoline », « Brûleur », « Carrousel », « Électro » : noms en majuscule entre guillemets à la première mention d'un chapitre, puis sans), artefact, boulon (toujours au singulier dans « lancer un boulon »), PDA, détecteur.

## Économie des objets

Un objet s'obtient dans un chapitre et sert ailleurs. Un rédacteur ne crée aucun objet ; il place ceux de sa colonne « obtenu » et teste ceux de sa colonne « sert ».

| id | nom | obtenu | sert |
|---|---|---|---|
| couteau | Couteau | départ | c14 trancher les lianes de l'Oasis, c22 tuer sans bruit, revente c01 |
| makarov | Pistolet Makarov | départ | c02 abattre un chien, c03 tirer dans une serrure, c05, c22 ; revente c01 |
| detecteur_ours | Détecteur Ours | départ | trouver un artefact c02, c14 ; modificateur de Chance tant que Batterie > 0 |
| ak74 | AK-74 | c02 (bandit tué ou hangar) | modificateur +1 ; conditions c05, c07, c10, c13 |
| vintorez | Vintorez | c13 (sniper monolithien) | modificateur +2 ; conditions c16, c18, c20, c23, c26 |
| gilet_cuir | Veste de cuir | c01 (Sidorovitch, 300) | modificateur dégâts −1 |
| seva | Combinaison SEVA | c11 (Sakharov : Âme ou 2 000 roubles) | passages irradiés sans rads : c14, c18, c24, c25 |
| casque_psi | Casque psi | c11 (après X-16 éteint) | c16 survivre au Brûleur |
| antirad | Anti-rad | c01, c08 (boutiques), c04, c10, c14, c20, c24 (trouvé) | consommer : −5 rads, dans tout chapitre irradié |
| vodka | Vodka | c01, c08 (boutiques), c05, c22 | consommer : −2 rads, −1 Chance ; offrir c05 (Liberté) |
| bandage | Bandage | c01, c08, c18 | consommer : +3 Endurance |
| trousse | Trousse de soins | c03, c06, c08, c19, c21 | consommer : +6 Endurance |
| conserve | Conserve | c01, c05, c08, c10, c18 | consommer : +2 Endurance |
| piles | Piles | c01, c08 (boutiques) | consommer : Batterie remise à 60 |
| lampe | Lampe torche | c01 (Sidorovitch, 100) | c04, c06, c12, c17, c19, c21, c25, c29 (sinon test ou rads) |
| masque_gaz | Masque à gaz | c02 (camion) | c06, c12, c21, c25 (gaz) |
| corde | Corde | c02 (hangar) | c04 descendre, c17, c19 escalier éventré, c26 passerelle |
| grenade | Grenade F1 | c02, c10, c13, c21, c26 | lancer : évite un combat (effet `remove` sur le choix) c04, c06, c10, c12, c16, c20, c23 |
| cle_x18 | Clef du X-18 | c05 (Borov) | c06 entrer |
| documents_x18 | Documents du X-18 | c06 | c08 vendre au Barman (1 000 roubles, `barman_confiance`) |
| documents_x16 | Documents du X-16 | c12 | c11 lire avec Sakharov |
| flash_strelok | Clé USB de Strelok | c04 (cache) | c08 convaincre le Guide, c12 comprendre les documents (`verite_connue`) |
| pda_fantome | PDA de Fantôme | c13 (datcha) | c19 trouver la chambre 26 |
| decodeur | Décodeur | c19 | c27, c29 ouvrir la porte secrète |
| carte_guide | Carte du Guide | c08 (Guide) | c14 prendre le chemin, c17 |
| carte_militaire | Carte des champs de mines | c03 (officier mort) | c13 traverser le champ de mines sans test |
| passe_bar | Laissez-passer du Devoir | c03 (aider le Devoir) | c07 passer sans payer |
| tenue_monolithe | Tenue du Monolithe | c22 | c23 passer le pont, c24, c27 |
| artefact_meduse | Méduse | c01 (anomalie, détecteur) | vente c01 (400), c08 |
| artefact_boule | Boule de feu | c02 ou c10 | vente c08 (800) |
| artefact_ame | Âme | c06 | c11 contre la SEVA ; vente c08 (1 500) |
| artefact_coeur | Cœur de l'Oasis | c14 | modificateur Chance +1 |

## Drapeaux

| drapeau | mémorise | posé | testé |
|---|---|---|---|
| bandits_ennemis | vous avez tué des bandits au Dépotoir | c02 | c05 (Borov vous reconnaît) |
| devoir_ami | vous avez aidé le Devoir à Agroprom | c03 | c07, c08, c13 |
| strelok_piste | le Devoir vous a parlé de la cache de Strelok | c03 | c04 |
| cache_strelok | vous avez ouvert la cache | c04 | c08 (le Guide) |
| liberte_ami | vous avez aidé la Liberté | c05 | c13 |
| borov_mort | vous avez tué Borov | c05 | c13 (les bandits vous cherchent) |
| devoir_ennemi | vous avez forcé le poste | c07 | c08 |
| barman_confiance | le Barman vous fait confiance | c08 | c08 (le Guide parle), c15 |
| guide_vu | le Guide vous a parlé | c08 | c17 |
| arene_champion | trois victoires à l'Arène | c09 | c08 |
| scientifiques_sauves | le camion des scientifiques est sorti des Terres sauvages | c10 | c11 |
| sakharov_ami | Sakharov vous doit quelque chose | c11 | c11 |
| x16_eteint | l'émetteur du X-16 est éteint | c12 | c11 |
| psi_touche | le psi vous a abîmé (modificateur « Psi ») | c12 | modificateur |
| verite_connue | vous savez ce qu'est la C-Conscience | c12 | c16, c28, c29, c30 |
| oasis_bu | vous avez bu à l'Oasis | c14 | c14 |
| forestier_vu | le Forestier vous a parlé | c14 | c17 |
| brouilleur_eteint | le Brûleur de cerveaux est éteint | c16 | c18 |
| guide_chemin | vous êtes entré dans Pripyat par le tunnel | c17 | c18 |
| monolithe_vu | vous avez vu le rituel du Monolithe | c20 | c23, c27, c30 |
| pont_force | vous avez forcé le pont | c23 | c24 |
| emission_vue | vous avez survécu à l'Émission du parvis | c24 | c28 |
| reacteur_vu | vous avez traversé la salle de contrôle du réacteur | c25 | c27 |
| sarcophage_entre | vous êtes entré dans le Sarcophage | c27 | c28 |
| conscience_appel | la C-Conscience vous a parlé dans la porte secrète | c29 | c30 |

## Modificateurs et déclencheurs en prose

- **AK-74 +1 / Vintorez +2** : « Avec ça, on tire avant eux. » « Le Vintorez ne fait pas de bruit, et ce qu'il touche ne se relève pas. »
- **Veste de cuir** : « Elle ne pare rien, mais les coups rentrent moins. »
- **Détecteur Ours +1 / Détecteur muet −1** : « Il crépite avant vous. » / « Le détecteur ne dit plus rien. Vous lancez vos boulons à l'aveugle. »
- **Cœur de l'Oasis +1** : « Depuis la cave, les boulons tombent du bon côté. »
- **Irradié −1** : « Vous vomissez derrière un pylône. Vos mains tremblent. » (à 18 rads)
- **Blessé −1** : « Vous tirez d'une main. »
- **Psi −1** : « Depuis le laboratoire, il y a une voix de trop dans votre tête. »
- **Déclencheur « Le corps cède »** (`c01-rads`, 30 rads) : le paragraphe commence par le constat, « Vous ne sentez plus vos jambes. Le compteur ne s'arrête plus. », puis c'est une fin : le corps s'arrête quelque part dans la Zone, le détecteur continue seul.

## Actes et convergences

| acte | chapitres | convergence vers l'acte suivant | état garanti à la convergence |
|---|---|---|---|
| 1 Le Sud | c01 à c07 | c07 Le poste du Devoir | Couteau, Makarov, Détecteur ; a pu obtenir AK-74, Corde, Masque, Grenade, Lampe, Clef, Documents du X-18, Clé USB, Laissez-passer |
| 2 Rostok et les terres du milieu | c08 à c17 | c16 Le Radar (Casque psi) ou c17 Le chemin du Guide (Carte du Guide) | a passé le Bar ; a pu obtenir SEVA, Casque psi, Vintorez, PDA de Fantôme, Cœur de l'Oasis, Carte du Guide, `verite_connue` |
| 3 Le Nord | c18 à c23 | c23 Le pont de la Centrale | a traversé Pripyat ; a pu obtenir Décodeur, Tenue du Monolithe, `monolithe_vu` |
| 4 La Centrale | c24 à c30 | c27 Le Sarcophage | a survécu à l'Émission ; avec Décodeur, la porte secrète |

Les sorties précoces : c15 La sortie (acte 2, quitter la Zone), c16 Le Monolithe vous prend (acte 2, sans Casque psi), c01-rads (partout, 30 rads).

## Fins

| fin | chapitre | exige | en deux lignes |
|---|---|---|---|
| Ce que vous êtes (victoire pleine) | c30 | `verite_connue` et `monolithe_vu` et Décodeur (pour entrer) | Vous refusez la Conscience et débranchez les cuves. La Zone ne disparaît pas, mais plus personne ne parle dans les têtes. Vous savez enfin qui vous êtes : le dernier que Strelok a envoyé, et c'est vous. |
| Rejoindre (victoire au rabais) | c30 | être entré par la porte secrète | Vous acceptez. Une cuve est vide. Vous n'avez plus besoin de vœu. |
| Le vœu (survie amère, plusieurs variantes) | c28 | arriver à l'Exauceur | Richesse : le plafond s'effondre en pièces. Immortalité : vous devenez une pierre. Que la Zone disparaisse : vous devenez aveugle, et elle est toujours là. Ne rien souhaiter : vous repartez, et le Guide vous attend au Bar. |
| Le retour au sud (survie amère) | c15 | 3 000 roubles ou plus | Vous passez les barbelés avec vos artefacts. Vous rêverez de la Zone chaque nuit. |
| Le Monolithe vous prend (survie amère) | c16 | passer le Brûleur sans Casque psi ni Carte | Vos pensées se vident. Vous prenez votre place sur la crête, le fusil vers le sud. |
| Le corps cède | c01-rads | 30 rads | Déclencheur. |
| Mort | c01-mort | Endurance à 0 | Court, définitif : « La Zone garde ce qu'elle prend. Quelqu'un trouvera votre PDA. » |

La mort par combat est possible dans chaque acte (Sangsues, Monolithe, Pseudo-géant) ; la mort par piège d'effets aussi (anomalies : −3 points d'Endurance sur un échec de Chance).
