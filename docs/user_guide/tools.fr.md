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

## Utiliser un champ de géocodage

En mode édition, pour rechercher une adresse avec `geocoding` :

1. Saisir au moins trois caractères et attendre les suggestions (jusqu’à cinq résultats).
2. Sélectionner une suggestion pour renseigner l’adresse et les éventuels attributs de longitude/latitude configurés.
3. Sauvegarder le formulaire pour enregistrer les valeurs.

Pour rechercher une adresse depuis la carte, cliquer sur le bouton avec le marqueur à côté du champ, puis sur le point souhaité. Le mode de sélection s’arrête après ce clic et la recherche inverse renseigne l’adresse si elle aboutit. Le clic ne lance pas l’identification d’une autre entité. Un second clic sur le bouton annule la sélection ; la touche Échap dans le champ permet aussi de l’annuler.

Avec `reverse-geocoding`, utiliser le bouton de sélection sur la carte : le texte de l’adresse est en lecture seule. A noter qu'un champ non modifiable désactive également le bouton.

Aussi, une adresse vide peut être renseignée automatiquement à l’ouverture de l’édition depuis la position d’une entité ponctuelle (si le champ est modifiable). Une adresse existante restera inchangée. 

Des messages indiquent la recherche en cours, l’absence de résultat ou une erreur du service.

Le géocodage modifie les attributs du formulaire sans déplacer la géométrie de l’entité.

Vous pouvez alors conserve les modifications via le bouton de sauvegarde ou les abandonner via le bouton "Annuler". Voir [la configuration des champs](getting_started.fr.md#champs-geocoding-et-reverse-geocoding).

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
