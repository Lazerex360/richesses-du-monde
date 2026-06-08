# Graph Report - .  (2026-06-08)

## Corpus Check
- 89 files · ~195,762 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 157 nodes · 139 edges · 44 communities (16 shown, 28 thin omitted)
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Accounts & Progression|Accounts & Progression]]
- [[_COMMUNITY_Room Hub & Game Lobby|Room Hub & Game Lobby]]
- [[_COMMUNITY_Deployment & DevOps|Deployment & DevOps]]
- [[_COMMUNITY_i18n & Localization|i18n & Localization]]
- [[_COMMUNITY_Client UI & 3D Rendering|Client UI & 3D Rendering]]
- [[_COMMUNITY_Board Data & Resources|Board Data & Resources]]
- [[_COMMUNITY_Data Stores & Electron|Data Stores & Electron]]
- [[_COMMUNITY_UIUX Skill Search Engine|UI/UX Skill Search Engine]]
- [[_COMMUNITY_Game Engine Core|Game Engine Core]]
- [[_COMMUNITY_Dice & Cinematic Mode|Dice & Cinematic Mode]]
- [[_COMMUNITY_DOM Cache Performance|DOM Cache Performance]]
- [[_COMMUNITY_Google OAuth Flow|Google OAuth Flow]]
- [[_COMMUNITY_HTTP Auth Utilities|HTTP Auth Utilities]]
- [[_COMMUNITY_Project Config & Claude|Project Config & Claude]]
- [[_COMMUNITY_Module Group 15|Module Group 15]]
- [[_COMMUNITY_Module Group 16|Module Group 16]]
- [[_COMMUNITY_Module Group 17|Module Group 17]]
- [[_COMMUNITY_Module Group 18|Module Group 18]]
- [[_COMMUNITY_Module Group 19|Module Group 19]]
- [[_COMMUNITY_Module Group 20|Module Group 20]]
- [[_COMMUNITY_Module Group 21|Module Group 21]]
- [[_COMMUNITY_Module Group 23|Module Group 23]]
- [[_COMMUNITY_Module Group 24|Module Group 24]]
- [[_COMMUNITY_Module Group 25|Module Group 25]]
- [[_COMMUNITY_Module Group 27|Module Group 27]]
- [[_COMMUNITY_Module Group 28|Module Group 28]]
- [[_COMMUNITY_Module Group 29|Module Group 29]]
- [[_COMMUNITY_Module Group 30|Module Group 30]]
- [[_COMMUNITY_Module Group 31|Module Group 31]]
- [[_COMMUNITY_Module Group 32|Module Group 32]]
- [[_COMMUNITY_Module Group 33|Module Group 33]]
- [[_COMMUNITY_Module Group 34|Module Group 34]]
- [[_COMMUNITY_Module Group 35|Module Group 35]]
- [[_COMMUNITY_Module Group 36|Module Group 36]]
- [[_COMMUNITY_Module Group 37|Module Group 37]]
- [[_COMMUNITY_Module Group 38|Module Group 38]]
- [[_COMMUNITY_Module Group 39|Module Group 39]]
- [[_COMMUNITY_Module Group 40|Module Group 40]]
- [[_COMMUNITY_Module Group 41|Module Group 41]]
- [[_COMMUNITY_Module Group 42|Module Group 42]]
- [[_COMMUNITY_Module Group 43|Module Group 43]]

## God Nodes (most connected - your core abstractions)
1. `accounts.js — account & session store` - 10 edges
2. `handleMessage` - 10 edges
3. `GameEngine class` - 9 edges
4. `window.TR - i18n translation dictionary (FR/EN/ES base)` - 7 edges
5. `RoomHub.broadcastRoom` - 7 edges
6. `index.html — single-page app entry point` - 7 edges
7. `createApiHandler()` - 6 edges
8. `search() - main search with auto-domain detection` - 5 edges
9. `RoomHub.broadcastLobbyList` - 5 edges
10. `Richesses du Monde — multiplayer board game project` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Physical board game: Richesses du Monde (Lansay) full contents photo` --semantically_similar_to--> `Game rules: 24 richesses, 144 titres, alliances, auctions, customs, joker`  [INFERRED] [semantically similar]
  public/img/board-game.jpg → README.md
- `loadGoogleConfig` --references--> `Project agent instructions (CLAUDE.md)`  [INFERRED]
  src/server/googleAuth.js → .claude/CLAUDE.md
- `Richesses du Monde — multiplayer board game project` --references--> `Physical board game: Richesses du Monde (Lansay) full contents photo`  [INFERRED]
  README.md → public/img/board-game.jpg
- `Reference image: title card racks with resource royalty percentages and prices` --references--> `Game rules: 24 richesses, 144 titres, alliances, auctions, customs, joker`  [INFERRED]
  public/img/51AUr14gHkL-ref.jpg → README.md
- `Auth screen (Google + email + guest login)` --references--> `Google OAuth optional login configuration`  [INFERRED]
  public/index.html → DEPLOIEMENT.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **WebSocket message handling pipeline** — server_wsupgrade_acceptwebsocket, server_wshandlers_handlemessage, server_roomhub_broadcastroom, server_roomhub_roomhub [INFERRED 0.95]
- **Test suite for board and i18n integrity** — test_board_layout_boardlayouttest, test_board_titles_boardtitlestest, test_check_integrity_checkintegrity, test_simulate_rungame [INFERRED 0.85]
- **Google OAuth flow** — server_googleauth_loadgoogleconfig, server_googleauth_newgooglestate, server_googleauth_consumegooglestate, server_googleauth_httpspostform, server_googleauth_decodejwtpayload [EXTRACTED 1.00]

## Communities (44 total, 28 thin omitted)

### Community 0 - "Accounts & Progression"
Cohesion: 0.16
Nodes (15): accounts.js — account & session store, getProfile(), BATTLE_PASS tiers, computeLevel(), computeMatchReward(), computePassProgress(), getPromo(), getCosmetic() (+7 more)

### Community 1 - "Room Hub & Game Lobby"
Cohesion: 0.19
Nodes (16): RoomHub.applyCosmeticsToGamePlayer, RoomHub.awardRewards, RoomHub.botEvaluateTrade, RoomHub.broadcastLobbyList, RoomHub.broadcastRoom, RoomHub.leaveRoom, RoomHub.maybeScheduleBot, RoomHub.maybeStartCountdown (+8 more)

### Community 2 - "Deployment & DevOps"
Cohesion: 0.15
Nodes (14): Agent rule: auto-commit and push after each code task, GitHub repository hosting for source code, Google OAuth optional login configuration, Deployment on Render (free tier), Reference image: title card racks with resource royalty percentages and prices, Reference image: back of box showing full board layout and game contents, Reference image: full game contents spread (same as board-game.jpg), Physical board game: Richesses du Monde (Lansay) full contents photo (+6 more)

### Community 3 - "i18n & Localization"
Cohesion: 0.20
Nodes (12): 9 supported languages: fr, en, es, de, it, pt, ko, zh, ja, check_integrity.js: 366 keys × 9 langs parity test, i18n keys: resources.search_ph, meta_count, expand_all, collapse_all, no_results, Resources panel i18n implementation plan (2026-06-05), index.html — single-page app entry point, data-i18n / data-i18n-ph attribute pattern for i18n binding, 3D dice system (dice3d.js, dice-webgl.js), Resources overlay (search, expand/collapse, richesses list) (+4 more)

### Community 4 - "Client UI & 3D Rendering"
Cohesion: 0.20
Nodes (11): resources.json - game resources (commodities with country titles & royalties), RdmAmbient3D - cinematic 3D background (stars, globe, bloom), RdmBoardGlobe - mini Three.js globe for board center, showScreen() - screen routing with cinematic mode integration, i18n-de.js - German translations overlay, i18n-it.js - Italian translations overlay, i18n-ja.js - Japanese translations overlay, i18n-ko.js - Korean translations overlay (+3 more)

### Community 5 - "Board Data & Resources"
Cohesion: 0.25
Nodes (5): BOARD — board definition & layout, BOARD_POSITIONS — grid coordinates, NEWS_CARDS array, RESOURCES — 24 world resources, GameEngine class

### Community 6 - "Data Stores & Electron"
Cohesion: 0.25
Nodes (8): accounts.json - Player account store, promo_usage.json - Promo code redemption store, sessions.json - Session token to account ID mapping, createWindow() - BrowserWindow creation, Electron main process - app bootstrap, seedUserData() - copy bundled data to userData, startServer() - fork Node.js server process, richesses-du-monde package.json - project metadata

### Community 7 - "UI/UX Skill Search Engine"
Cohesion: 0.32
Nodes (8): BM25 Search Engine, detect_domain() - auto-detect query domain, search() - main search with auto-domain detection, search_stack() - stack-specific guidelines search, DesignSystemGenerator class, generate_design_system() entry point, persist_design_system() - Master+Overrides pattern, search.py CLI entry point

### Community 8 - "Game Engine Core"
Cohesion: 0.29
Nodes (5): getRoyaltyAmount(), playBotStep(), GameEngine.resolveLanding(), GameEngine.rollDice(), GameEngine.tryPayRoyalties()

### Community 9 - "Dice & Cinematic Mode"
Cohesion: 0.40
Nodes (5): window.RdmCinematic - global cinematic state bridge, Settings system - cinematicMode, reduceMotion, i18n, sound, dice3d.js - CSS 3D dice with pip layout and skin support, RdmDiceWebgl - WebGL Three.js dice renderer, RdmFx.confetti - DOM confetti victory effect

### Community 10 - "DOM Cache Performance"
Cohesion: 0.67
Nodes (3): boardCells Map (index→DOM cache), buildBoardCells() — one-time DOM build, LRN-20260608-001: renderBoard DOM cache fix

### Community 11 - "Google OAuth Flow"
Cohesion: 0.67
Nodes (3): consumeGoogleState, googleStates (Map), newGoogleState

### Community 12 - "HTTP Auth Utilities"
Cohesion: 0.67
Nodes (3): authFromReq, requireAuth, sendJson

## Knowledge Gaps
- **82 isolated node(s):** `Self-Improvement Activator Hook`, `BM25 Search Engine`, `search_stack() - stack-specific guidelines search`, `detect_domain() - auto-detect query domain`, `format_output() - token-optimized output formatter` (+77 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GameEngine class` connect `Board Data & Resources` to `Game Engine Core`, `Accounts & Progression`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `window.TR - i18n translation dictionary (FR/EN/ES base)` (e.g. with `showScreen() - screen routing with cinematic mode integration` and `i18n-de.js - German translations overlay`) actually correct?**
  _`window.TR - i18n translation dictionary (FR/EN/ES base)` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Self-Improvement Activator Hook`, `BM25 Search Engine`, `search_stack() - stack-specific guidelines search` to the rest of the system?**
  _82 weakly-connected nodes found - possible documentation gaps or missing edges._