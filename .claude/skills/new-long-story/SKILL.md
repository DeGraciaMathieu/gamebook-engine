---
name: new-long-story
description: Écrire une histoire longue (500 à 1000 paragraphes) pour le moteur de livre-jeu, en chapitres (stories/<id>/source/) rédigés par des sous-agents à partir d'une bible et d'un macro-squelette validés, puis fusionnée, contrôlée et simulée. Utiliser pour « histoire longue », « 1000 paragraphes », « grande aventure », /new-long-story <thème>.
---

# Écrire une histoire longue : /new-long-story <thème>

Même moteur, mêmes mécaniques et mêmes règles d'écriture que `/new-story`, mais l'histoire est trop grande pour une seule passe : elle s'écrit en chapitres, par des sous-agents qui ne voient jamais l'histoire entière. Toi, l'orchestrateur, tu écris la bible et les contrats ; eux écrivent la prose. Lis d'abord :

- `../new-story/references/format.md`, `writing.md`, `styles.md` : le format et les règles d'écriture, inchangés.
- `../new-story/references/coverage.md`, section « Grands graphes » : actes, convergences, cibles à cette échelle.
- `../new-story/references/bible.md` : le gabarit de la bible et du résumé de chapitre.
- `references/chapter-prompt.md` : le prompt donné à chaque sous-agent et la boucle d'orchestration.

Outils : `node scripts/story-lint.mjs stories/<id>` (contrats et fusion), `node scripts/story-build.mjs stories/<id>` (fusion vers `story.json`), `node scripts/story-simulate.mjs` (tableau par chapitre). Le format source est décrit dans `README.md`, section « Histoire en chapitres ».

Le déroulé a cinq phases. Les phases 1 et 2 attendent la validation de l'utilisateur (AskUserQuestion) ; les suivantes s'enchaînent sans question sauf blocage.

## Phase 1 : cadrage et bible

Si l'argument ne le dit pas, pose au plus quatre questions en un seul appel : style (`styles.md`), ton, difficulté (douce, standard, rude), taille (20 chapitres ≈ 600 paragraphes, 30 ≈ 1000, 40 ≈ 1300). Puis écris, dans cet ordre :

1. `stories/<id>/source/story.src.json` : le manifeste, c'est-à-dire tout sauf les paragraphes : `id`, `title`, `summary`, `art.style`, `hero` (caractéristiques avec `description`, réserve de points, ressources, horloges), `items` (le catalogue complet, 20 à 40 objets, chacun obtenu dans un chapitre et utile dans un autre), `modifiers` (au moins deux bonus et deux malus), `triggers` (toute seconde jauge en appelle un). `start`, `death` et les cibles des déclencheurs désignent des paragraphes préfixés (`c01-1`, `c01-mort`) qui existeront en phase 3.
2. `stories/<id>/source/bible.md` suivant le gabarit de `bible.md` : pitch, style et ton avec phrases d'exemple, héros, lieux par région, personnages récurrents, glossaire, économie des objets et des drapeaux, modificateurs et déclencheurs en prose, actes et convergences, fins.

Montre à l'utilisateur le pitch, la fiche du héros, le tableau des objets et la liste des fins ; demande validation.

## Phase 2 : macro-squelette

Avant toute prose, le découpage en chapitres, sous forme de tableau Markdown :

| nn | titre | acte / région | rôle | entrées | sorties | fournit | requiert | fins | image |
|---|---|---|---|---|---|---|---|---|---|

Rôles : départ, région, carrefour d'acte, convergence, verrou, fins, mort. Applique la section « Grands graphes » de `coverage.md` et montre explicitement : les actes et leurs convergences, où chaque objet s'obtient et où il sert (fournit / requiert), où chaque fin se trouve et ce qu'elle exige, le chapitre qui porte `death`, les chapitres cibles des déclencheurs.

Puis écris chaque contrat dans `stories/<id>/source/chapters/<nn>-<nom>.json` avec `"paragraphs": {}` :

```json
{
  "title": "Le port du Sable Noir",
  "summary": "Ce que le lecteur sait et possède en sortant (gabarit dans bible.md).",
  "brief": "Pour le rédacteur : les scènes attendues, le carrefour, les dangers, les personnages de la bible qui apparaissent, le ton de la fin de chapitre.",
  "entries": { "c05-1": "Arrivée par la route, de nuit, blessé ou non" },
  "exits": { "c06-1": "Embarquer sur la Louve", "c09-1": "Fuir par les marais, poursuivi" },
  "provides": { "items": ["clef_rouillee"], "flags": ["pretre_vu"] },
  "requires": { "items": [], "flags": ["marche_vu"] },
  "images": ["c05-7", "c05-21"],
  "paragraphs": {}
}
```

Règles : les entrées d'un chapitre sont tout ce par quoi on peut y arriver de l'extérieur (sorties d'autres chapitres, `start`, `death`, cibles de déclencheurs) ; chaque sortie vise une entrée déclarée d'un autre chapitre ; `requires` ne cite que ce qui est fourni en amont ou par le héros au départ ; `images` désigne un à trois paragraphes qui n'existent pas encore, le rédacteur les créera.

Lance `node scripts/story-lint.mjs stories/<id>` : il doit répondre « Contrats cohérents » sans erreur. Montre le tableau et la sortie du lint ; demande validation. Si l'utilisateur ajuste, reprends le tableau complet et relance le lint.

## Phase 3 : écriture par sous-agents

Suis la boucle de `references/chapter-prompt.md` : un sous-agent par chapitre, lancés par vagues de 4 à 6 (Agent, type `general-purpose`), chacun avec le prompt rempli (bible, contrat, résumés des chapitres voisins, style, taille) et l'obligation de rendre un chapitre dont `node scripts/story-lint.mjs --chapter <fichier>` sort sans erreur. Un sous-agent n'écrit que son fichier de chapitre ; il ne touche ni au manifeste, ni à la bible, ni aux autres chapitres.

À chaque retour, relance toi-même le lint du chapitre. Un chapitre avec erreurs, ou un avertissement non justifié dans le rapport du sous-agent, repart au même sous-agent (SendMessage) avec la sortie du lint. Trois reprises au plus par chapitre ; au-delà, écris toi-même la correction.

Quand tous les chapitres sont rendus, `node scripts/story-lint.mjs stories/<id>` doit passer sans erreur sur la fusion.

## Phase 4 : fusion, contrôle, équilibrage

```bash
npm test
node scripts/story-build.mjs stories/<id>
node scripts/story-lint.mjs stories/<id>
node scripts/story-simulate.mjs stories/<id>/story.json --runs 3000
node scripts/story-simulate.mjs stories/<id>/story.json --runs 3000 --strategy prudent
```

Ajoute l'entrée dans `stories/index.json`. Compare aux cibles de `coverage.md` (létalité, fins, et la section « Grands graphes » : paragraphes vus par partie, jamais visités en tout et par chapitre, chapitres sous 3 % de passage). Pour corriger : modifie les chapitres (jamais `story.json`), puis relance le build et les simulations. Une correction locale (un chiffre, un choix, une fuite) se fait à la main ; une réécriture de chapitre repart à un sous-agent avec le diagnostic. Trois itérations au plus ; au-delà, expose le compromis à l'utilisateur.

## Phase 5 : rapport

Un message court pour l'utilisateur :

1. Pitch en deux lignes, style retenu, chemins (`source/`, `story.json`, `build-map.json`).
2. Le graphe résumé : chapitres par acte, nombre de paragraphes, fins et leurs conditions, convergences.
3. Les chiffres de simulation (les deux stratégies) dans un petit tableau, avec les chapitres les moins visités.
4. Les choix de conception discutables, les avertissements laissés volontairement, les frictions rencontrées avec les scripts ou le prompt (à reporter dans `.planning/` si demandé).
5. La commande pour jouer : `npm start` puis http://localhost:8080. Les illustrations se génèrent ensuite avec `story-illustrate.mjs` (celles du contrat, une à trois par chapitre).

Ne commite pas sans qu'on te le demande.

## Garde-fous

- Le moteur ne se modifie pas pendant cette commande. Si une mécanique manque, note-la dans le rapport.
- Les sous-agents reçoivent la bible et leur contrat, jamais l'histoire entière ni les autres chapitres.
- Les identifiants de paragraphes sont `c<nn>-<n>` ; les objets et drapeaux viennent du manifeste et de la bible, un rédacteur n'en crée pas.
- `story.json` et `build-map.json` sont générés et commités : on ne les édite jamais à la main, on rebuild.
- Une à trois illustrations par chapitre, celles du contrat (`images`).
