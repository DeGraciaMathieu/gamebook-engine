---
name: polish-story
description: Réécrire la prose d'une histoire existante du livre-jeu (tics de texte généré, uniformité, absence de dialogue) sans toucher à sa mécanique, chapitre par chapitre, par des sous-agents de réécriture et de relecture contrôlés par story-prose.mjs. Utiliser pour « améliore l'écriture », « moins de marqueurs IA », « réécris la prose », /polish-story stories/<id> [--chapters 05,08].
---

# Réécrire la prose d'une histoire : /polish-story stories/<id> [--chapters nn,nn]

L'histoire existe, passe le lint et la simulation ; sa prose se reconnaît comme générée. Tu la fais réécrire et relire, chapitre par chapitre, sans qu'un seul identifiant, choix, effet, combat, test ou image ne change. Lis d'abord :

- `../new-story/references/writing.md`, section « Prose » et section « Ce que le texte doit dire pour que le moteur le montre ».
- `../new-long-story/references/chapter-prompt.md`, passe 3 (relecture) et boucle d'orchestration.
- `stories/<id>/source/bible.md` s'il existe : sections « Style et ton », « Diapason », « Personnages ».

Outils : `node scripts/story-prose.mjs` (mesure, `--chapter`, `--diff`), `node scripts/story-lint.mjs`, `node scripts/story-build.mjs`, `node scripts/story-simulate.mjs`.

## Phase 1 : état des lieux

1. `node scripts/story-prose.mjs stories/<id>` : garde la sortie entière dans ton scratchpad (`avant.txt`), c'est la mesure de référence.
2. Si l'histoire n'a pas de bible (histoire en un fichier), écris dans ton scratchpad une bible réduite de 40 lignes au plus à partir du `story.json` : style et ton avec deux phrases d'exemple tirées des meilleurs paragraphes, personnages récurrents avec une fiche de voix chacun (`../new-story/references/bible.md`), glossaire. Si la bible existe mais n'a ni fiches de voix ni diapason, propose à l'utilisateur d'écrire le diapason ; sinon écris les fiches et un diapason provisoire dans la bible avant de continuer.
3. Choisis les chapitres : ceux de `--chapters`, sinon tous. Pour une histoire en un fichier, découpe les paragraphes en lots de 30 à 40 qui se suivent dans le graphe (`buildGraph` de `scripts/lib/story-checks.mjs` : pars du départ, suis les cibles en largeur), et note les lots.

Montre à l'utilisateur la ligne « Ensemble » de la mesure et les chapitres retenus ; ne demande pas de validation, sauf si tu proposes d'écrire le diapason.

## Phase 2 : réécriture puis relecture

Pour chaque chapitre, deux sous-agents (Agent, type `general-purpose`), par vagues de 4 à 6 chapitres, la réécriture de toute la vague avant la relecture :

1. **Réécriture** : copie le fichier dans ton scratchpad (`<prefix>-avant-prose.json`), puis donne le prompt ci-dessous. Au retour : `node scripts/story-prose.mjs --diff <copie> <fichier>` doit passer, `node scripts/story-lint.mjs --chapter <fichier>` sans erreur ni avertissement de surlignage, `node scripts/story-prose.mjs --chapter <fichier>` avec chaque avertissement justifié dans le rapport.
2. **Relecture** : copie à nouveau (`<prefix>-avant-relecture.json`), puis le prompt « Passe 3 : relecture » de `chapter-prompt.md`, avec la mesure du chapitre. Mêmes contrôles ; la mesure ne doit pas s'être dégradée.

Une reprise par passe (SendMessage avec la sortie du contrôle) ; au-delà, corrige toi-même. Un `--diff` qui échoue : restaure la copie, relance avec le rappel que seuls les `text` changent.

Histoire en un fichier : les lots se traitent l'un après l'autre, jamais deux sous-agents en même temps sur `story.json`. Le sous-agent reçoit la liste des identifiants de son lot et ne touche qu'à leurs `text` ; le `--diff` se fait sur `story.json` entier.

### Prompt de réécriture

```
Tu réécris la prose du chapitre [nn] « [titre] » d'un livre-jeu pour le moteur de ce dépôt. Le chapitre est écrit et
jouable ; sa prose sent le texte généré : paragraphes de même taille, phrases hachées, chutes à effet, personnages qui
ne parlent pas, tournures répétées. Tu n'écris que ce fichier : [fichier], et dans ce fichier uniquement les champs
`text` des paragraphes [de ce lot : liste des identifiants]. Identifiants, choix, cibles, effets, conditions, combats,
tests, images, contrat : rien d'autre ne change, un script le vérifiera.

Lis d'abord, dans l'ordre :
1. [bible] : sections « Style et ton », « Diapason », « Lieux » (ta région), « Personnages » (les fiches de voix), « Glossaire ». Le diapason est la voix à imiter, avant toute règle.
2. .claude/skills/new-story/references/styles.md, section « [style] ».
3. .claude/skills/new-story/references/writing.md, en entier.
4. Ton chapitre, dans l'ordre de lecture (pars des entrées, suis les choix), pour voir les scènes avant de toucher aux phrases.

La mesure actuelle du chapitre :
[sortie de node scripts/story-prose.mjs --chapter <fichier>]

Le texte actuel de chaque paragraphe est ton brouillon : il fixe les faits (lieu, événement, qui est là, ce qui est trouvé
ou perdu, le résultat d'un test ou d'un combat) et tout ce que le moteur doit lire (nom exact d'un objet du catalogue,
« Vous perdez N points d'Endurance », « Vous prenez N rads », « Tentez votre Chance. », le résultat dès la première
phrase d'une cible). Tu gardes ces faits et ces mentions ; tu réécris tout le reste.

Ce que ta réécriture doit faire :
- Des scènes : les paragraphes qui se suivent se répondent (un objet posé reparaît, une réplique reste en suspens et trouve sa réponse au paragraphe suivant).
- Des longueurs variées : de 30 à 160 mots, au moins une scène longue (120 mots ou plus) et des transitions de deux phrases. Allonge ce qui mérite une scène, coupe ce qui n'est qu'un passage.
- Un rythme alterné : une phrase longue à subordonnées au moins par paragraphe. La chute courte (quatre mots au plus) dans un paragraphe sur cinq au plus ; jamais de phrase nominale en clôture.
- Des répliques entre guillemets « », à la voix de la fiche du personnage, dès qu'il est présent. « Il dit que » est interdit quand la réplique peut être donnée.
- Aucune phrase reprise telle quelle de la bible : ni le diapason, ni les répliques des fiches. On imite une voix, on ne la cite pas.
- Le concret nommé (matière, marque, modèle, nombre) à la place du vague. Aucune expression de .claude/skills/new-story/references/prose-blacklist.txt, sauf une fois pour cinquante paragraphes ; aucune tournure répétée d'un paragraphe à l'autre hors refrain déclaré dans la bible.
- Les paragraphes d'entrée s'ouvrent sur la situation d'arrivée ; un paragraphe cible d'un déclencheur commence par constater le fait ; un paragraphe de fin porte le sens dans sa dernière phrase, sans formule.

Avant de rendre, exécute et corrige jusqu'à zéro erreur et zéro avertissement de surlignage :
  node scripts/story-lint.mjs --chapter [fichier]        (histoire en un fichier : node scripts/story-lint.mjs [fichier])
puis mesure et corrige ce qui dépasse :
  node scripts/story-prose.mjs --chapter [fichier]       (histoire en un fichier : node scripts/story-prose.mjs [fichier])
Chaque avertissement restant doit être justifié dans ton rapport.

Rapport final, en dix lignes au plus : le nombre de paragraphes réécrits, la mesure avant et après (longueurs, dialogue, chutes, liste noire, tournures répétées), les avertissements restants et leur justification, et tout fait que tu as dû garder alors qu'il sonnait faux.
```

## Phase 3 : contrôle

```bash
npm test
node scripts/story-build.mjs stories/<id>            # histoire en chapitres
node scripts/story-lint.mjs stories/<id>
node scripts/story-prose.mjs stories/<id>
node scripts/story-simulate.mjs stories/<id>/story.json --runs 3000
```

La létalité et les fins ne doivent pas avoir bougé : la mécanique est intacte, seuls les textes ont changé. Si elles bougent, un `--diff` a été contourné : retrouve le chapitre fautif (`git diff --stat`) et restaure sa copie.

## Phase 4 : rapport

1. La mesure avant et après, dans un tableau à deux lignes (longueurs p10 à p90, dialogue, chutes courtes, liste noire, tournures répétées).
2. Les chapitres les plus retouchés, les avertissements laissés volontairement, les faits que les rédacteurs ont signalés comme faux.
3. Deux paragraphes avant / après, les mêmes, pour que l'utilisateur juge sur pièces.

Ne commite pas sans qu'on te le demande.

## Garde-fous

- Jamais de modification hors des `text` : `story-prose.mjs --diff` tranche, et un diff qui échoue se restaure.
- `story.json` et `build-map.json` d'une histoire en chapitres se reconstruisent, ils ne s'éditent pas.
- Les mentions que le moteur lit (objets, variations chiffrées, tests annoncés, résultats en tête) restent ; le lint de surlignage les vérifie.
- Les prompts d'illustration ne changent pas.
