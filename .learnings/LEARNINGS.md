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
