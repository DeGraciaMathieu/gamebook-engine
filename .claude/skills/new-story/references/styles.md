# Styles d'écriture

Le style se choisit en phase 1 et s'applique à toute l'histoire. Les règles de `writing.md` (nommer les objets, chiffrer les variations, annoncer les tests, dire le résultat en tête des cibles) valent pour tous les styles ; chaque style y ajoute sa voix.

## Style « Défis Fantastiques »

La voix des livres de Steve Jackson et Ian Livingstone dans leur traduction française des années 80 (La Cité des Voleurs, Le Labyrinthe de la Mort). À choisir pour une aventure classique, un donjon, une cité, une quête d'objet.

- **Voix** : deuxième personne, présent, narrateur qui explique tout, sans ironie ni second degré. Registre légèrement apprêté : « vous désirez », « vous souhaitez », « vous préférez », « heureusement », « tout à fait ».
- **Phrases** : longues, à subordonnées, qui enchaînent dans le même souffle l'action, la description et la conséquence. Descriptions par paires d'adjectifs : « un homme maigre à la peau blafarde, aux yeux creux et sombres ». Une métaphore de loin en loin, jamais deux.
- **Décor** : précis et réaliste, distances en kilomètres, points cardinaux, noms de rues et de lieux (« rue de l'Écurie », « Port du Sable Noir »). L'inquiétant passe par des objets concrets : crânes sur des pieux, cages aux murailles, odeur de putréfaction.
- **Dialogues** : courts, introduits par deux-points et guillemets, une réplique à la fois : « D'une voix froide, il demande : « Vous désirez ? » »
- **Règles dans le texte** : les effets sont des instructions au joueur, en chiffres et en capitales. « Ajoutez 1 point de CHANCE. » « Vous perdez 2 points d'ENDURANCE. » « Le sac contient 12 Pièces d'Or. » Les vertus d'un objet sont expliquées littéralement au moment où on le trouve.
- **Choix** : annoncés en prose par des conditionnelles avant les boutons : « Si vous possédez une dague, vous pouvez… », « Vous pouvez soit…, soit… ». Le paragraphe se termine souvent par « Qu'allez-vous faire ? » ou « Où désirez-vous aller ? ». Les boutons portent l'action concrète, avec l'objet ou le prix : « Attaquer le domestique avec votre épée », « Payer le passeur (2 Pièces d'Or) ».
- **Combats et tests** : annoncés par la formule consacrée. « Vous devez le combattre. » « Testez votre Habileté. » « Tentez votre Chance. »
- **Longueur** : 50 à 150 mots ; des paragraphes de transition très courts, deux phrases.
- **Fins** : la formule « Votre aventure s'achève ici. », et pour la vraie victoire « Votre aventure s'achève ici, et vous l'avez remportée. »
- **Personnages** : nommés et décrits, jamais moqués. Le mal est franc, le bien est rare et payant.

Scène dialoguée dans cette voix :

> L'aubergiste pose ses deux mains à plat sur le comptoir et vous dévisage un long moment avant de parler : « Une chambre, c'est 3 Pièces d'Or. Avec une porte qui ferme, c'est 5. » Vous lui demandez ce qui rôde dans les couloirs la nuit. Il hausse les épaules : « Rien que vous ne puissiez combattre, si vous avez une épée. Et si vous n'en avez pas, je vous conseille la porte qui ferme. »

Exemple dans le dépôt : `stories/mille-portes/story.json`.

## Style « sobre »

La voix par défaut des histoires littéraires ou graves (La Route, Lankhmar, un récit intime). À choisir quand le ton compte plus que la quête.

- **Voix** : deuxième personne, présent, phrases de longueur variée (la courte frappe parce que la longue l'a précédée), ellipses rares et motivées, une image concrète par scène. Pas d'explication de ce que le joueur peut déduire. Le registre sobre n'est pas le registre haché : la section « Prose » de `writing.md` s'applique en entier.
- **Règles dans le texte** : écrites en toutes lettres mais sans capitales et sans injonction : « Vous perdez 2 points d'Endurance. » « Il regagne 1 point de Souffle. » Un objet n'est jamais expliqué, il est montré.
- **Choix** : jamais annoncés en prose, les boutons suffisent. Infinitif, 3 à 9 mots.
- **Dialogues** : présents dès qu'un personnage parle, entre guillemets, à la voix de sa fiche ; le narrateur ne résume pas une réplique qu'il peut donner.
- **Longueur** : 30 à 160 mots, variés dans un même chapitre ; une scène longue au moins par chapitre.
- **Fins** : pas de formule, la dernière phrase porte le sens.

Scène dialoguée dans cette voix :

> Le Barman essuie le même verre depuis que vous êtes entré. « Qu'est-ce que tu as. » Vous posez les documents sur le zinc. Il finit le verre, le range, puis tire la liasse vers lui d'un doigt et la glisse sous le comptoir sans l'avoir ouverte. « Le X-18. Ça vaut un lit pour la nuit, et le repas. Le Guide, c'est autre chose : tu le mérites ou tu ne l'as pas. »

Exemple dans le dépôt : `stories/la-cendre/story.json`.

## Style « picaresque »

Variante du style sobre pour les cités de voleurs, les filous et les arnaques : phrases vives, ironie légère, personnages hauts en couleur et dialogues à répliques. Les règles restent sans capitales. Exemple : la première version de Mille-Portes, avant sa réécriture en style Défis Fantastiques.

Scène dialoguée dans cette voix :

> « Deux sous le passage, trois si vous êtes pressé, et vous avez l'air pressé », dit le gamin sans lâcher votre manche. Vous lui faites remarquer que le pont appartient à tout le monde. « Le pont, oui. Moi, je suis à louer. »
