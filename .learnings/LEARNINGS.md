# Learnings — Richesses du Monde

Format : `LRN-YYYYMMDD-NNN`

---

### LRN-20260608-001 — renderBoard rebuildait le DOM entier à chaque frame
- **Date:** 2026-06-08
- **Priority:** high
- **Status:** resolved
- **Area:** performance / rendu client
- **Related files:** `public/js/client.js`
- **Tags:** dom, board, animation, performance

**Description:** `renderBoard()` appelait `.remove()` sur toutes les `.board-cell` puis les recréait. Appelé toutes les 380ms pendant le déplacement du pion (≤12 appels/tour), ça causait un scintillement visible et un coût DOM élevé.

**Resolution:** Ajout d'un cache `boardCells` (Map index→DOM). `buildBoardCells()` crée les cellules une fois au lancement de partie ; `renderBoard()` se contente de mettre à jour `.className` et `.innerHTML` du `.pions-container` quand ça change.
Réinitialiser `boardCells = null` dans `resetGameAnimationState()` pour chaque nouvelle partie.

**Promotion candidate:** oui — règle générale : ne jamais reconstruire un sous-arbre DOM stable dans une boucle d'animation.

---

### LRN-20260608-002 — graphify AST extraction échoue sur Windows (multiprocessing spawn)
- **Date:** 2026-06-08
- **Priority:** medium
- **Status:** resolved (workaround)
- **Area:** tooling / graphify
- **Related files:** `graphify-out/merge_build.py`
- **Tags:** graphify, windows, multiprocessing, python, ast

**Description:** `graphify.extract.extract()` utilise `concurrent.futures.ProcessPoolExecutor` en interne. Sur Windows, le mode spawn de multiprocessing exige que le code appelant soit protégé par `if __name__ == '__main__':`. Quand graphify est appelé depuis un script `.py` passé en argument à Python (ex: `python graphify-out/step3a.py`), Windows tente de ré-importer ce script comme module principal dans les worker processes, déclenchant un `RuntimeError: An attempt has been made to start a new process before the current process has finished its bootstrapping phase`.

**Resolution:** Envelopper tout le code appelant `extract()` dans un bloc `if __name__ == '__main__':`. Sur ce projet, l'extraction AST a produit 0 nœuds (tous les workers ont planté) mais l'extraction sémantique via subagents Claude a compensé avec 157 nœuds complets.

**Workaround alternatif :** Passer le code via `-c "..."` inline ne déclenche pas ce bug (le `__main__` guard n'est pas requis pour le code `-c`).

**Promotion candidate:** oui — s'applique à tout script Python utilisant multiprocessing sur Windows.

---

### LRN-20260608-003 — gh CLI absent sur la machine, PR à créer manuellement
- **Date:** 2026-06-08
- **Priority:** low
- **Status:** noted
- **Area:** workflow / git
- **Tags:** gh, cli, pr, github

**Description:** `gh` (GitHub CLI) n'est pas dans le PATH Windows. Les tentatives de `gh pr create` échouent avec `CommandNotFoundException`. Les pushes git fonctionnent (HTTPS avec credentials stockés).

**Resolution:** Créer les PRs manuellement sur https://github.com/Lazerex360/richesses-du-monde/compare/main ou installer gh via `winget install --id GitHub.cli`.

---

### LRN-20260608-004 — Three.js globe trop petit : clientWidth=0 sans CSS explicite
- **Date:** 2026-06-08
- **Priority:** high
- **Status:** resolved
- **Area:** 3D / CSS / board-globe-three.js
- **Related files:** `public/js/board-globe-three.js`, `public/css/style.css`
- **Tags:** threejs, css, globe, sizing

**Description:** `.board-globe-3d` n'avait aucun CSS de sizing. Le code Three.js faisait `const size = Math.max(this.host.clientWidth || 48, 32)`. Comme `clientWidth` était 0 (élément sans dimensions CSS), le renderer était initialisé à 32×32px. Le globe était quasiment invisible. De plus, le centre du plateau (8 cols × 6 rows ≈ 740×510px) était largement sous-exploité.

**Resolution:**
1. CSS : `.board-globe-3d { width: clamp(110px, calc(var(--cell-w) * 2.5), 220px); aspect-ratio: 1; }` + canvas positionné en `absolute: inset 0`.
2. Ajout d'un `ResizeObserver` pour que le renderer Three.js réagisse aux changements de taille.
3. Halo CSS `::before` visible pendant le chargement WebGL/texture.

**Règle générale :** Toujours donner une taille CSS explicite à un `<div>` hôte Three.js — `clientWidth` sur un élément `display:block` sans dimensions est 0.

---

### LRN-20260608-005 — Frustum Three.js : r_globe > demi-frustum → clipping invisible
- **Date:** 2026-06-08
- **Priority:** medium
- **Status:** resolved
- **Area:** 3D / Three.js
- **Related files:** `public/js/board-globe-three.js`
- **Tags:** threejs, camera, frustum, perspective

**Description:** En passant de l'ancien globe (r=0.72, camera z=2.4) à la Terre texturée (r=1.0 + atmosphère r=1.13, camera z=2.6), la sphère dépassait les bords du frustum : `tan(17.5°) * 2.6 = 0.82` < `r=1.0`. Le rendu semblait OK (clipping hors canvas invisible) mais la Terre était recadrée sans qu'on s'en rende compte.

**Resolution:** Formule : `z_min = r_max / tan(FOV/2)`. Pour FOV=35°, r_atmos=1.13 : `z_min = 1.13 / tan(17.5°) = 1.13 / 0.315 ≈ 3.6`. Caméra placée à z=3.6.

**Règle générale :** Avant de changer le rayon d'une sphère Three.js, vérifier `z_cam > r / tan(FOV/2)` pour que la sphère tienne dans le frustum.

---

### LRN-20260608-006 — CSS animation re-trigger sur changement de sélecteur (`:not(.hidden)`)
- **Date:** 2026-06-08
- **Priority:** medium
- **Status:** resolved
- **Area:** CSS animations
- **Related files:** `public/css/style.css`
- **Tags:** css, animation, overlay, hidden, retrigger

**Description:** Une animation CSS sur `.winner-card { animation: winnerEntrance ... }` fire une seule fois au chargement de la page (l'élément est toujours dans le DOM, juste caché via le parent). Quand le parent `.overlay` perd sa classe `.hidden`, l'animation ne se redéclenche pas.

**Resolution:** Attacher l'animation au changement de sélecteur plutôt qu'à l'élément : `#winner-overlay:not(.hidden) > .winner-card { animation: winnerEntrance ... }`. Quand `.hidden` est retiré, le match CSS change → CSS retrigger l'animation.

**Règle générale :** Pour des animations sur des éléments toujours dans le DOM mais masqués via parent, utiliser un sélecteur conditionnel (`:not(.hidden) > .child`) plutôt qu'une règle inconditionnelle sur l'enfant.

---

### LRN-20260608-007 — Render free tier : self-ping keep-alive + WS backoff exponentiel
- **Date:** 2026-06-08
- **Priority:** high
- **Status:** implemented
- **Area:** production / Render deployment
- **Related files:** `server.js`, `public/js/client.js`
- **Tags:** render, production, websocket, keep-alive, backoff

**Description:** Sur l'offre gratuite Render, le serveur s'endort après 15 min sans trafic (cold start ~30s). Le client WebSocket reconnectait en 1.5s flat → spam de connexions pendant le cold start.

**Resolution:**
1. `server.js` : `setInterval(() => https.get(selfUrl + '/api/health'), 10 * 60 * 1000)` en production. Utilise `RENDER_EXTERNAL_URL` (injecté auto par Render) ou `PUBLIC_URL`.
2. `client.js` : backoff exponentiel `_retryDelay = Math.min(_retryDelay * 2, 30000)` — 1.5s→3s→6s→12s→30s max.
3. Bannière UI "Reconnexion en cours…" avec spinner pendant les tentatives.

**Règle générale :** Toujours implémenter backoff exponentiel sur WS reconnect (jamais de retry flat <2s). Pour Render free, un self-ping toutes les 10 min évite la mise en veille sans surcharger les logs.

---

### LRN-20260609-008 — CSS `contain: paint` clippe les faces 3D même avec `overflow: visible`
- **Date:** 2026-06-09
- **Priority:** high
- **Status:** resolved
- **Area:** CSS 3D / dice
- **Related files:** `public/css/style.css`
- **Tags:** css, contain, overflow, 3d, dice, clipping

**Description:** `contain: layout paint` avait été ajouté sur `.board-center-dice .dice-scene` pour optimiser le rendu. Même en changeant `overflow: visible` sur l'élément, les faces 3D CSS en rotation étaient coupées. `contain: paint` force le clipping au bord de l'élément indépendamment de `overflow`.

**Resolution:** Supprimer `contain: layout paint` des `.dice-scene` dans le board-center. `overflow: visible` seul est suffisant pour laisser passer les faces 3D.

**Règle générale :** `contain: paint` est équivalent à `overflow: hidden` pour le clipping — il ignore `overflow: visible`. Ne jamais l'utiliser sur des conteneurs qui ont des enfants 3D CSS qui doivent dépasser.

**Promotion candidate:** oui — applicable à tout projet CSS 3D.

---

### LRN-20260609-009 — CSS 3D dice-wild-roll : diagonale 3D dépasse overflow:hidden parent
- **Date:** 2026-06-09
- **Priority:** high
- **Status:** resolved
- **Area:** CSS 3D / layout / board center
- **Related files:** `public/index.html`, `public/css/style.css`, `public/js/client.js`
- **Tags:** css, 3d, overflow, dice, animation, clipping, board

**Description:** L'animation `dice-wild-roll` tourne le cube CSS sur 3 axes simultanément (rotateX + rotateY + rotateZ). Un cube de 52px projette en 2D jusqu'à `52 × √3 ≈ 90px` (diagonale 3D). La zone `.dice-scene` ne fait que 52px → 19px dépassent. Tant que `#board-center-dice` était imbriqué dans `.board-center` (`overflow: hidden`), les faces étaient clippées pendant la rotation.

`overflow: visible` sur les enfants (`.dice-scene`, `.dice-pair`, `.dice-roll-arena`) ne suffit pas : le premier ancêtre avec `overflow: hidden` (`.board-center`) clippe quand même.

**Resolution:** Déplacer `#board-center-dice` hors de `.board-center` dans le HTML — en enfant direct de `#board` (grid CSS, `overflow: visible`). Lui donner la même position de grille que `.board-center` via `applyBoardUi()` dans `client.js`. Résultat : aucun ancêtre `overflow: hidden` entre les dés et le viewport.

**Règle générale :** Pour des éléments CSS 3D avec rotation multi-axes dans un layout, remonter l'élément au premier ancêtre sans `overflow: hidden` dans la chaîne. On ne peut pas "percer" `overflow: hidden` avec `overflow: visible` sur un enfant — seule une restructuration HTML le permet.

**Promotion candidate:** oui — pattern architectural critique pour tout rendu 3D CSS dans un layout contraint.

---

### LRN-20260609-010 — `overflow: hidden` sur ancêtre avec `:has()` et dice area
- **Date:** 2026-06-09
- **Priority:** medium
- **Status:** resolved
- **Area:** CSS architecture / board
- **Related files:** `public/css/style.css`
- **Tags:** css, overflow, has, pseudo-class, dice, board-center

**Description:** Plusieurs tentatives de fix (`overflow: visible` sur `.board-center:has(.dice-area:not(.hidden))`), padding-bottom excessif (1.8rem), `justify-content: space-between` → aucune n'a résolu le problème de clipping des dés. La vraie cause était structurelle : l'élément des dés était dans le mauvais conteneur HTML.

**Resolution:** Voir LRN-20260609-009. Les fixes CSS temporaires (overflow, padding, contain) masquaient le problème sans le résoudre. Le diagnostic correct était : trouver le premier ancêtre `overflow: hidden` dans la chaîne de parenté de l'élément clippé.

**Règle générale :** Face à du clipping CSS inexpliqué sur un élément 3D, remonter la chaîne `parentElement` jusqu'au premier `overflow: hidden` — c'est toujours lui le coupable. Checker via DevTools : computed style → overflow sur chaque ancêtre.

---

### LRN-20260609-011 — `gameState` global écrasé pendant une animation différée → carte Actualité jamais affichée
- **Date:** 2026-06-09
- **Priority:** high
- **Status:** resolved
- **Area:** client / animations / synchronisation état
- **Related files:** `public/js/client.js`
- **Tags:** race-condition, gameState, websocket, animation, news, bot

**Description:** La carte "Actualité" ne s'affichait jamais (son effet financier était bien appliqué côté serveur, mais aucune carte ne se montrait à l'écran). `socket.on('game_state', ...)` réassigne `gameState = state` à CHAQUE broadcast, même si l'animation du pion (déplacement + pause d'arrivée, ~3-7s avec `PAWN_STEP_MS=380` × N cases + `PAWN_POST_ARRIVE_MS=1200`) déclenchée par le broadcast PRÉCÉDENT tourne encore. Pour une case Actualité, `resolveLanding`/`drawNews` ne pose pas de `pendingAction` → `phase='end_turn'` immédiatement, et pour un bot, `BOT_DELAYS.endTurn=2600ms` (roomHub) est souvent PLUS COURT que l'animation côté client. Un 2e broadcast (avec `currentPlayerIndex` déjà avancé sur le joueur suivant, `endTurn()` exécuté côté serveur) écrase donc `gameState` PENDANT que l'animation du 1er broadcast tourne encore. Quand cette animation se termine et appelle `flushPendingNewsReveal()`, `shouldDeferNewsReveal` re-dérivait "le joueur qui a tiré la carte est-il sur Actualité ?" via `playerLandedOnNews(gameState)` — qui pointe maintenant vers un AUTRE joueur sur une AUTRE case → toujours faux → `pendingNewsReveal` jamais vidé → carte jamais montrée, indéfiniment.

**Resolution:** Suppression de `playerLandedOnNews()` et de la re-dérivation depuis `gameState`. `shouldDeferNewsReveal(nr)` ne dépend plus que de `nr.id > lastNewsRevealId` + `isGameSequenceActive()` (on attend juste la fin des animations). Pour ne pas rejouer une carte déjà ancienne lors d'une (re)connexion en cours de partie, `lastNewsRevealId` est désormais initialisé une seule fois (`newsRevealBaselined`) à l'id de `state.newsReveal` reçu au tout premier `game_state` de la session/partie (réinitialisé dans `resetGameAnimationState()`).

**Règle générale :** Ne jamais re-dériver une condition de timing ("est-ce que X est encore vrai *maintenant* ?") depuis une variable d'état globale mutable, lue à l'intérieur d'un callback différé (`setTimeout`/animation). Cette variable peut avoir été remplacée par un événement plus récent et sans rapport pendant l'attente. Ce qui doit être vérifié au flush, c'est uniquement ce qui était vrai au moment de l'événement original (ici : l'id du tirage) + un flag "animation en cours" — pas un recalcul depuis l'état courant.

**Promotion candidate:** oui — pattern général "stale closure vs. fresh global mutable state pendant une animation différée", applicable à toute UI pilotée par WebSocket avec broadcasts fréquents (bots, autres joueurs) et animations asynchrones.

---

### LRN-20260609-012 — Edit tool refuse "File has not been read yet" même après un Grep sur ce fichier
- **Date:** 2026-06-09
- **Priority:** low
- **Status:** resolved
- **Area:** outillage / workflow agent
- **Related files:** `public/js/i18n-de.js`, `i18n-it.js`, `i18n-ja.js`, `i18n-ko.js`, `i18n-pt.js`, `i18n-zh.js`
- **Tags:** tooling, edit-tool, i18n, workflow

**Description:** Tentative d'`Edit` sur 6 fichiers `i18n-*.js` après les avoir seulement grep-és (pour localiser `'action.no_titles'` et insérer une clé juste après) → erreur "File has not been read yet" sur chacun. `Grep` ne compte pas comme `Read` pour la précondition de l'outil `Edit`.

**Resolution:** Lire (même un petit extrait, ex. les 4 lignes autour du point d'insertion) chaque fichier avec `Read` avant `Edit`, même si son contenu a déjà été vu via `Grep`. Les 6 edits sont passés du premier coup après ce `Read` ciblé.

**Règle générale :** Avant tout `Edit` sur N fichiers similaires (overlays i18n, configs dupliquées...), faire un `Read` ciblé (petite plage de lignes autour du point d'insertion) sur CHAQUE fichier d'abord — ne pas se fier à un `Grep` global précédent.

**Promotion candidate:** non — spécifique au fonctionnement de l'outil Edit.

---

### LRN-20260609-013 — Deux bugs "indépendants" (titres restants / solde insuffisant) = un seul bug racine : modale d'achat figée
- **Date:** 2026-06-09
- **Priority:** high
- **Status:** resolved
- **Area:** gameplay / achat de titres / gestion d'erreurs
- **Related files:** `public/js/client.js`, `src/server/wsHandlers.js`, `src/game/GameEngine.js`
- **Tags:** root-cause, pendingAction, freeze, error-handling, websocket, buy-titles

**Description:** Bug rapporté séparément : "après un achat sur une case, les autres joueurs ne peuvent pas acheter les titres restants de cette même case". Semblait pointer vers le moteur (`getAvailableTitles`/`setupBuyAction`/`buyTitles`). Audit complet de ces 3 fonctions : `getAvailableTitles` recalcule `deck[countryId].filter(t => !t.ownerId)` à CHAQUE atterrissage, sans aucun flag "case visitée" — déjà correct. Le vrai coupable était un autre bug : `buy_titles` avec solde insuffisant renvoie `{error: 'Fonds insuffisants...'}`, transmis au client via `error_msg` (string brute, pas de re-broadcast d'état). Le client fermait la modale immédiatement (`confirmBtn.onclick` appelait `hideBuyTitlesOverlay()` AVANT la réponse serveur), laissant `pendingAction='buy_titles'` bloqué pour toujours côté serveur. Conséquence : `endTurn()` renvoie `'Action en attente'` indéfiniment → `currentPlayerIndex` ne bouge plus jamais → AUCUN joueur (y compris ceux qui voudraient les titres restants de n'importe quelle case) ne rejoue jamais.

**Resolution:** Le fix "solde insuffisant" (modale qui reste ouverte, message inline `action.insufficient_funds`, re-rendu via `renderBuyTitlesOverlay(action, {errorMsg})`, titres inabordables désactivés/grisés côté client, sélection bornée au budget) résout aussi le bug "titres restants" : le tour se termine normalement dès qu'un achat valide ou `skip` est envoyé, donc les titres non vendus (déjà correctement gérés par le moteur) redeviennent accessibles aux joueurs suivants.

**Règle générale :** Avant d'investiguer un bug "le moteur calcule mal X", vérifier d'abord si une AUTRE action peut avoir laissé `pendingAction`/`phase` dans un état bloquant qui empêche `endTurn()` pour le reste de la partie. Un freeze de tour (souvent causé par un chemin `{error: ...}` non géré côté client) peut se manifester comme N "bugs fonctionnels" en apparence indépendants. Lister TOUS les retours `{error: ...}` du moteur et vérifier que le client gère chacun sans laisser de modale/état local désynchronisé du serveur.

**Promotion candidate:** oui — heuristique de triage applicable à toute UI synchronisée par état serveur autoritaire (chercher le freeze avant de chercher la feature manquante).

---

### LRN-20260610-014 — Appel orphelin survivant à la suppression d'une fonction : `setLanguage()` cassée silencieusement depuis 852ecde
- **Date:** 2026-06-10
- **Priority:** high
- **Status:** resolved
- **Area:** client / i18n / qualité
- **Related files:** `public/js/client.js`, `test/check_integrity.js`
- **Tags:** dead-reference, refactoring, i18n, runtime-error, test-gap

**Description:** En vérifiant le re-rendu de la carte des richesses au changement de langue (hook `applyLanguage`), `setLanguage('en')` levait `ReferenceError: renderAuthLanguageButtons is not defined`. `git log -S` montre que le commit 852ecde ("Corrige audit complet") a supprimé la DÉFINITION de `renderAuthLanguageButtons()` mais a laissé son APPEL à la fin de `setLanguage()`. Depuis ce commit, tout changement de langue plantait en fin de fonction (les étapes précédentes — saveSettings, applyLanguage, MAJ des selects — s'exécutaient, donc le bug était quasi invisible à l'œil : seule la console révélait l'erreur, et tout code appelant `setLanguage()` puis continuant aurait été interrompu).

**Resolution:** Suppression de l'appel orphelin (1 ligne). Vérifié ensuite : bascule fr→en→ja→fr sans erreur, overlays re-rendus.

**Règle générale :** `node --check` et `test/check_integrity.js` ne détectent PAS les références à des fonctions supprimées (erreur d'exécution, pas de parse). Après suppression d'une fonction dans client.js, toujours grep son nom pour traquer les appels restants. Piste d'amélioration du test d'intégrité : extraire les `nomFonction(` appelés et vérifier qu'une `function nomFonction` existe (faisable car client.js est un script global sans imports).

**Promotion candidate:** non — hygiène de refactoring standard, mais la piste "linter d'appels orphelins dans check_integrity" vaut le coup si ça se reproduit.

---

### LRN-20260610-015 — `max-age=3600` sans ETag/Last-Modified : les clients gardent un JS périmé 1h sans possibilité de revalidation
- **Date:** 2026-06-10
- **Priority:** medium
- **Status:** resolved
- **Area:** serveur / cache HTTP / déploiement
- **Related files:** `src/server/` (serveur statique), `public/js/*.js`
- **Tags:** http-cache, cache-control, etag, deploy, stale-assets

**Description:** Pendant la vérification navigateur de la carte des richesses, le client a continué d'exécuter l'ANCIEN client.js après modification du fichier et reload — `fetch('/js/client.js', {cache:'no-store'})` prouvait pourtant que le serveur servait bien la nouvelle version. Cause : le serveur statique envoie `cache-control: public, max-age=3600` SANS ETag NI Last-Modified. Un reload normal réutilise donc l'entrée de cache pendant 1h sans même une requête conditionnelle (impossible : aucun validateur). En production, après un déploiement, les joueurs peuvent garder un client.js incompatible avec le serveur jusqu'à 1h (ex : nouveaux événements WS non gérés). Un service worker enregistré aggravait le cas en dev.

**Resolution (contournement vérif):** `navigator.serviceWorker.getRegistrations()→unregister()` + `caches.delete()` + `fetch(url, {cache:'reload'})` (force la MAJ de l'entrée de cache HTTP) puis `location.reload()`.

**Resolution (fix serveur, 2026-06-10):** `createStaticHandler` (src/server/httpUtils.js) envoie désormais un ETag faible (taille+mtime en hexa) et `Last-Modified` (fs.stat) sur toutes les réponses statiques, et répond 304 sur `If-None-Match` / `If-Modified-Since`. HTML/CSS/JS passent en `cache-control: no-cache` (revalidation systématique, quasi gratuite via 304) ; les autres assets (images) reçoivent explicitement `public, max-age=3600` pour éviter le cache heuristique induit par Last-Modified. Vérifié par curl : 200 avec validateurs, 304 sur requête conditionnelle (ETag et date), 200 sur ETag périmé.

**Règle générale :** Ne jamais servir des assets mutables (non fingerprintés) avec `max-age` long sans validateur (ETag/Last-Modified) : le navigateur n'a alors AUCUN moyen de revalider avant expiration, même sur F5. `max-age` long = uniquement pour des URLs versionnées/immuables.

**Promotion candidate:** oui — règle de config serveur statique universelle.

---

### LRN-20260610-016 — E2E Playwright sans téléchargement Chromium : channel msedge + données isolées + toggles WS à confirmer
- **Date:** 2026-06-10
- **Priority:** medium
- **Status:** resolved
- **Area:** tests E2E / infrastructure
- **Related files:** `playwright.config.js`, `test/e2e/partie.spec.js`, `src/data/accounts.js`
- **Tags:** playwright, e2e, msedge, websocket, flaky, isolation

**Description:** Trois obstacles en montant les E2E : (1) `npx playwright install chromium` bloqué à 0 Mo pendant 8+ min — CDN joignable (HEAD répond) mais le GET volumineux ne démarre jamais sur ce réseau ; (2) `RDM_USER_DATA` seul ne suffit PAS à isoler les données de test : config.js rabat `RDM_BUNDLE_DATA` sur `data/` réel et `seedDataFile` aurait COPIÉ les vrais comptes dans test-results/ ; (3) deux flakes successifs dans le parcours lobby : l'overlay tutoriel (premier lancement invité) intercepte tous les clics du hub, puis un `toggle_ready` d'un des deux clients s'est perdu (bouton resté « En attente » côté serveur) alors que le `click()` Playwright avait réussi.

**Resolution:** (1) `channel: process.env.E2E_CHANNEL || 'msedge'` — Edge est toujours présent sous Windows, zéro téléchargement ; (2) pointer `RDM_BUNDLE_DATA` explicitement sur le même dossier de test (vide) → seed `{}` ; (3) helper `setReady()` : clic puis attente de la classe `is-ready` (posée uniquement au retour du broadcast `room_update`), avec retry via `expect(...).toPass()` — et skip systématique du tutoriel dans le helper de login.

**Règle générale :** Pour des E2E sur UI synchronisée par WebSocket, ne JAMAIS considérer qu'un `click()` réussi = action appliquée : cliquer puis attendre l'indicateur d'état que seul le serveur peut produire (classe/texte issu du broadcast), avec retry. Et pour tout flux « premier lancement », chercher d'abord les overlays d'onboarding qui interceptent les clics (`aria-modal`) avant de déboguer le reste.

**Promotion candidate:** oui — patterns applicables à tout projet E2E temps-réel (clic-confirmé-par-état + onboarding + channel système).

---

### LRN-20260611-017 — Modules examples/jsm de Three.js via CDN : sans import map, TOUT le graphe de modules meurt en silence
- **Date:** 2026-06-11
- **Priority:** high
- **Status:** resolved
- **Area:** client / ES modules / Three.js
- **Related files:** `public/index.html`, `public/js/board-globe-three.js`, `public/js/dice-webgl.js`, `public/js/ambient-3d.js`
- **Tags:** importmap, three.js, es-modules, cdn, silent-failure

**Description:** Le globe 3D, les dés WebGL et le fond ambiant étaient tous morts (aucun canvas, `RdmBoardGlobe`/`RdmAmbient3D`/`RdmDiceWebgl` undefined) depuis le commit qui avait introduit le bloom. Aucune erreur visible dans la console au moment des captures. Cause : les fichiers `three/examples/jsm/*` du CDN (EffectComposer, UnrealBloomPass, RoundedBoxGeometry…) font `import ... from 'three'` — un spécificateur nu. Sans `<script type="importmap">` qui mappe `"three"` vers l'URL CDN, la résolution échoue et le navigateur rejette TOUT le graphe d'import : le module entrant ne s'exécute jamais, donc aucun global n'est posé. Diagnostic obtenu seulement via `import('/js/board-globe-three.js')` dynamique qui a fait remonter `Failed to resolve module specifier "three"`.

**Resolution:** Import map ajouté avant les scripts module dans index.html : `{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js" } }`.

**Règle générale :** Dès qu'un module ES importe un paquet par nom (spécificateur nu) côté navigateur, un import map est obligatoire — et une erreur de résolution tue silencieusement tout le graphe, pas seulement le fichier fautif. Pour diagnostiquer un module « mort sans erreur », faire un `import()` dynamique dans la console : lui remonte l'exception.

**Promotion candidate:** oui — piège universel des apps no-bundler qui consomment des CDN ESM.

---

### LRN-20260611-018 — `Promise.all` sur des textures CDN : un seul 404 annule toutes les autres ; le paquet npm three-globe ne contient pas earth-clouds.png
- **Date:** 2026-06-11
- **Priority:** medium
- **Status:** resolved
- **Area:** client / Three.js / assets CDN
- **Related files:** `public/js/board-globe-three.js`
- **Tags:** three.js, textures, cdn, promise-all, 404, graceful-degradation

**Description:** Le globe restait une sphère bleue unie : `texturesLoaded` ne passait jamais à true. Les 5 textures étaient chargées dans un `Promise.all`, et `earth-clouds.png` renvoyait 404 sur le CDN npm (`cdn.jsdelivr.net/npm/three-globe/...`) — le PAQUET npm ne distribue pas cette image, seul le dépôt GitHub l'a (`cdn.jsdelivr.net/gh/vasturiano/three-globe@master/example/clouds/clouds.png`, ~5 Mo). Le rejet unique a donc jeté les 4 textures valides déjà téléchargées.

**Resolution:** Chargement indépendant par texture avec `.then()` individuels et catch propres : la Terre s'affiche dès que sa diffuse arrive, normal/specular/night s'appliquent en bonus, les nuages sont optionnels (et sautés en palier « lite »).

**Règle générale :** Pour des assets visuels optionnels, ne jamais agréger avec `Promise.all` (sémantique tout-ou-rien) : charger indépendamment et dégrader gracieusement. Et vérifier qu'un fichier d'exemple existe bien dans le PAQUET npm avant de pointer le CDN npm — beaucoup de repos excluent leurs exemples du paquet publié.

**Promotion candidate:** oui — pattern de dégradation gracieuse applicable à tout chargement d'assets.

---

### LRN-20260611-019 — preview_screenshot qui timeout à répétition : le viewport du panneau preview peut faire 2 px de large
- **Date:** 2026-06-11
- **Priority:** medium
- **Status:** resolved
- **Area:** outillage / Claude preview
- **Related files:** (outillage, pas le projet)
- **Tags:** preview, viewport, screenshot-timeout, elementFromPoint

**Description:** Tous les `preview_screenshot` expiraient à 30 s, et `elementFromPoint` renvoyait null partout, sur plusieurs sessions. Cause découverte via `innerWidth` : le viewport du panneau preview faisait 2 px de large (`{w:2,h:730}`) — la fenêtre n'avait jamais été dimensionnée. Rien ne « plantait » : la page rendait dans 2 pixels.

**Resolution:** `preview_resize {width:1280, height:800}` explicite en début de session de vérification, puis re-tester. Quand les captures échouent malgré tout, les preuves texte (`preview_eval` sur computed styles, `elementFromPoint`, `scrollWidth`) suffisent.

**Règle générale :** Avant de déboguer une page « cassée » dans le preview, vérifier `innerWidth/innerHeight` : un viewport dégénéré mime parfaitement un bug de rendu. Toujours `preview_resize` explicite avant toute vérification visuelle.

**Promotion candidate:** non — spécifique à l'outillage preview, mais à retenir pour ce poste de travail.

---

### LRN-20260611-020 — `ws.onmessage` avec try/catch global : toute exception d'un handler de jeu est avalée, le tour se fige sans AUCUNE erreur visible
- **Date:** 2026-06-11
- **Priority:** high
- **Status:** resolved
- **Area:** client / WebSocket / robustesse
- **Related files:** `public/js/client.js` (GameSocket.onmessage, startDicePhysics)
- **Tags:** websocket, error-swallowing, silent-failure, defensive-coding, e2e

**Description:** Après l'ajout des dés matter.js, l'E2E « deux joueurs » échouait de façon reproductible : le tour ne se terminait jamais, sans la moindre erreur console. Cause structurelle : `ws.onmessage` enveloppe TOUT le dispatch dans `try { ... } catch (_) {}` — si un handler (ici la chaîne game_state → showDiceResult → startDicePhysics) jette, le reste du handler (rendu des panneaux d'action) est silencieusement abandonné. Le jeu paraît « gelé » alors qu'une seule frame de logique a été perdue.

**Resolution:** Tout code cosmétique appelé depuis un handler WS (physique des dés, FX) est isolé dans son propre try/catch : un échec d'animation ne peut plus interrompre la logique de jeu. E2E redevenu vert immédiatement.

**Règle générale :** Quand un bus d'événements avale les exceptions globalement, chaque effet « optionnel » (visuel, son, analytics) appelé dans un handler doit attraper ses propres erreurs — sinon le premier échec cosmétique sacrifie la logique critique qui le suit, sans laisser de trace. Symptôme typique : « ça se fige sans erreur ».

**Promotion candidate:** oui — vaut pour tout client temps-réel avec dispatch try/catché.

---

### LRN-20260611-021 — showScreen est asynchrone (setTimeout 80 ms) : lire `.screen.active` juste après une action donne l'ANCIEN écran
- **Date:** 2026-06-11
- **Priority:** medium
- **Status:** resolved
- **Area:** client / vérification automatisée
- **Related files:** `public/js/client.js` (showScreen)
- **Tags:** async-ui, verification, false-negative, preview

**Description:** En vérifiant le mode hors-ligne, `RdmOffline.start()` semblait échouer « au premier appel seulement » : lecture de `document.querySelector('.screen.active')` immédiatement après → toujours l'ancien écran. Faux bug : la transition d'écran pose la classe `active` dans un `setTimeout(…, 80)` (cross-fade). Toute assertion synchrone juste après l'action est donc fausse par construction. Un vrai bug distinct existait aussi : l'init asynchrone (`tryRestoreSession`) ré-affichait screen-auth par-dessus la partie locale lancée entre-temps (corrigé par un garde `RdmOffline.active`).

**Resolution:** Vérifier l'état d'écran après un délai (>150 ms) ou via polling ; et garder l'init d'auth de ne pas écraser un écran de jeu local déjà actif.

**Règle générale :** Avant de conclure qu'une action UI « ne fait rien », vérifier si le changement d'état est différé (transitions, rAF, setTimeout). Lire l'état tout de suite après l'action mesure l'implémentation de la transition, pas le résultat.

**Promotion candidate:** non — mais réflexe utile pour toute vérification preview/E2E.

---

### LRN-20260612-017 — Faux négatif sur la carte Actualité : pollution d'état via appels manuels `revealNewsCard()` en debug
- **Date:** 2026-06-12
- **Priority:** medium
- **Status:** resolved
- **Area:** debug / preview testing
- **Related files:** `public/js/client.js`
- **Tags:** debug, false-positive, news, preview_eval, state-pollution

**Description:** Pour auditer un signalement « la carte Actualité ne s'affiche plus », j'ai appelé directement `window.revealNewsCard({id: 9999, ...})` plusieurs fois via `preview_eval` pour vérifier l'affichage hors contexte de jeu. Ça fonctionnait visuellement, MAIS ces appels font `lastNewsRevealId = 9999/10001/.../20001` (variable globale partagée avec la vraie logique de jeu). En jouant ensuite une vraie partie et en tirant une carte réelle (`id: 1`), `handleNewsReveal` faisait `if (nr.id <= lastNewsRevealId) return;` → toujours vrai (1 ≤ 20001) → carte jamais affichée. Résultat : un faux « bug reproduit » alors que c'était un artefact de mes propres tests.

**Resolution:** `window.location.reload()` avant de rejouer une vraie partie, pour réinitialiser tous les `let` de session (`lastNewsRevealId`, `newsRevealBaselined`, etc.) — après reload, `newsRevealBaselined` se rebaseline sur l'id réel du `state.newsReveal` courant, donc le test redevient valide.

**Règle générale :** Quand on appelle manuellement des fonctions de rendu/affichage qui mettent à jour un compteur "déjà vu" (anti-replay, dédup, curseur), TOUJOURS recharger la page avant de tester le flux réel — sinon le compteur pollué masque silencieusement le vrai comportement.

**Conclusion de l'audit:** la carte Actualité fonctionne correctement avec le code actuel (testé en partie réelle, 2 tirages distincts affichés correctement). Si le bug persiste côté utilisateur, cause probable = cache navigateur/SW d'un `client.js` antérieur aux correctifs (`0144a8b`, `b9fc7e5`, `3ac5af8`) — cf. LRN-015.

**Promotion candidate:** oui — pattern réutilisable pour tout debug via `preview_eval` touchant des compteurs anti-replay/session.

---

### LRN-20260614-022 — `preview_click` sur `#btn-offline` après `location.reload()` ne déclenche pas `RdmOffline.start()` (échec silencieux)
- **Date:** 2026-06-14
- **Priority:** low
- **Status:** resolved
- **Area:** preview testing / mode hors-ligne
- **Related files:** `public/js/client.js`, `public/js/offline-game.js`
- **Tags:** preview_click, false-negative, reload, offline-mode

**Description:** En vérifiant la feature "difficulté des bots", après un `location.reload()` puis `preview_click('#btn-offline')`, l'écran restait sur `screen-auth` et `window.RdmOffline.active` valait `false` — sans aucune erreur console (le moteur `window.RdmEngine` était bien chargé). Le même clic juste après le premier chargement de page avait fonctionné (transition vers `screen-lobby`). Appeler directement `window.RdmOffline.start({name:'Test'})` via `preview_eval` a fonctionné immédiatement (`active: true`, transition vers `screen-lobby`).

**Resolution:** Après un `location.reload()` dans `preview_eval`, ne pas enchaîner immédiatement un `preview_click` sur un bouton d'action critique pour la suite du test — soit attendre/poller que la page soit interactive, soit appeler directement la fonction JS exposée (ex. `window.RdmOffline.start(...)`) pour fiabiliser la vérification.

**Règle générale :** `preview_click` juste après un `reload()` peut échouer silencieusement (probablement un souci de timing/attachement des handlers ou de focus de la page rechargée). Pour les actions pivot d'un scénario de vérification, préférer l'appel direct à l'API JS exposée par le module (`window.Xxx.method(...)`) plutôt qu'un clic DOM, surtout juste après un reload.

**Promotion candidate:** non — astuce ponctuelle pour la vérification preview, pas un pattern de code applicatif.
