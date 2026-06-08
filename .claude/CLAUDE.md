# Richesses du Monde — Instructions agent

## Skills actifs

### ui-ux-pro-max
- **Trigger** : toute tâche impliquant UI, CSS, composants, design
- **Fichier** : `.claude/skills/ui-ux-pro-max/SKILL.md`
- Design system : glassmorphisme sombre, gold `#c9a04a`, accent vert `#3dd68c`
- Priorités : accessibilité (contrast 4.5:1), touch targets ≥44px, animations 150-300ms

### graphify
- **Trigger** : `/graphify`
- Génère un graphe de connaissance du codebase

### self-improving-agent
- **Trigger** : après chaque tâche non-triviale
- Loguer les apprentissages dans `.learnings/` (voir SKILL.md)

## Architecture

| Couche | Technologie | Fichier principal |
|--------|-------------|-------------------|
| Serveur | Node.js HTTP + WS | `server.js` → `src/server/` |
| Moteur de jeu | JS pur | `src/game/GameEngine.js` |
| Client | Vanilla JS | `public/js/client.js` |
| Styles | CSS custom props | `public/css/style.css` |
| Desktop | Electron | `electron/main.js` |

## Conventions importantes

- **Board** : `boardCells` (Map index→DOM) est un cache. Réinitialiser avec `boardCells = null` si le plateau change.
- **WebSocket** : tous les événements passent par `src/server/wsHandlers.js` → `GameEngine`
- **i18n** : clés dans `public/js/i18n.js` + overlays `i18n-*.js`. Test : `node test/check_integrity.js`
- **Commits** : en français, focus sur le "pourquoi"
- **Ne jamais committer** : `.env`, `data/accounts.json`, `data/sessions.json`

## Tests

```bash
node test/check_integrity.js   # 376 clés × 9 langues
node test/board_layout.js      # layout plateau
node test/board_titles.js      # 144 titres
```
