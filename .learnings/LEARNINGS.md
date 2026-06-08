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
