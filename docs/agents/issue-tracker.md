# Issue tracker: Markdown local

Les issues de ce repo vivent en tant que fichiers markdown dans `.scratch/`.

## Conventions

- Une feature par dossier : `.scratch/<feature-slug>/`
- Le PRD est dans `.scratch/<feature-slug>/PRD.md`
- Les issues d'implémentation sont dans `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numérotées depuis `01`
- L'état de triage est enregistré via une ligne `Statut:` en haut de chaque fichier issue (voir `triage-labels.md` pour les chaînes de rôles)
- Les commentaires s'ajoutent en bas du fichier sous un heading `## Commentaires`

## Quand un skill dit "publier dans le tracker"

Créer un nouveau fichier sous `.scratch/<feature-slug>/` (créer le dossier si nécessaire).

## Quand un skill dit "récupérer le ticket"

Lire le fichier au chemin référencé. L'utilisateur passera normalement le chemin ou le numéro d'issue directement.
