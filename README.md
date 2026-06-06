# Richesses du Monde — Jeu multijoueur

Version en ligne du jeu de plateau **Richesses du Monde** (Lansay), pour **2 à 6 joueurs**.

## Application Windows (recommandé)

### Jouer tout de suite
Double-cliquez sur **`JOUER.bat`** :
- lance l’application si elle est déjà construite ;
- sinon ouvre le jeu dans Electron ou le navigateur.

### Créer l’installateur (une seule fois)
1. Installez [Node.js](https://nodejs.org) (LTS).
2. Double-cliquez sur **`INSTALLER.bat`**.
3. Récupérez dans le dossier **`dist/`** :
   - **`Richesses du Monde Setup …exe`** — installateur à envoyer à vos amis ;
   - **`Richesses-du-Monde-Portable-….exe`** — version sans installation.

Vos amis **installent ou lancent l’exe**, se connectent, puis entrent le **code salon** que vous leur donnez.

## Mode développeur

```bash
cd richesses-du-monde
npm install
npm run app      # fenêtre application
npm run start    # serveur seul → http://localhost:3000
npm run dist     # construire l’installateur Windows
```

## Multijoueur

1. **Hôte** : crée une partie → note le **code à 5 lettres**.
2. **Amis** : ouvrent le même jeu → **Rejoindre par code** → tapent le code.
3. Tous **Prêts** → l’hôte lance la partie.

Sur le même Wi-Fi, l’adresse locale s’affiche dans la console au démarrage du serveur.

## Mise en ligne (sans envoyer de fichier)

Guide : **[DEPLOIEMENT.md](DEPLOIEMENT.md)**

1. Poussez le projet sur **GitHub**
2. [render.com](https://render.com) → **Blueprint** → votre dépôt
3. Partagez l’URL publique + le **code salon** à vos amis

## Règles implémentées

- Parcours circulaire, 24 richesses, 144 titres
- Achat de titres, royalties, enchères, actualités, joker, douane
- Alliances, échanges, bots, faillite et victoire

## Stack

- **Node.js** (HTTP + WebSocket)
- **Electron** (application bureau Windows)
- Interface HTML/CSS/JS
