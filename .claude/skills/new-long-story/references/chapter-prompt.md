# Prompt d'un sous-agent de chapitre et boucle d'orchestration

## Ce que reçoit un sous-agent

Un sous-agent écrit un seul chapitre. Il reçoit, dans son prompt, les chemins des documents à lire et le texte des résumés voisins ; il ne reçoit jamais l'histoire entière. Remplis le gabarit ci-dessous (les crochets) et donne-le tel quel à l'Agent (type `general-purpose`).

```
Tu écris le chapitre [nn] « [titre] » d'un livre-jeu pour le moteur de ce dépôt. Tu n'écris que ce fichier :
stories/[id]/source/chapters/[nn]-[nom].json. Tu ne modifies ni le manifeste, ni la bible, ni un autre chapitre.

Lis d'abord, dans l'ordre :
1. .claude/skills/new-story/references/format.md : le JSON d'un paragraphe et de chaque mécanique.
2. .claude/skills/new-story/references/writing.md : ce que le texte doit nommer (objets, variations chiffrées, tests annoncés).
3. .claude/skills/new-story/references/styles.md, section « [style] » : la voix à tenir.
4. stories/[id]/source/bible.md : le monde, les personnages, le glossaire, les objets, les fins. Tu n'inventes aucun objet, drapeau, caractéristique ni fin : tout vient du manifeste stories/[id]/source/story.src.json et de la bible.
5. Ton contrat : le fichier du chapitre, déjà écrit avec "paragraphs": {}. Tu remplis `paragraphs`, tu ne changes pas le reste (sauf `summary`, que tu ajustes si ta prose s'en écarte).

Le contrat :
- `entries` : les paragraphes par lesquels on arrive dans le chapitre, avec la situation d'arrivée. Chaque entrée doit exister et son texte s'ouvrir sur cette situation (le joueur arrive de n'importe laquelle des entrées, un paragraphe d'entrée de déclencheur commence par constater le fait).
- `exits` : les seuls paragraphes extérieurs que tu as le droit de viser (`to`, `win`, `flee.to`, `success`, `failure`), avec ce qui s'y passe. Chaque sortie doit être atteinte par au moins un chemin.
- `provides` : ce que le chapitre donne (objets par un effet `add` ou une boutique, drapeaux par un effet `flag`). Tout ce qui est listé doit être donné ; rien d'autre ne l'est.
- `requires` : ce que le chapitre a le droit de tester sans le fournir. Ne teste rien d'autre.
- `images` : les paragraphes qui portent une illustration (un à trois), chacun avec `"image": { "src": "images/[id-du-paragraphe].webp", "alt": "…", "prompt": "…" }` (le prompt décrit le lieu, pas le héros de face, en une ou deux phrases). Aucun autre paragraphe n'est illustré.
- `brief` : les scènes attendues.

Les chapitres voisins (ne les lis pas, voici ce qu'il faut en savoir) :
[pour chaque chapitre qui mène ici : « nn — titre : summary », puis la description de l'entrée visée]
[pour chaque chapitre vers lequel on sort : « nn — titre : summary », puis la description de chaque entrée visée]

Contraintes :
- [25 à 50] paragraphes, identifiants « c[nn]-1 » à « c[nn]-N » dans un ordre mélangé (pas dans l'ordre de lecture).
- Un carrefour (paragraphe rejoint par 2 chemins, 2 choix ou plus) et une boucle optionnelle qui y ramène.
- Les mécaniques demandées par le brief ; au minimum un combat et un test. Repères d'équilibrage dans format.md, corrigés pour un grand graphe : sur 150 actions, l'attrition s'additionne. Adversaires courants 6 à 8 d'habileté, dégâts 2 (3 pour un boss, un par chapitre au plus), pièges 2 à 3 points d'Endurance, un lieu de repos par carrefour de hub (une fois par visite, ou payant).
- Chaque choix porte son `kind` (`aller`, `parler`, `agir`, `payer`, `attaquer`, voir format.md).
- Jamais de choix masqué sans alternative visible. Un paragraphe sans choix, combat ni test est une fin : seulement celles que le contrat prévoit.
- Style « [style] », ton [ton], deuxième personne, présent. Les objets portent le nom exact du catalogue, les variations sont chiffrées avec leur unité, les tests sont annoncés, les cibles d'un test ou d'un combat disent le résultat dès la première phrase.

Avant de rendre, exécute et corrige jusqu'à zéro erreur :
  node scripts/story-lint.mjs --chapter stories/[id]/source/chapters/[nn]-[nom].json
Chaque avertissement restant doit être justifié dans ton rapport (un objet fourni mais utilisé dans un autre chapitre se justifie ; une cible non déclarée, jamais : si tu as besoin d'une sortie absente du contrat, ne l'invente pas, signale-la).

Rapport final, en dix lignes au plus : nombre de paragraphes, carrefour, fins, combats et tests, la sortie du lint (erreurs, avertissements et leur justification), et ce que le contrat t'a empêché d'écrire.
```

## Boucle d'orchestration

1. **Ordre** : traite les chapitres par acte, dans l'ordre du macro-squelette. Les résumés voisins viennent des contrats (phase 2), pas de la prose ; l'ordre ne bloque donc pas, mais lancer un acte à la fois garde les reprises lisibles.
2. **Vagues** : 4 à 6 sous-agents à la fois, lancés dans un même message. Attends la fin de la vague avant la suivante ; ne prédis jamais le résultat d'un sous-agent.
3. **Contrôle au retour** : pour chaque chapitre rendu, relance toi-même `node scripts/story-lint.mjs --chapter <fichier>` et compte les paragraphes. Un chapitre passe si : zéro erreur, chaque avertissement justifié, taille dans la fourchette, les illustrations du contrat et elles seules.
4. **Reprise** : un chapitre refusé repart au même sous-agent par SendMessage avec la sortie du lint et la consigne précise (« la cible c07-3 n'est pas dans tes sorties : passe par c07-1 »). Trois reprises au plus ; ensuite, corrige toi-même.
5. **Contrat à changer** : si un sous-agent démontre qu'il manque une sortie ou un objet, c'est le contrat qui change (et le contrat voisin : une sortie nouvelle exige une entrée nouvelle), puis `node scripts/story-lint.mjs stories/<id>` sur les contrats, puis le chapitre repart. Jamais de cible inventée.
6. **Fin de phase** : quand tous les chapitres sont écrits, `node scripts/story-lint.mjs stories/<id>` doit passer sans erreur sur la fusion ; les avertissements d'orphelins (objet jamais utile, drapeau jamais testé) révèlent un contrat non honoré, à renvoyer au chapitre concerné.
