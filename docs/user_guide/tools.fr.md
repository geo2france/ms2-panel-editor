# Restrictions par rôles

Le plugin applique les droits par couche et par champ.

## Règles générales

- `ADMIN` (ou `ROLE_ADMIN`) a tous les droits.
- Si `allowEdit` vaut `false`, personne ne peut éditer la couche.
- Si `allowEditRoles` est renseigné, seuls ces rôles peuvent éditer la couche.
- Sans règle `edit`/`editingRoles`, l’édition de la couche est autorisée.
- Sans règle `delete`/`deletionRoles`, la suppression suit la règle d’édition.
- Si `allowDelete` est absent ou vaut `false`, le bouton supprimer est masqué.

## Règles par champ

- Si un champ a `editable: false`, il est en lecture seule.
- Si un champ définit des `roles`, seuls ces rôles peuvent l’éditer.
- Exception métier active :
  un champ `required` sans valeur reste éditable, même s’il est non éditable par config ou limité à certains rôles, pour permettre la saisie obligatoire.

## Boutons d’action

- Lecture : bouton stylo pour passer en édition.
- Édition : sauvegarder (vert), annuler (jaune), supprimer (rouge).
- Les actions restent visibles en haut du panneau (hors scroll).
- En mode édition, il faut valider ou annuler avant de changer de couche ou d’entité.

## Gestion d’interface selon les droits

- Si l’utilisateur ne peut pas éditer à cause des rôles, un bouton `lock` est affiché avec une tooltip.
- Si l’utilisateur ne peut pas éditer à cause de `restrictedArea`, un bouton `record` est affiché avec une tooltip.
- Si les deux restrictions s’appliquent, les deux boutons sont affichés.
- En mode édition, un champ non autorisé reste affiché mais en lecture seule.
- Un champ `required` vide devient éditable pour permettre la saisie obligatoire, y compris si son édition est normalement limitée à certains rôles.
- Le bouton supprimer est affiché uniquement si `allowDelete` vaut `true`.
- Si le bouton est affiché, il reste activé uniquement si l’utilisateur possède le droit de suppression.
- En lecture, les champs masqués (`hidden`) ne sont pas affichés.
- En écriture, un champ `hidden` est affiché uniquement s’il est déclaré dans `fields`.
