# AnimalGame LouisLeMaitre (AGLLM)

AGLLM est un jeu de gestion et de progression dans lequel vous développez une colonie de chats. Cueillez vos premières ressources, construisez un campement, répartissez le travail et faites évoluer le village au fil des saisons. Le moteur interne d’AGLLM simule l’économie, la population, le calendrier et les déblocages. La scène 3D suit l’évolution de la partie.

## Installer et lancer sous Windows

Après avoir récupéré le dépôt, installez Git et Node.js 24. Exécutez ces commandes depuis le dossier du projet dans PowerShell.

```powershell
git submodule update --init motorAGLLM/source
npm.cmd ci
npm.cmd run motor:protect
npm.cmd run build
.\start.cmd
```

Le jeu s’ouvre dans le navigateur sur [127.0.0.1:8080](http://127.0.0.1:8080/). Utilisez `.\start.cmd --server-only` pour lancer le serveur et ouvrir la page vous-même. Lancez `.\stop.cmd` pour enregistrer la partie ouverte et arrêter le serveur.

Vous pouvez définir `$env:AGLLM_PORT` avant le lancement et l’arrêt pour utiliser un autre port. Si votre installation utilise un profil Chrome dédié, indiquez son chemin dans `$env:AGLLM_BROWSER_PROFILE`. Avec une version portable de Node.js, ajoutez le dossier contenant `node.exe` au `PATH` du terminal.

## Développer le village

1. Dans **Campement**, cueillez de l’herbe à chat, plantez un champ et transformez une partie de votre récolte en bois.
2. Construisez des huttes pour accueillir des habitants et ouvrez **Emplois** dans l’onglet de la colonie, appelé **Hameau** au début de la partie. Attribuez des tâches aux habitants et gardez des réserves pour l’hiver.
3. Construisez une bibliothèque pour développer la science, puis ouvrez **Science** et **Atelier** au fur et à mesure de leurs déblocages.

Les sections de **Jeu** apparaissent à mesure que leurs conditions sont remplies.

| Section | Fonctionnalités |
| --- | --- |
| **Campement** | Collecter, construire, consulter les coûts et effets, gérer les quantités actives, l’automatisation, la vente et les changements de niveau, selon le bâtiment. Les cartes indiquent les exemplaires actifs et construits. Les commandes **Fiche** et **Observer** ouvrent les détails ou cadrent le bâtiment dans la scène. |
| **Village** | Affecter ou retirer des travailleurs, gérer la colonie et organiser des activités telles que la chasse ou les festivals. Le recensement permet de rechercher, filtrer et trier les habitants, de consulter leurs détails, de définir des favoris, de promouvoir un habitant et de choisir un chef. |
| **Science** | Rechercher de nouvelles technologies et prendre des décisions politiques à mesure que la colonie progresse. |
| **Atelier** | Fabriquer des matériaux et acquérir des améliorations qui modifient les rendements et les possibilités de production. |
| **Commerce** | Rencontrer de nouveaux peuples, consulter leurs offres d’achat et de vente, envoyer des caravanes et épingler des échanges dans **Ressources**. |
| **Religion** | Développer la foi, construire et améliorer les ziggourats, débloquer des améliorations spirituelles et effectuer des sacrifices. |
| **Espace** | Lancer des missions, explorer des destinations et construire ou gérer des installations spatiales. |
| **Temps** | Exploiter les flux temporels, accélérer la partie avec Tempus Fugit et débloquer des améliorations temporelles. |
| **Succès, Défis, Stats et File d’attente** | Suivre les objectifs et les records, recommencer avec les règles d’un défi, consulter les statistiques et gérer les actions en attente lorsque ces fonctions sont disponibles. |

Le panneau **Ressources** affiche les stocks, les capacités et les variations de production. Il donne aussi accès aux raccourcis de fabrication et aux échanges épinglés. Le **Journal** rassemble le calendrier et les événements. Dans la barre supérieure, **Infos** affiche l’état de la partie, le calendrier, les FPS, le bonheur, la pollution, le bilan électrique et le chagrin.

## Interface et accessibilité

- Sur grand écran, **Ressources** est à gauche, **Jeu** en bas au centre et **Journal** à droite. Sur écran étroit, les boutons sous la scène permettent de passer d’un panneau à l’autre. Les sections de **Jeu** passent en menu déroulant lorsque le panneau devient trop étroit.
- Faites glisser l’en-tête d’un panneau pour le déplacer, ou sa poignée de redimensionnement pour modifier sa taille. Au clavier, placez le focus sur **Déplacer** ou **Redimensionner** et utilisez les flèches. Les en-têtes restent visibles pendant le défilement du contenu. Les boutons **Réduire** et **Agrandir** replient ou rouvrent les panneaux. Redimensionner la fenêtre rétablit la disposition par défaut.
- Utilisez `Tab` et `Maj+Tab` pour parcourir les commandes. Activez les boutons avec `Entrée` ou `Espace`. Les commandes d’interface affichent un indicateur de focus et les boutons représentés par des icônes portent des libellés accessibles. `Échap` ferme les fiches et les fenêtres contextuelles qui le prennent en charge.
- Le panneau **Ressources** permet de choisir les lignes affichées et d’ajuster la taille du texte et des icônes avec **Taille +** et **Taille −**. Le menu **Options** propose notamment le choix de la langue, du thème et de la notation des nombres.
- Un navigateur compatible WebGL 2 affiche le village en 3D. Les commandes et les données de la partie restent accessibles si la scène est indisponible.

### Caméra du village

| Entrée | Commandes |
| --- | --- |
| **Souris** | Survolez un bâtiment pour voir son contour et son nom, puis cliquez pour le cadrer. Maintenez la molette enfoncée et déplacez la souris pour faire pivoter la vue, ou maintenez le bouton droit pour déplacer le cadrage. Faites défiler la molette pour zoomer. |
| **Écran tactile** | Touchez un bâtiment pour le cadrer. Faites glisser un doigt sur une zone dégagée pour pivoter et pincez à deux doigts pour zoomer. |
| **Clavier** | Placez le focus sur **Caméra du village**. Les flèches font pivoter la vue, `+` et `-` règlent le zoom, et `Origine` réinitialise la caméra. Depuis une carte du **Campement**, activez **Observer** pour cadrer le bâtiment. Utilisez `Échap` pour revenir à la vue précédente. |

Les rues de l’île s’ouvrent avec les constructions et les chats les empruntent entre les quartiers. Le relief, les saisons et la météo influencent l’apparence du décor. La caméra tient compte du réglage système de réduction des animations lors du cadrage.

## Pause, sauvegardes et connexion

- **Mettre en pause** suspend la simulation et **Reprendre la partie** la relance. **Sauvegarder** enregistre la partie immédiatement. Le moteur la sauvegarde également automatiquement, à la fermeture de la page et lors de l’arrêt du serveur.
- Une sauvegarde locale est associée au profil du navigateur, à l’adresse et au port utilisés. Pour jouer sur un autre appareil ou depuis un autre profil, exportez la partie puis importez-la dans le navigateur de destination. Si un onglet affiche une partie déjà ouverte, fermez l’autre onglet pour lui céder la session.
- Dans **Options → Exporter**, téléchargez le fichier texte ou copiez le texte d’export. Dans **Options → Importer**, sélectionnez un fichier texte ou collez le contenu, puis confirmez le remplacement de la partie courante. L’export contient la progression complète, notamment les ressources, les bâtiments, les recherches et le calendrier.
- **Connexion** ouvre le formulaire du service de compte. L’authentification dépend de la disponibilité du service. La partie et les sauvegardes locales sont disponibles sans compte.

## Développer et tester

```powershell
npm.cmd run dev
npm.cmd test
npm.cmd run test:browser
```

Le moteur interne se trouve dans `motorAGLLM/source`. Sa révision est enregistrée dans `motorAGLLM/revision.txt` et le serveur vérifie sa copie locale avant de la servir. L’interface React et ses adaptateurs se trouvent dans `src/`. Le village Three.js se trouve dans `src/world3d/`, avec les modèles, la caméra, les quartiers, le réseau de rues et les animations des habitants.

`npm.cmd test` compile le projet et vérifie le moteur, le serveur et la scène. `npm.cmd run test:browser` utilise Chrome pour vérifier le parcours de jeu, l’interface sur différentes tailles d’écran et les sauvegardes. Pour utiliser Edge, définissez `$env:AGLLM_TEST_BROWSER = 'msedge'`.
