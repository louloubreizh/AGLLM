# AnimalGame LouisLeMaitre (AGLLM)

AGLLM affiche Kittens Game dans une interface avec village 3D et panneaux modulables. Le moteur de référence local fournit les règles, le catalogue, les descriptions, les statistiques et les sauvegardes. Sur grand écran, **Ressources** est à gauche, **Jeu** en bas au centre et **Journal** à droite. Sur écran étroit, les onglets sous la scène permettent de passer d’un panneau à l’autre. Redimensionner la fenêtre rétablit la position et la taille par défaut des panneaux.

## Lancer le jeu sous Windows

Installez Git et Node.js 24, puis exécutez ces commandes dans le dossier d’AGLLM.

```powershell
git submodule update --init motorAGLLM/source
npm.cmd ci
npm.cmd run motor:protect
npm.cmd run build
.\start.cmd
```

Le jeu s’ouvre sur [127.0.0.1:8080](http://127.0.0.1:8080/). Utilisez `.\start.cmd --server-only` pour lancer uniquement le serveur et `.\stop.cmd` pour enregistrer la partie ouverte et arrêter le serveur. Pour choisir un autre port, définissez `$env:AGLLM_PORT` avant d’exécuter ces commandes.

## Jouer et échanger une sauvegarde complète

La page principale ouvre Kittens Game. Depuis **Options → Importer**, sélectionnez un fichier texte exporté par Kittens Game ou collez son contenu, puis confirmez. Depuis **Options → Exporter**, téléchargez le fichier natif ou copiez le texte. Le moteur de référence lit et écrit la sauvegarde complète dans les deux sens. La compatibilité des versions et les migrations suivent les règles natives du moteur épinglé.

La barre d’AGLLM regroupe **Options**, **Connexion** et **Infos** avec les FPS, la pollution, le bonheur, l’électricité et le chagrin. **Connexion** ouvre le formulaire natif, dont l’authentification dépend d’un serveur KGNet accessible. Les en-têtes des panneaux restent visibles pendant le défilement de leur contenu.

Les sous-onglets de **Jeu** passent en liste déroulante quand le panneau devient étroit. Dans le **Campement**, les cartes affichent les bâtiments actifs et construits, et donnent accès aux commandes d’activation, à la fiche et au cadrage 3D. Glissez sur une partie dégagée du décor pour tourner la caméra. Dans **Village**, les métiers ont leurs portraits et le recensement permet de rechercher, filtrer et consulter les habitants.

Le bouton **Sauvegarder** enregistre la partie courante. Le serveur demande aussi une sauvegarde lors de son arrêt. Les parties locales sont liées au profil navigateur, à l’adresse et au port. Si vous utilisiez un profil Chrome dédié, définissez `$env:AGLLM_BROWSER_PROFILE` avec son chemin avant le lancement.

La révision autorisée figure dans `motorAGLLM/revision.txt`. Le serveur vérifie la révision et le contenu avant de servir le moteur. `npm.cmd run motor:protect` place les fichiers d’origine en lecture seule. Les consignes destinées aux agents figurent dans `motorAGLLM/AGENTS.md`. Les fonctions distantes du moteur restent désactivées dans cette interface locale.

## Retrouver le mode autonome AGLLM

Ouvrez [le mode autonome](http://127.0.0.1:8080/?mode=agllm) ou sélectionnez **Ouvrir le mode autonome AGLLM** dans les options. Les sauvegardes AGLLM existantes sont accessibles dans le profil, à l’adresse et au port où elles ont été créées.

1. Construisez un **jardin nourricier** pour produire des vivres et un **abri du sous-bois** pour accueillir de nouveaux habitants.
2. Ouvrez **Village → Métiers** pour affecter les habitants. Surveillez le bilan quotidien dans le panneau **Ressources**, surtout avant l’hiver.
3. Construisez une **maison des cartes** pour produire de la science. Les recherches suivantes apparaissent au fur et à mesure que vous remplissez leurs prérequis.

Chaque atelier supplémentaire améliore le rendement des recettes. La quantité affichée dans l’**Atelier** inclut ce bonus, qui s’applique aussi à la fabrication automatique.

Sélectionnez le nom d’une ressource pour lire son usage. Sa ligne indique le stock, la capacité et le bilan journalier. Le **Journal** retrace les constructions, déblocages et événements. Dans le **Campement**, le bouton en forme d’œil cadre un bâtiment dans le village. En mode **Caméra 3D**, glissez pour tourner, utilisez le clic droit pour déplacer la vue et la molette pour zoomer. Au clavier, utilisez les flèches, `+` et `-`, et `Échap` pour revenir au jeu.

### Sauvegardes du mode autonome

AGLLM enregistre automatiquement la partie toutes les 15 secondes, à la fermeture de l’onglet et à l’arrêt du serveur. Le bouton **Sauvegarder** permet de l’enregistrer immédiatement. Le temps avance pendant que la partie est ouverte, sauf si elle est en pause.

Les sauvegardes sont liées au profil du navigateur, à l’adresse et au port. Utilisez **Options → Exporter la partie** pour télécharger une copie JSON. Pour la reprendre ailleurs, sélectionnez le fichier ou collez son contenu dans le même menu, puis cliquez sur **Remplacer la partie par cette sauvegarde**.

### Transférer du bois, du fer ou de la science

Dans **Options → Transférer du bois, du fer ou de la science**, sélectionnez un export de Kittens Game au format texte compressé ou JSON. Comparez les quantités affichées, puis choisissez le sens du transfert. AGLLM télécharge une copie à importer dans le jeu de destination. Cette copie reprend la sauvegarde de destination avec les stocks compatibles du fichier sélectionné ou de la partie AGLLM ouverte, selon le sens choisi. La conversion s’effectue dans le navigateur et laisse les fichiers d’origine intacts. Chaque jeu conserve sa propre progression, ses autres ressources et ses règles de stockage.

## Développer et tester

```powershell
npm.cmd run dev
npm.cmd test
npm.cmd run test:browser
```

Le moteur se trouve dans `src/game/`, l’interface dans `src/` et la scène Three.js dans `src/world/`. Les tests navigateur utilisent Chrome. Pour les exécuter avec Edge, définissez `$env:AGLLM_TEST_BROWSER = 'msedge'`.

Si vous utilisez Node.js en version portable, ajoutez le dossier contenant `node.exe` au `PATH` de votre terminal.
