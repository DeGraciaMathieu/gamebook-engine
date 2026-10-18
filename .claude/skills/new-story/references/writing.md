# Règles d'écriture

## Voix et rythme
- Deuxième personne, présent de l'indicatif. « Vous poussez la porte. »
- 40 à 90 mots par paragraphe, 2 alinéas au plus. Un carrefour ou une scène clé peut monter à 120 mots.
- Une image concrète par paragraphe (odeur, lumière, son, texture). Pas d'adjectifs en grappe.
- Le texte d'un choix est une action à l'infinitif, 3 à 9 mots, sans révéler l'issue : « Forcer la grille », pas « Forcer la grille (danger) ». Un coût chiffré s'indique entre parenthèses : « Payer le passeur (3 pièces d'or) ».
- Pas de méta-texte (« rendez-vous au 12 », « si vous avez l'objet »). Le moteur s'en charge.

## Ce que le texte doit dire pour que le moteur le montre
- Un objet gagné ou perdu est nommé dans le texte avec le nom exact du catalogue, ou au moins son premier mot : « une clef rouillée », « votre potion de vigueur ». Sinon le surlignage tombe en résumé sous le texte.
- Une variation chiffrée s'écrit en toutes lettres avec l'unité : « Vous perdez 3 points d'Endurance », « vous trouvez 5 pièces d'or ». Mettre une majuscule au label.
- Un paragraphe de test annonce le test dans son texte : « Tentez votre Chance. » ou « Testez votre Habileté. »
- Les paragraphes cibles d'un test ou d'un combat disent le résultat dès la première phrase. Le joueur vient de voir les dés, pas besoin de suspense.
- Le paragraphe `death` est court, définitif, et rappelle l'enjeu que le héros laisse derrière lui.

## Cohérence de l'inventaire
- Un objet initial sert au moins une fois (condition, revente, retrait), sinon ne pas le déclarer. Une « épée » qu'on ne teste jamais n'est qu'un mot.
- Un objet consommable est retiré par un effet `remove` et le texte le dit : « Vous videz la potion. »
- Un objet qui débloque un passage est obtenu dans une branche différente de celle où il sert.

## Nommage
- Identifiants de paragraphes : nombres en chaîne (« 1 », « 2 »…), et `mort` pour la mort. Ne pas numéroter dans l'ordre de lecture pour éviter que le joueur devine la suite ; mélanger.
- Identifiants d'objets et de drapeaux : `snake_case` sans accent (`clef_rouillee`, `autel_profane`).
- Noms d'objets : minuscule initiale sauf nom propre, avec article absent (« Clef rouillée » s'affiche dans l'inventaire avec majuscule).
