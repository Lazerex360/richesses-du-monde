# Domain Docs

Comment les skills d'ingénierie doivent consommer la documentation de domaine de ce repo.

## Avant d'explorer, lire

- **`CONTEXT-MAP.md`** à la racine — pointe vers un `CONTEXT.md` par contexte. Lire ceux pertinents au sujet.
- **`docs/adr/`** — lire les ADRs qui touchent à la zone de travail.
- Dans les contextes individuels : `src/<contexte>/docs/adr/` pour les décisions locales.

Si ces fichiers n'existent pas, **procéder silencieusement**. Ne pas signaler leur absence ; ne pas proposer de les créer immédiatement. Le skill producteur (`/grill-with-docs`) les crée de manière paresseuse quand des termes ou décisions se concrétisent.

## Structure (multi-context)

Ce repo est organisé en multi-context :

```
/
├── CONTEXT-MAP.md                    ← carte des contextes
├── docs/adr/                         ← décisions système globales
└── src/
    ├── game/                         ← moteur de jeu (GameEngine)
    │   ├── CONTEXT.md
    │   └── docs/adr/
    ├── server/                       ← serveur HTTP/WS
    │   ├── CONTEXT.md
    │   └── docs/adr/
    └── data/                         ← plateau, ressources, comptes
        ├── CONTEXT.md
        └── docs/adr/
```

## Utiliser le vocabulaire du glossaire

Quand une sortie nomme un concept de domaine, utiliser le terme tel que défini dans `CONTEXT.md`. Ne pas dériver vers des synonymes que le glossaire évite explicitement.

Concepts clés de ce projet :
- **Titre** : part de propriété d'une ressource (ex: "25% Pétrole")
- **Royalties** : revenus versés au détenteur d'un titre quand un autre joueur atterrit sur sa case
- **Boucle extérieure / intérieure** : les deux circuits du plateau
- **Case continentale** : case de ressource mondiale (boucle intérieure)

## Signaler les conflits ADR

Si une sortie contredit un ADR existant, le signaler explicitement plutôt que de le passer sous silence.
