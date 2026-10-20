# Pilote de prose sur L'Exauceur de vœux

## 05-01 : deux chapitres réécrits et relus (2026-10-20)

Chapitres : 02 « Le Dépotoir » (action) et 08 « Le Bar « 100 Rads » » (personnages). Chaque chapitre a eu une passe de réécriture puis une passe de relecture par sous-agent ; `story-prose.mjs --diff` a confirmé après chaque passe que seuls les `text` ont changé. Rebuild : `build-map.json` inchangé ; létalité inchangée (56 % random, 50 % prudent sur 1000 parties), donc mécanique intacte.

| mesure | c02 avant | c02 après | c08 avant | c08 après |
|---|---|---|---|---|
| mots min / méd / max | 40 / 53 / 74 | 43 / 74 / 138 | 48 / 64 / 85 | 38 / 71 / 137 |
| phrase médiane (mots) | 7 | 12 | 8 | 9 |
| discours direct | 3 % | 23 % | 2 % | 56 % |
| chutes courtes | 28 % | 10 % | 13 % | 7 % |
| liste noire | 19 | 0 | 26 | 0 |
| tournures répétées | 2 | 0 | 1 | 0 |

Les chutes courtes restantes sont les annonces de test (« Tentez votre Chance. »), imposées par `writing.md`.

Lecture à l'aveugle : page publiée avec le même parcours de sept paragraphes dans les deux versions, étiquettes A/B tirées au sort par chapitre. Verdict de l'utilisateur : « go pour le nouveau style ».

## 05-02 : les 28 autres chapitres (2026-10-20)

Les 30 chapitres sont passés par réécriture puis relecture, contrôlés après chaque passe par `--diff`, lint de chapitre et mesure. Rebuild : `build-map.json` inchangé ; létalité inchangée (56 % random, 50 % prudent sur 1000 parties) ; lint de la fusion sans avertissement ; 100 tests passent.

| mesure, histoire entière | avant | après |
|---|---|---|
| mots, 80 % des paragraphes | 46 à 70 (médiane 58) | 54 à 114 (médiane 80) |
| phrase médiane (p10 / p90) | 8 (3 / 18) | 14 (4 / 30) |
| discours direct | 2 % | 35 % |
| chutes courtes | 22 % | 12 % |
| liste noire (somme des chapitres) | 459 | 0 |
| tournures répétées (somme des chapitres) | 50 | 0 |
| avertissements de story-prose | 239 | 0 |

Incident : la limite d'usage a coupé six agents en cours de route. Les relectures n'avaient rien écrit ; les réécritures des chapitres 14 et 15 étaient complètes. Le contrôle par `--diff` contre les copies a suffi à reprendre sans perte.

Cohérence corrigée en passant : la cachette du Décodeur (chambre 26) était « sous le lavabo » dans la bible, « derrière le radiateur » dans le PDA du chapitre 13, « dans la grille d'aération » au chapitre 19 ; tout est aligné sur la grille d'aération.

## Frictions

- **La relecture a presque autant de travail que la réécriture** (30 paragraphes retouchés sur 40, 26 sur 45) : la passe de prose produit ses propres tics (narrateur qui explique, image répétée sur des branches jumelles, « Vous » en attaque de paragraphe). La passe 3 n'est donc pas optionnelle.
- **Branches jumelles** : les paragraphes qui décrivent la même issue depuis deux chemins (c08-14 / c08-41) sortent avec des phrases identiques ; le script ne le voit que si la tournure dépasse cinq paragraphes. Ajouté au prompt de relecture comme point explicite, avec les attaques de paragraphe en « Vous ».
- **Faits gênants gardés** : un rédacteur a signalé « il frappe à casser des os » pour un adversaire à 2 de dégâts, et un « Vous perdez 2 points d'Endurance » sur une fuite (correct : fuir coûte les dégâts de l'adversaire). Le prompt de réécriture demande de garder les faits ; la bible pourrait préciser que la formule de dégâts suit le chiffre.
- **Les fiches de voix ont changé une réplique** : le Barman ne nomme plus Borov (« ne dit jamais un nom de mort ») alors que Borov peut être vivant. Effet acceptable, mais une fiche trop stricte déforme un fait d'intrigue.
- **Mesure « Ensemble » peu sensible** sur un pilote de deux chapitres (dialogue 2 % → 6 %) : à relire par chapitre.
- **Écarts brief / effets** relevés par plusieurs rédacteurs (c16, c24, c26 : le brief annonce −4 ou −6 d'Endurance, l'effet −3). Le texte suit l'effet, mais les briefs des contrats sont faux : à corriger si les chapitres repassent par une passe 1.
- **« Vous perdez 5 rads »** pour l'Anti-rad, imposé par le surlignage, sonne faux à plusieurs rédacteurs ; « prenez » ne vaut que pour les gains. Une formule de baisse plus naturelle (« le compteur redescend de 5 rads ») devrait être reconnue par `checkHighlights`.
- **Tournures banales entre chapitres** : la mesure d'ensemble relève encore « porte de fer » ×23, « contre le mur » ×33 sur toute l'histoire, sous le seuil de 2 % par chapitre. Le seuil d'ensemble n'est pas un avertissement ; c'est voulu, mais « porte de fer » mériterait une variation à la prochaine relecture.
- **Les rédacteurs ont recopié le diapason et les répliques des fiches** (le capot au soleil, la réplique de Borov) : les relectures les ont retirés. Le prompt de prose pourrait dire explicitement de ne jamais reprendre une phrase de la bible.
