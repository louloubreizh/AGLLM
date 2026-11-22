# AnimalGame LouisLeMaitre (AGLLM)

Dans AGLLM, vous faites grandir un village d’animaux au rythme des saisons. Récoltez des vivres, du bois et de l’argile, installez vos premiers habitants et attribuez-leur des métiers. La recherche ouvre l’artisanat, le commerce, l’énergie éolienne et les expéditions. Les voyageurs vous rapportent des vestiges pour ériger le phare des migrations.

Les règles, le calendrier et les sauvegardes sont intégrés au projet. L’interface React et le village Three.js suivent la même partie.

## Lancer le jeu sous Windows

Installez Node.js 24, puis exécutez ces commandes dans le dossier d’AGLLM.

```powershell
npm.cmd ci
npm.cmd run build
.\start.cmd
```

Le jeu s’ouvre sur [127.0.0.1:8080](http://127.0.0.1:8080/). Utilisez `.\start.cmd --server-only` pour lancer uniquement le serveur et `.\stop.cmd` pour enregistrer la partie ouverte et arrêter le serveur. Pour choisir un autre port, définissez `$env:AGLLM_PORT` avant d’exécuter ces commandes.

## Premiers pas

1. Construisez un **jardin nourricier** pour produire des vivres et un **abri du sous-bois** pour accueillir de nouveaux habitants.
2. Ouvrez **Village → Métiers** pour affecter les habitants. Surveillez le bilan quotidien dans le panneau **Ressources**, surtout avant l’hiver.
3. Construisez une **maison des cartes** pour obtenir du savoir et ouvrir les premières recherches.

Le **Journal** retrace les constructions, déblocages et événements. Dans le **Campement**, le bouton en forme d’œil cadre un bâtiment dans le village. En mode **Caméra 3D**, glissez pour tourner, utilisez le clic droit pour déplacer la vue et la molette pour zoomer. Au clavier, utilisez les flèches, `+` et `-`, et `Échap` pour revenir au jeu.

## Sauvegardes

AGLLM enregistre automatiquement la partie toutes les 15 secondes, à la fermeture de l’onglet et à l’arrêt du serveur. Le bouton **Sauvegarder** permet de l’enregistrer immédiatement. Le temps avance pendant que la partie est ouverte, sauf si elle est en pause.

Les sauvegardes sont liées au profil du navigateur, à l’adresse et au port. Utilisez **Options → Exporter la partie** pour télécharger une copie JSON. Pour la reprendre ailleurs, sélectionnez le fichier ou collez son contenu dans le même menu, puis cliquez sur **Remplacer la partie par cette sauvegarde**.

À la première ouverture, AGLLM peut convertir une ancienne sauvegarde présente dans le même profil à la même adresse. Vous pouvez aussi importer son export JSON ou compressé depuis les options. La conversion reprend les données compatibles du calendrier, des stocks, des constructions, de la recherche et des habitants. Les correspondances sont adaptées aux règles d’AGLLM et le fichier d’origine est conservé. Si vous utilisiez un profil Chrome dédié, définissez `$env:AGLLM_BROWSER_PROFILE` sur le chemin de ce profil avant le lancement.

## Développer et tester

```powershell
npm.cmd run dev
npm.cmd test
npm.cmd run test:browser
```

Le moteur se trouve dans `src/game/`, l’interface dans `src/` et la scène Three.js dans `src/world/`. Les tests navigateur utilisent Chrome. Pour les exécuter avec Edge, définissez `$env:AGLLM_TEST_BROWSER = 'msedge'`.

Si vous utilisez Node.js en version portable, ajoutez le dossier contenant `node.exe` au `PATH` de votre terminal.
