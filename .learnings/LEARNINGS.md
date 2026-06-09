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
