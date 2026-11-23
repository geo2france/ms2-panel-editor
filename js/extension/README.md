# Champs conditionnels

Dans `panelEditor.cfg.layers.<nom de couche>`, utiliser les contrôles existants
`list` et `string`. Les alias `select` et `text`, ainsi que `id` à la place de
`name`, sont également acceptés. Les configurations compactes restent compatibles.

```json
{
  "allowEditRoles": ["EDITOR"],
  "fields": [
    { "id": "champ1", "type": "select", "options": ["A", "B", "C"] },
    {
      "id": "champ2", "type": "select", "options": ["FOO", "BAR", "BLA"],
      "editableIf": { "field": "champ1", "eq": "A" }
    },
    {
      "id": "champ3", "type": "text", "defaultValue": "TOTO",
      "editableIf": { "field": "champ2", "eq": "FOO" }
    },
    {
      "id": "champ4", "type": "text", "value": "BAZ", "readOnly": true,
      "editableIf": { "field": "champ3", "operator": "notEmpty" }
    }
  ]
}
```

Les champs doivent correspondre aux attributs de l'entité WFS. Tous les attributs
restent affichés : `editableIf` active ou désactive uniquement la saisie et se
recalcule pendant l'édition. La clé `visibleIf` reste acceptée comme alias avec
ce même comportement, sans masquer le champ. `eq` compare
strictement les valeurs ; `notEmpty` exclut les valeurs nulles et les textes vides
ou composés d'espaces. Un champ dépendant d'un champ dont la condition n'est pas
satisfaite est aussi désactivé, même si celui-ci conserve une valeur. Une dépendance
inconnue, un opérateur inconnu ou un cycle désactive la saisie du champ concerné.

Un tableau dans `editableIf` combine les conditions avec un **ET logique** :

```json
{
  "name": "champ4", "type": "string",
  "editableIf": [
    { "field": "champ2", "eq": "FOO" },
    { "field": "champ3", "eq": "BZH" }
  ]
}
```

Les deux conditions doivent être satisfaites. Un tableau vide ne restreint pas la saisie.

`defaultValue` initialise les champs vides au démarrage de l'édition, y compris
ceux dont la saisie devient active ensuite. Une valeur existante est conservée et le
champ peut ensuite être effacé. `value` fournit une valeur fixe ; `readOnly` bloque
la saisie, également pour les administrateurs. Les valeurs fixes dont les conditions sont satisfaites sont
enregistrées avec les autres changements si les droits du champ le permettent.

Les valeurs des champs dont les conditions ne sont pas satisfaites restent affichées
et sont conservées dans le formulaire, mais ne sont ni validées ni envoyées dans
la transaction WFS. Les restrictions statiques `hidden` existantes sont conservées.

`allowEditRoles` restreint toute la saisie au niveau de la couche. `roles` restreint
un champ. Les conventions existantes s'appliquent : préfixe `ROLE_` accepté et
accès administrateur, sauf si `allowEdit` vaut `false`. Ces contrôles côté client
complètent les droits WFS du serveur.

## Validation

Dans les objets de `fields`, `pattern` valide les champs texte (`string`/`text`
et `textarea`) ; `min` et `max` bornent les champs `number`, bornes incluses.
`validationMessage` personnalise l'erreur affichée sous le champ à l'enregistrement.
Une valeur invalide bloque la sauvegarde. Les champs inactifs sont exclus de la
validation ; les valeurs vides restent acceptées sauf avec `required: true`.

```json
[
  { "name": "code_postal", "type": "string", "pattern": "^[0-9]{5}$" },
  { "name": "mesure", "type": "number", "min": -10, "max": 20 }
]
```
