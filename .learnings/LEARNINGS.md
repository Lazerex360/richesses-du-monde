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
