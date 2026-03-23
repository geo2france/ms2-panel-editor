# Présentation

Le plugin `panel_editor` ajoute un panneau latéral droit.

## Parcours utilisateur

1. Activer l’outil depuis le menu (`panel_editor`).
2. Cliquer sur la carte pour lancer l’identification des entités.
3. Choisir la couche (si plusieurs réponses) puis l’entité.
4. Consulter les champs visibles en mode lecture.
5. Passer en mode édition avec le bouton stylo.
6. Sauvegarder, annuler ou supprimer selon les droits.

## Comportement de l’interface

- Le titre du panneau vient de `cfg.title`.
- Le mode édition est affiché par un label.
- La barre d’actions est fixe (hors scroll).
- Les champs sont dans une zone scrollable.
- Les labels des entités utilisent le format:
  - `[numero] - (nom_champ) valeur_champ`
  - avec `nom_champ` défini par `featureFieldLabel` au niveau de la couche.
