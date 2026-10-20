# Prompts des sous-agents de chapitre et boucle d'orchestration

Un chapitre s'écrit en trois passes, chacune par un sous-agent (Agent, type `general-purpose`) qui ne voit jamais l'histoire entière :

1. **Squelette** : la structure et la mécanique, avec un texte réduit à une didascalie par paragraphe.
2. **Prose** : la rédaction, chapitre entier en main, qui ne touche qu'aux champs `text`.
3. **Relecture** : la chasse aux tics et aux répétitions, chapitre lu dans l'ordre, qui ne touche qu'aux champs `text`.

Remplis les gabarits (les crochets) et donne-les tels quels. Un sous-agent n'écrit que son fichier de chapitre ; il ne touche ni au manifeste, ni à la bible, ni aux autres chapitres.

## Passe 1 : squelette

```
Tu construis le chapitre [nn] « [titre] » d'un livre-jeu pour le moteur de ce dépôt. Tu n'écris que ce fichier :
stories/[id]/source/chapters/[nn]-[nom].json. Tu ne modifies ni le manifeste, ni la bible, ni un autre chapitre.
Cette passe pose la structure et la mécanique ; la prose viendra d'un autre rédacteur. Chaque `text` est une
didascalie d'une ligne entre crochets, pas une phrase de récit.

Lis d'abord, dans l'ordre :
1. .claude/skills/new-story/references/format.md : le JSON d'un paragraphe et de chaque mécanique.
2. stories/[id]/source/bible.md : le monde, les lieux, les personnages, le glossaire, les objets, les fins. Tu n'inventes
   aucun objet, drapeau, caractéristique ni fin : tout vient du manifeste stories/[id]/source/story.src.json et de la bible.
3. Ton contrat : le fichier du chapitre, déjà écrit avec "paragraphs": {}. Tu remplis `paragraphs`, tu ne changes pas le reste.

Le contrat :
- `entries` : les paragraphes par lesquels on arrive dans le chapitre, avec la situation d'arrivée. Chaque entrée doit exister.
- `exits` : les seuls paragraphes extérieurs que tu as le droit de viser (`to`, `win`, `flee.to`, `success`, `failure`). Chaque sortie doit être atteinte par au moins un chemin.
- `provides` : ce que le chapitre donne (objets par un effet `add` ou une boutique, drapeaux par un effet `flag`). Tout ce qui est listé doit être donné ; rien d'autre ne l'est.
- `requires` : ce que le chapitre a le droit de tester sans le fournir. Ne teste rien d'autre.
- `images` : les paragraphes qui porteront une illustration (un à trois) : pose sur chacun `"image": { "src": "images/[id-du-paragraphe].webp", "alt": "…", "prompt": "…" }` (le prompt décrit le lieu, pas le héros de face, en une ou deux phrases).
- `brief` : les scènes attendues.

Les chapitres voisins (ne les lis pas, voici ce qu'il faut en savoir) :
[pour chaque chapitre qui mène ici : « nn — titre : summary », puis la description de l'entrée visée]
[pour chaque chapitre vers lequel on sort : « nn — titre : summary », puis la description de chaque entrée visée]

Contraintes :
- [25 à 50] paragraphes, identifiants « c[nn]-1 » à « c[nn]-N » dans un ordre mélangé (pas dans l'ordre de lecture).
- Un carrefour (paragraphe rejoint par 2 chemins, 2 choix ou plus) et une boucle optionnelle qui y ramène.
- Les mécaniques demandées par le brief ; au minimum un combat et un test. Repères d'équilibrage dans format.md, corrigés pour un grand graphe : adversaires courants 6 à 8 d'habileté, dégâts 2 (3 pour un boss, un par chapitre au plus), pièges 2 à 3 points d'Endurance, un lieu de repos par carrefour de hub (une fois par visite, ou payant).
- Des scènes, pas des vignettes : groupe les paragraphes en deux ou trois scènes qui se suivent (une conversation avec un personnage de la bible sur trois à cinq paragraphes, une traversée, une fouille), et note dans la didascalie à quelle scène chaque paragraphe appartient.
- Jamais de choix masqué sans alternative visible. Un paragraphe sans choix, combat ni test est une fin : seulement celles que le contrat prévoit.
- Chaque choix porte son `kind` (`aller`, `parler`, `agir`, `payer`, `attaquer`) et un texte à l'infinitif, 3 à 9 mots.
- La didascalie de chaque `text` tient en une ligne entre crochets : « [scène 2, Bar : le Barman prend les Documents du X-18, donne un lit ; nommer l'objet retiré] ». Elle dit le lieu, ce qui se passe, qui parle, et ce que la prose devra nommer (objet gagné ou perdu, variation chiffrée avec son unité, test annoncé, résultat d'un combat ou d'un test en tête).

Avant de rendre, exécute et corrige jusqu'à zéro erreur :
  node scripts/story-lint.mjs --chapter stories/[id]/source/chapters/[nn]-[nom].json
Les avertissements de surlignage (objet ou variation non nommés dans le texte) sont attendus à cette passe : la prose les réglera. Tout autre avertissement doit être justifié dans ton rapport (une cible non déclarée, jamais : si tu as besoin d'une sortie absente du contrat, ne l'invente pas, signale-la).

Rapport final, en dix lignes au plus : nombre de paragraphes, scènes, carrefour, fins, combats et tests, la sortie du lint (erreurs, avertissements hors surlignage et leur justification), et ce que le contrat t'a empêché d'écrire.
```

## Passe 2 : prose

```
Tu rédiges la prose du chapitre [nn] « [titre] » d'un livre-jeu pour le moteur de ce dépôt. Le chapitre existe déjà
avec sa structure et sa mécanique ; chaque `text` est une didascalie entre crochets. Tu remplaces chaque didascalie
par le texte définitif. Tu n'écris que ce fichier : stories/[id]/source/chapters/[nn]-[nom].json, et dans ce fichier
uniquement les champs `text` des paragraphes. Identifiants, choix, cibles, effets, conditions, combats, tests, images,
contrat : rien d'autre ne change, un script le vérifiera.

Lis d'abord, dans l'ordre :
1. stories/[id]/source/bible.md, sections « Style et ton », « Diapason », « Lieux » (ta région), « Personnages » (les fiches de voix de ceux qui apparaissent), « Glossaire ». Le diapason est la voix à imiter, avant toute règle.
2. .claude/skills/new-story/references/styles.md, section « [style] ».
3. .claude/skills/new-story/references/writing.md, en entier : la section « Prose » et la section « Ce que le texte doit dire pour que le moteur le montre ».
4. Ton chapitre, en entier, dans l'ordre de lecture (pars des entrées, suis les choix).

Le chapitre précédent se termine ainsi (pour enchaîner, pas pour le réécrire) :
[les deux ou trois derniers paragraphes du chemin principal menant à l'entrée, texte complet]

Ce que ta prose doit faire :
- Respecter chaque didascalie : lieu, événement, personnage, et tout ce qu'elle demande de nommer (le nom exact d'un objet du catalogue, « Vous perdez N points d'Endurance », « Vous prenez N rads », « Tentez votre Chance. », le résultat d'un test ou d'un combat dès la première phrase de sa cible).
- Faire des scènes : les paragraphes d'une même scène se répondent (un objet posé reparaît, une réplique reste en suspens et trouve sa réponse au paragraphe suivant).
- Varier les longueurs dans le chapitre : de 30 à 160 mots, au moins une scène longue (120 mots ou plus) et des transitions de deux phrases.
- Alterner le rythme : une phrase longue à subordonnées au moins par paragraphe. La chute courte (quatre mots au plus) dans un paragraphe sur cinq au plus ; jamais de phrase nominale en clôture.
- Aucune phrase reprise telle quelle de la bible : ni le diapason, ni les répliques des fiches. On imite une voix, on ne la cite pas.
- Faire parler les personnages entre guillemets « », à la voix de leur fiche, dès qu'ils sont présents. « Il dit que » est interdit quand la réplique peut être donnée.
- Nommer le concret (matière, marque, modèle, nombre) plutôt que l'atmosphère. Aucune expression de .claude/skills/new-story/references/prose-blacklist.txt, sauf une fois pour cinquante paragraphes.
- Style « [style] », ton [ton], deuxième personne, présent. Les paragraphes d'entrée s'ouvrent sur la situation d'arrivée décrite dans `entries` ; un paragraphe cible d'un déclencheur commence par constater le fait.

Avant de rendre, exécute et corrige jusqu'à zéro erreur et zéro avertissement de surlignage :
  node scripts/story-lint.mjs --chapter stories/[id]/source/chapters/[nn]-[nom].json
puis mesure et corrige ce qui dépasse :
  node scripts/story-prose.mjs --chapter stories/[id]/source/chapters/[nn]-[nom].json
Chaque avertissement restant doit être justifié dans ton rapport (un chapitre sans personnage justifie l'absence de dialogue ; une tournure répétée ne se justifie que si la bible la déclare comme refrain).

Rapport final, en dix lignes au plus : la sortie du lint, la ligne de mesure de story-prose (longueurs, dialogue, chutes) et ses avertissements avec leur justification, et toute didascalie que tu n'as pas pu honorer.
```

## Passe 3 : relecture

```
Tu relis le chapitre [nn] « [titre] » d'un livre-jeu pour le moteur de ce dépôt, comme un correcteur d'édition qui
traque ce qui sent le texte généré. Tu n'écris que ce fichier : stories/[id]/source/chapters/[nn]-[nom].json, et dans
ce fichier uniquement les champs `text` des paragraphes. Rien d'autre ne change, un script le vérifiera.

Lis d'abord :
1. stories/[id]/source/bible.md, sections « Style et ton », « Diapason », « Personnages ».
2. .claude/skills/new-story/references/writing.md, sections « Prose » et « Ce que le texte doit dire pour que le moteur le montre ».
3. Ton chapitre, dans l'ordre d'un parcours de lecture (pars de chaque entrée, suis les choix), pas dans l'ordre du fichier.

La mesure actuelle du chapitre :
[sortie de node scripts/story-prose.mjs --chapter <fichier>]

Ce que tu cherches, paragraphe par paragraphe, puis d'un paragraphe à l'autre :
- Les tics : la chute courte à effet, la phrase nominale, « quelque chose », « comme si », « personne ne », le narrateur qui souligne (« vous comprenez », « vous ne saurez jamais »), la comparaison réflexe, la liste noire.
- Les répétitions : une tournure, une image ou un geste qui revient dans plusieurs paragraphes du chapitre (« le compteur grimpe », « se tait », une porte de fer à chaque paragraphe). Varie ou supprime, sauf refrain déclaré dans la bible.
- Les branches jumelles : deux paragraphes qui décrivent la même issue depuis deux chemins (la même victoire, le même retour au carrefour) et partagent des phrases entières. Le script ne les voit pas ; toi si. Chacun garde sa situation d'arrivée et perd la phrase copiée.
- Les attaques de paragraphe : « Vous » en tête d'un paragraphe sur deux est une mécanique, pas une voix. Ouvre sur un lieu, un geste d'autrui, une réplique, un son.
- L'uniformité : des paragraphes de même taille et de même construction (décor, détail, chute). Allonge une scène, raccourcis une transition, change l'attaque d'un paragraphe sur deux (une réplique, un geste, une phrase longue).
- Le discours indirect qui résume ce qu'une réplique montrerait ; la voix d'un personnage qui ne suit pas sa fiche.
- Le vague : « quelque chose », « une sorte de », « quelque part » à remplacer par la chose.
- Ce que le moteur doit lire : le nom exact d'un objet gagné ou perdu, la variation chiffrée avec son unité, le test annoncé, le résultat en tête d'une cible. Tu ne retires jamais ces mentions ; tu les reformules si elles sonnent faux.

Corrige directement dans le fichier, puis exécute jusqu'à zéro erreur et zéro avertissement de surlignage :
  node scripts/story-lint.mjs --chapter stories/[id]/source/chapters/[nn]-[nom].json
  node scripts/story-prose.mjs --chapter stories/[id]/source/chapters/[nn]-[nom].json

Rapport final, en dix lignes au plus : le nombre de paragraphes retouchés, les trois tics les plus fréquents que tu as trouvés, la mesure avant et après (longueurs, dialogue, chutes, liste noire, tournures répétées), et les avertissements restants avec leur justification.
```

## Boucle d'orchestration

1. **Ordre** : traite les chapitres par acte, dans l'ordre du macro-squelette. Les résumés voisins viennent des contrats (phase 2), pas de la prose ; l'ordre ne bloque donc pas. Pour la passe 2, les derniers paragraphes du chapitre précédent viennent de sa passe 2 terminée : lance les passes 2 d'un acte quand celles de l'acte précédent sont rendues.
2. **Vagues** : 4 à 6 sous-agents à la fois, lancés dans un même message, une passe par vague (toutes les passes 1 d'un acte, puis toutes les passes 2, puis les passes 3). Attends la fin de la vague avant la suivante ; ne prédis jamais le résultat d'un sous-agent.
3. **Avant chaque passe 2 et 3**, copie le fichier du chapitre dans ton scratchpad (`<prefix>-avant-prose.json`, `<prefix>-avant-relecture.json`).
4. **Contrôle au retour** :
   - Passe 1 : `node scripts/story-lint.mjs --chapter <fichier>` sans erreur ; taille dans la fourchette ; les illustrations du contrat et elles seules ; chaque `text` est une didascalie entre crochets ; chaque choix a un `kind`.
   - Passe 2 : `node scripts/story-prose.mjs --diff <copie> <fichier>` doit passer (seuls les `text` ont changé) ; lint sans erreur ni avertissement de surlignage ; `story-prose.mjs --chapter` : chaque avertissement justifié dans le rapport ; aucune didascalie restante (`grep -c '"text": "\['` doit donner 0).
   - Passe 3 : même `--diff` sur la copie d'avant relecture ; lint et mesure comme en passe 2 ; la mesure ne doit pas s'être dégradée.
5. **Reprise** : un chapitre refusé repart au même sous-agent par SendMessage avec la sortie du contrôle et la consigne précise (« la cible c07-3 n'est pas dans tes sorties : passe par c07-1 », « c05-12 et c05-19 se ferment tous deux sur "Il attend." »). Une reprise par passe ; ensuite, corrige toi-même. Si un `--diff` échoue, restaure la copie et relance la passe avec le rappel : seuls les `text` changent.
6. **Contrat à changer** : si un sous-agent démontre qu'il manque une sortie ou un objet, c'est le contrat qui change (et le contrat voisin : une sortie nouvelle exige une entrée nouvelle), puis `node scripts/story-lint.mjs stories/<id>` sur les contrats, puis la passe 1 du chapitre repart. Jamais de cible inventée.
7. **Fin de phase** : quand tous les chapitres ont leurs trois passes, `node scripts/story-lint.mjs stories/<id>` doit passer sans erreur sur la fusion, et `node scripts/story-prose.mjs stories/<id>` donne le tableau par chapitre pour le rapport ; les avertissements d'orphelins (objet jamais utile, drapeau jamais testé) révèlent un contrat non honoré, à renvoyer à la passe 1 du chapitre concerné.
