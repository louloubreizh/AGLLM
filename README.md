# KGLLM

KGLLM affiche les commandes de Kittens Game sur le village 3D. Survolez **Infos** ou ouvrez-le au clic pour consulter le calendrier, l’état de la partie et les indicateurs. Survolez une ligne ou sélectionnez-la au clavier pour lire sa description. Sur écran étroit, les onglets **Jeu**, **Ressources** et **Journal** se trouvent sous la scène.

Glissez la poignée d’un panneau pour le déplacer. Le bouton aux deux flèches diagonales permet de modifier sa largeur et sa hauteur. Les deux poignées s’utilisent aussi avec les flèches du clavier quand elles ont le focus. Les boutons **−** et **+** replient et déplient le panneau. Redimensionner la fenêtre rétablit la taille et la position de départ des panneaux.

Glissez directement sur le décor pour tourner. La molette ou le pincement à deux doigts permettent de zoomer. **Caméra 3D** dégage la scène et affiche ses commandes. **Revenir au jeu** ou **Échap** réaffiche les panneaux.

Les ressources et les bâtiments du Campement ont des illustrations SVG en couleur sur fond transparent. Chaque illustration est liée à l’identifiant du jeu. Les bâtiments à améliorer changent d’illustration lorsque l’amélioration change leur fonction.

Dans **Campement**, l’œil cadre un exemplaire construit parmi ceux représentés dans le village. S’il y en a plusieurs, les observations successives changent d’exemplaire. Le bouton **i** ouvre la fiche illustrée, même avant la construction. **Revenir au jeu** ou **Échap** restaure le cadrage précédent.

Chaque sous-menu du panneau **Jeu** possède une scène illustrée et des commandes adaptées à la largeur du panneau. Les onglets se présentent en liste déroulante lorsque le panneau est étroit, y compris après un redimensionnement manuel.

Cliquez sur le titre d’un accordéon pour le replier ou le déplier. Les commandes secondaires sont disponibles au survol ou au clavier. Sur écran tactile, elles restent visibles dans la carte. La description s’ouvre près de la commande survolée. Au clavier, utilisez **Espace** sur la commande et **Échap** pour revenir.

Le jeu actualise le village en direct. Les parcelles sont générées à partir des types de bâtiments construits, avec jusqu’à trois modèles par type et 28 habitants dans la scène.

## Lancer et arrêter sous Windows

Utilisez **Démarrer KGLLM** et **Arrêter KGLLM** sur le Bureau. Dans ce dossier, les mêmes opérations sont disponibles via **start.cmd** et **stop.cmd**. Le jeu est accessible sur [127.0.0.1:8080](http://127.0.0.1:8080/).

Au démarrage, KGLLM retrouve la sauvegarde du lanceur local de Kittens Game en utilisant la même adresse et le même profil Chrome. Si l’ancien jeu est encore ouvert, sauvegardez puis fermez cette fenêtre avant de démarrer KGLLM. **Arrêter KGLLM** sauvegarde la partie, arrête le serveur et ferme la fenêtre lancée par **Démarrer KGLLM**. Si le navigateur bloque la fermeture d’un onglet ouvert manuellement, cet onglet affiche **KGLLM est arrêté**.

## Installation et configuration

Installez [Node.js 24 LTS](https://nodejs.org/en/download/) et conservez le dépôt source `kittensgame-master` à côté du dossier KGLLM. Le serveur lit les fichiers originaux de ce dépôt à l’adresse `/jeu/`. Si le dossier est ailleurs, définissez `$env:KGLLM_GAME_DIR` dans le terminal de démarrage.

```powershell
npm.cmd ci
npm.cmd run build
.\start.cmd
```

`npm start` et `start.cmd --server-only` démarrent le serveur sans ouvrir de fenêtre. `npm stop` arrête le serveur et laisse la fenêtre ouverte. Vous pouvez définir `$env:KGLLM_PORT` dans le même terminal pour choisir un autre port. Chaque combinaison d’adresse, de port et de profil Chrome a sa propre sauvegarde. Les journaux de KGLLM sont dans `.run/`.

## Tests

Si vous utilisez le Node.js portable installé avec KGLLM, ajoutez son dossier au PATH du terminal.

```powershell
$env:Path = "$env:LOCALAPPDATA\KGLLM\toolchain\node-v24.21.0-win-x64;$env:Path"
npm.cmd test
npm.cmd run test:browser
```

Le premier test vérifie la lecture de la partie, les placements, les fichiers du jeu, le serveur HTTP et les scripts Windows. Le test navigateur joue une action native, vérifie la scène 3D, les panneaux sur téléphone et la reprise de la sauvegarde après l’arrêt. Pour Edge, définissez `$env:KGLLM_TEST_BROWSER = 'msedge'`.

## Agent Codex pour l’interface et le village 3D

L’agent [`kgllm-ui`](.codex/agents/kgllm-ui.toml) est rattaché au dépôt. Ouvrez le dossier KGLLM dans l’extension Codex ou lancez Codex depuis sa racine, puis demandez-lui de déléguer la tâche à `kgllm-ui`. [Documentation des agents Codex](https://developers.openai.com/codex/subagents#custom-agents)

> Délègue à `kgllm-ui` la modernisation de l’interface complète de KGLLM. Parcours aussi les sous-menus imbriqués et les écrans débloqués en cours de partie. Fais évoluer le village animé en fonction des saisons, de la population et des constructions. Implémente la refonte par lots et vérifie les actions natives et la reprise de la sauvegarde.

> Délègue à `kgllm-ui` l’amélioration de la scierie dans le village 3D. Anime sa lame et fais en sorte qu’un clic permette de l’inspecter. Vérifie que le glisser continue de faire tourner la caméra à la souris et au tactile.
