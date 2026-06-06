# Déployer Richesses du Monde en ligne

## L’idée en une phrase

Vous mettez le jeu sur un **serveur accessible sur Internet**. Vos amis ouvrent **le même lien** que vous dans leur navigateur, se connectent, et tapent le **code de votre partie**. Personne n’a besoin d’installer quoi que ce soit ni de recevoir un fichier.

```
Vous (hôte)                         Vos amis
     │                                    │
     ▼                                    ▼
https://mon-jeu.onrender.com    (même adresse)
     │                                    │
     ├─ Créer une partie                  ├─ Rejoindre par code
     ├─ Code salon : ABCDE  ─────────────►├─ Taper ABCDE
     └─ Lancer la partie                  └─ Jouer
```

---

## Ce dont vous avez besoin

| Élément | Pourquoi |
|---------|----------|
| Un compte **GitHub** (gratuit) | Pour héberger le code du jeu |
| Un compte **Render** (gratuit) | Pour faire tourner le jeu 24 h/24 sur Internet |
| **Node.js** sur votre PC (une fois) | Uniquement pour envoyer le code sur GitHub |

Vous n’avez **pas** besoin d’acheter un nom de domaine ni d’envoyer un `.exe` à vos amis.

---

## Méthode recommandée : Render (gratuit)

### Étape 1 — Mettre le jeu sur GitHub

GitHub, c’est comme un **cloud pour votre code**. Render va le récupérer automatiquement.

1. Créez un compte sur [github.com](https://github.com) si ce n’est pas déjà fait.
2. Ouvrez un terminal dans le dossier du jeu (`richesses-du-monde`) et tapez :

```bash
git init
git add .
git commit -m "Richesses du Monde en ligne"
```

3. Sur GitHub : **New repository** → nommez-le `richesses-du-monde` → **Create** (sans cocher README).
4. GitHub affiche des commandes ; utilisez celles pour pousser le code, par exemple :

```bash
git branch -M main
git remote add origin https://github.com/VOTRE_PSEUDO/richesses-du-monde.git
git push -u origin main
```

Remplacez `VOTRE_PSEUDO` par votre identifiant GitHub.

---

### Étape 2 — Déployer sur Render

Render **installe et lance** le serveur du jeu à partir de GitHub.

1. Allez sur [render.com](https://render.com) → **Get started** → connectez **GitHub**.
2. Cliquez **New +** → **Blueprint**.
3. Choisissez le dépôt `richesses-du-monde`.
4. Render détecte le fichier `render.yaml` (déjà dans le projet) → **Apply**.
5. Attendez 2 à 5 minutes : statut **Live** = c’est en ligne.

Render vous donne une adresse du type :

**`https://richesses-du-monde.onrender.com`**

C’est **le lien à partager** à tout le monde.

---

### Étape 3 — Jouer avec des amis

**Vous (hôte)**

1. Ouvrez votre URL Render.
2. Connectez-vous (invité ou compte).
3. **Créer une partie**.
4. Notez le **code à 5 lettres** affiché dans le salon (ex. `XK7MQ`).
5. Quand tout le monde est prêt → **Lancer la partie**.

**Vos amis**

1. Ouvrent **la même URL** (pas localhost, pas un fichier).
2. Se connectent (le mode **invité** suffit).
3. **Rejoindre par code** → entrent `XK7MQ` → **OK**.
4. Cliquent **Prêt**.

Option : dans le salon, section **Lien d’invitation** → **Copier** → envoyez le lien (vos amis rejoignent en un clic).

---

## Limites de l’offre gratuite Render

| Comportement | Explication |
|--------------|-------------|
| **Réveil lent** (~30 s) | Si personne ne joue depuis ~15 min, le serveur s’endort. La première visite le réveille. |
| **Comptes invité** | Fonctionnent toujours, idéal pour jouer entre amis. |
| **Progression sauvegardée** | Peut être réinitialisée si Render redéploie le serveur (offre gratuite, pas de disque persistant). |

Pour une utilisation occasionnelle entre amis, c’est largement suffisant.

---

## Autres hébergeurs (si vous connaissez déjà)

### Railway

1. [railway.app](https://railway.app) → **Deploy from GitHub** → dépôt `richesses-du-monde`.
2. Commande de démarrage : `node server.js`
3. Variables : `NODE_ENV=production`, `NO_TUNNEL=1`
4. **Generate domain** → partagez l’URL.

### Docker (serveur personnel / VPS)

```bash
docker build -t richesses-du-monde .
docker run -p 3000:3000 -e NODE_ENV=production -e NO_TUNNEL=1 richesses-du-monde
```

---

## Connexion Google (optionnel)

Par défaut, vos amis peuvent jouer en **invité** ou avec **e-mail** sans rien configurer.

Pour activer **Continuer avec Google** en ligne :

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → client OAuth « Application Web ».
2. **Origines JavaScript** : `https://votre-url.onrender.com`
3. **URI de redirection** : `https://votre-url.onrender.com/api/auth/google/callback`
4. Sur Render → **Environment** → ajoutez `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`.

---

## En cas de problème

| Problème | Piste |
|----------|--------|
| Le site ne charge pas | Attendez 30 s (réveil gratuit) ou vérifiez que le service est **Live** sur Render. |
| « Salon introuvable » | Vérifiez le code ; la partie doit être créée **avant** le démarrage. |
| Amis sur `localhost` | Ils doivent utiliser **votre URL Render**, pas `localhost:3000`. |
| Échec du déploiement | Onglet **Logs** sur Render ; vérifiez que `npm install` et `node server.js` passent. |

---

## Récapitulatif

1. **GitHub** → le code du jeu est en ligne.
2. **Render** → le serveur tourne et donne une URL publique.
3. **Vous** → créez une partie, donnez le code ou le lien.
4. **Amis** → même URL + code → ils jouent.

Aucun fichier à envoyer, aucune installation côté amis — seulement un lien et un code à 5 lettres.
