# Instructions agent — Richesses du Monde

## Agent skills

### Issue tracker

Issues suivies en markdown local sous `.scratch/`. Voir `docs/agents/issue-tracker.md`.

### Triage labels

Labels en français : `à-trier`, `info-manquante`, `prêt-agent`, `prêt-humain`, `annulé`. Voir `docs/agents/triage-labels.md`.

### Domain docs

Repo multi-context : `CONTEXT-MAP.md` à la racine + `src/<contexte>/CONTEXT.md`. Voir `docs/agents/domain.md`.

## Commit et push automatiques

Après chaque tâche qui modifie le code :

1. Créer un commit sans attendre la demande de l'utilisateur.
2. Pousser immédiatement sur `origin/main` (ou la branche de travail courante).
3. Ne pas committer de secrets (`.env`, credentials).
4. Messages de commit en français, concis, centrés sur le *pourquoi*.

Exceptions : tâche en lecture seule, ou demande explicite de ne pas committer.
