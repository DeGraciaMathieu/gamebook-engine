# Règles d'écriture

Ces règles valent pour tous les styles. La voix, la longueur et les formules dépendent du style choisi dans `styles.md`.

## Constantes
- Deuxième personne, présent de l'indicatif. « Vous poussez la porte. »
- Une image concrète par paragraphe (odeur, lumière, son, texture).
- Le texte d'un choix est une action à l'infinitif, 3 à 9 mots, sans révéler l'issue : « Forcer la grille », pas « Forcer la grille (danger) ». Un coût chiffré s'indique entre parenthèses : « Payer le passeur (3 pièces d'or) ». Chaque choix porte son `kind` (format.md) : il suit le verbe, « Revenir » est `aller`, « Fouiller » est `agir`, « Tirer sur » est `attaquer`.
- Jamais de « rendez-vous au 12 » : les boutons portent les renvois. Annoncer les options en prose (« si vous possédez une dague, vous pouvez… ») est une affaire de style, autorisé en Défis Fantastiques, proscrit en sobre.

## Prose

La prose générée tend vers des vignettes de même taille, au rythme haché, sans parole. `node scripts/story-prose.mjs stories/<id>` mesure ce qui suit et avertit au-delà des seuils ; un avertissement se justifie dans le rapport, il ne se contourne pas.

- **Diapason d'abord** : si la bible en a un (section « Diapason »), c'est lui qu'on imite, avant toute règle de cette section.
- **Longueurs variées** : dans un même chapitre, de 30 à 160 mots. Au moins une scène longue (120 mots ou plus : une conversation, une traversée, une fouille qui tourne mal) et des transitions de deux phrases. Le script avertit quand 80 % des paragraphes d'un chapitre tiennent dans une fourchette de moins de 30 mots.
- **Rythme alterné** : au moins une phrase longue, à subordonnées, par paragraphe, à côté des courtes. Trois phrases de trois mots d'affilée sont un effet, pas une voix.
- **La chute courte** (dernière phrase de quatre mots au plus : « Ils vous attendent. ») dans un paragraphe sur cinq au plus. Jamais de phrase nominale en clôture (« Le silence. »).
- **Du discours direct** dès qu'un personnage est présent : guillemets « », réplique entière, la voix de sa fiche dans la bible. « Il dit que » résume ; une réplique montre. Un paragraphe sur six au moins porte une réplique, hors chapitres sans personnage.
- **Des scènes, pas des vignettes** : une conversation ou une poursuite court sur trois à cinq paragraphes qui se suivent, et chaque paragraphe reprend un détail du précédent (un objet posé, une phrase laissée en suspens). Un paragraphe a le droit de n'être que du dialogue, ou qu'un geste.
- **Le concret nommé** plutôt que l'atmosphère : la marque sur la conserve, le modèle du camion, la matière du mur, le nombre de marches. « Quelque chose », « quelque part », « une sorte de » signalent une image qu'on n'a pas faite.
- **Liste noire** : `prose-blacklist.txt`, chaque expression tolérée une fois pour cinquante paragraphes. Toute tournure propre à l'histoire qui revient dans cinq paragraphes d'un chapitre (« le compteur grimpe ») est à varier, sauf refrain déclaré dans la bible.

## Ce que le texte doit dire pour que le moteur le montre
- Un objet gagné ou perdu est nommé dans le texte avec le nom exact du catalogue, ou au moins son premier mot : « une clef rouillée », « votre potion de vigueur ». Sinon le surlignage tombe en résumé sous le texte.
- Une variation chiffrée s'écrit en toutes lettres avec l'unité : « Vous perdez 3 points d'Endurance », « vous trouvez 5 pièces d'or ». Majuscule au label ; les capitales du style Défis Fantastiques (« points d'ENDURANCE », « Pièces d'Or ») sont reconnues aussi.
- Un paragraphe de test annonce le test dans son texte : « Tentez votre Chance. » ou « Testez votre Habileté. »
- Les paragraphes cibles d'un test ou d'un combat disent le résultat dès la première phrase. Le joueur vient de voir les dés, pas besoin de suspense.
- Le paragraphe `death` est court, définitif, et rappelle l'enjeu que le héros laisse derrière lui.

## Modificateurs
- Le label d'un modificateur est affiché tel quel dans le panneau de combat ou de test, avec son signe : « Hachette +1 », « Le petit à protéger −2 ». Un à trois mots, un nom ou un état, jamais une phrase.
- Le texte qui donne l'objet ou pose l'état dit ce qu'il change, sans chiffre : « avec ça, on se bat mieux », « vos mains ne vous obéissent plus ». Le chiffre, c'est l'interface.

## Combats
- Le texte d'un combat dit ce qui se joue : « ce n'est plus un combat, c'est une course » pour un duel sur l'Endurance, « ses coups glissent sur la tôle » pour une armure, « il frappe à casser des os » pour des dégâts élevés. Le joueur doit sentir la règle avant de voir les chiffres.

## Déclencheurs
- Le paragraphe cible d'un déclencheur s'ouvre sur le constat, en une phrase, parce que le joueur y arrive de n'importe quel endroit : « Le petit ne se réveille pas. » Pas de référence au lieu précédent.

## Cohérence de l'inventaire
- Un objet initial sert au moins une fois (condition, revente, retrait), sinon ne pas le déclarer. Une « épée » qu'on ne teste jamais n'est qu'un mot.
- Un objet consommable est retiré par un effet `remove` et le texte le dit : « Vous videz la potion. »
- Un objet qui débloque un passage est obtenu dans une branche différente de celle où il sert.

## Nommage
- Identifiants de paragraphes : nombres en chaîne (« 1 », « 2 »…), et `mort` pour la mort. Ne pas numéroter dans l'ordre de lecture pour éviter que le joueur devine la suite ; mélanger.
- Identifiants d'objets et de drapeaux : `snake_case` sans accent (`clef_rouillee`, `autel_profane`).
- Noms d'objets : minuscule initiale sauf nom propre, avec article absent (« Clef rouillée » s'affiche dans l'inventaire avec majuscule).
