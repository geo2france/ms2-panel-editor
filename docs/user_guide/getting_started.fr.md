# Configuration

La configuration se fait dans `localConfig.json` sous le plugin `panel_editor`.

## 1) Configuration globale du plugin (`cfg`)

| Clé | Type | Obligatoire | Description |
|---|---|---:|---|
| `title` | `string` | non | Titre du panneau. |
| `tooltip` | `string` | non | Tooltip du bouton du plugin. |
| `icon` | `string` | non | Icône MapStore (`Glyphicon`) par défaut. |
| `iconByContext` | `object` | non | Surcharge de l’icône selon le contexte courant. Les clés peuvent être l’identifiant ou le nom du contexte, avec une clé optionnelle `default`. |
| `size` | `number` | non | Largeur de base du panneau (le plugin ajoute +100 px). |
| `serverUrl` | `string` | non | URL GeoServer de base (fallback pour WFS). |
| `wfsUrl` | `string` | non | URL WFS globale (prioritaire sur `serverUrl`). |
| `layers` | `object` | oui | Dictionnaire des règles par couche (`workspace:layer`). |

### Icône du bouton par contexte

Le bouton `SidebarMenu` peut utiliser une icône différente selon le contexte courant.

Ordre de résolution :

- `cfg.iconByContext[context.resource.id]`
- `cfg.iconByContext[context.resource.name]`
- `cfg.iconByContext.default`
- `cfg.icon`
- fallback interne : `list-alt`

Exemple :

```json
"cfg": {
  "icon": "list-alt",
  "iconByContext": {
    "12": "pencil",
    "Contexte urbanisme": "folder-open",
    "default": "map"
  }
}
```

## 2) Configuration par couche (`cfg.layers["workspace:layer"]`)

| Clé | Type | Obligatoire | Description |
|---|---|---:|---|
| `featureFieldLabel` | `string` | non | Champ utilisé dans la liste des entités. |
| `featureFielLabel` | `string` | non | Alias toléré (compatibilité). |
| `hidden` | `string[]` | non | Champs masqués en lecture. En écriture, un champ `hidden` reste masqué sauf s’il est aussi déclaré dans `fields`. |
| `fields` | `array` | non | Définition fine des champs (voir tableau suivant). |
| `auto` | `array` | non | Champs renseignés automatiquement à la sauvegarde. |
| `allowEdit` | `boolean` | non | Si `false`, interdit toute édition de la couche, quels que soient les rôles. |
| `allowEditRoles` | `string[]` | non | Si renseigné, liste prioritaire des rôles autorisés à éditer la couche. |
| `edit` / `editingRoles` | `string[]` | non | Rôles autorisés à éditer la couche. |
| `allowDelete` | `boolean` | non | Affiche le bouton de suppression uniquement si la valeur est `true`. |
| `delete` / `deletionRoles` | `string[]` | non | Rôles autorisés à supprimer. |
| `wfsUrl` | `string` | non | URL WFS spécifique à la couche. |
| `idField` | `string` | non | Nom du champ identifiant (défaut: `id`). |
| `restrictedArea` | `object` | non | Restriction spatiale d’édition (zone de compétence) basée sur un `wkt` ou sur le JSON retourné par une `url`. |

## 3) Configuration par champ (`fields`)

Chaque entrée de `fields` accepte le format compact:
`[name, label, type, editable, required, roles, options]`

| Position | Nom | Type | Description |
|---:|---|---|---|
| `0` | `name` | `string` | Nom du champ (clé attribut). |
| `1` | `label` | `string` | Libellé affiché. |
| `2` | `type` | `string` | Type UI (`string`, `number`, `date`, `list`, etc.). |
| `3` | `editable` | `boolean` | Champ éditable ou non. |
| `4` | `required` | `boolean` | Champ obligatoire. |
| `5` | `roles` | `string[]` | Rôles autorisés à éditer ce champ. En mode édition, si l’utilisateur n’a pas l’un de ces rôles, le champ reste affiché mais en lecture seule. |
| `6` | `options` | `array \| object` | Valeurs pour listes (`list`) via tableau statique, URL JSON distante, ou tableau vide pour auto-détection depuis la couche. |

### Cas supportés pour `type: "list"`

1. Liste statique

```json
["dpt", "Département", "list", true, false, [], [75, 77, 78, 91, 92, 93, 94, 95]]
```

2. Lecture automatique des valeurs existantes du champ dans la couche courante

```json
["dpt", "Département", "list", true, false, [], []]
```

3. Lecture depuis une URL JSON WFS ou OGC API Features

```json
[
  "dpt",
  "Département",
  "list",
  true,
  false,
  [],
  {
    "url": "https://example.org/collections/idf:admin_dpt_idf/items?f=application/json&properties=DPT",
    "field": "DPT"
  }
]
```

Règles :

- Si `options` contient un tableau non vide, ce tableau est utilisé tel quel.
- Si `options` est un objet `{ "url": "...", "field": "..." }`, le plugin lit la réponse JSON et extrait les valeurs uniques du champ indiqué.
- Si `options` est vide ou absent pour un champ `list`, le plugin propose les valeurs uniques déjà présentes sur ce champ dans les entités de la couche chargée.
- Les doublons et valeurs vides sont filtrés.
- Un champ présent dans `hidden` peut être réaffiché en mode édition s’il est explicitement déclaré dans `fields`.

## 4) Configuration des champs automatiques (`auto`)

Chaque entrée de `auto` accepte le format compact :
`[name, type, source]`

| Position | Nom | Type | Description |
|---:|---|---|---|
| `0` | `name` | `string` | Nom du champ à renseigner. |
| `1` | `type` | `string` | Type automatique. Valeurs supportées : `header`, `date`, `area`, `length`, `value`. |
| `2` | `source` | `string` | Source à utiliser. Pour `header`, seules les valeurs `name` et `role` sont documentées, lues depuis `currentUser`. Pour `date`, format d'affichage souhaité. Pour `value`, valeur fixe à injecter. Inutile pour `area` et `length`. |

Règles :

- Un champ déclaré dans `auto` n’est jamais éditable dans le formulaire.
- Le panneau affiche toujours la dernière valeur connue du champ.
- Si `type` vaut `header`, la valeur est lue dans `currentUser`.
- Valeurs documentées pour `header` : `name`, `role`.
- Si `type` vaut `date`, la valeur est remplacée par la date courante à la sauvegarde.
- Si `type` vaut `value`, la valeur configurée est injectée telle quelle à la sauvegarde.
- Si `type` vaut `area`, la valeur est calculée à partir de la géométrie de la feature. L’unité par défaut est le mètre carré (`m²`).
- Si `type` vaut `length`, la valeur est calculée à partir de la géométrie de la feature. Pour une ligne, c’est la longueur. Pour un polygone, c’est le périmètre. L’unité par défaut est le mètre (`m`).
- Les champs `auto` sont injectés dans la transaction WFS-T même s’ils sont aussi présents dans `hidden`.

## 5) Restriction spatiale (`restrictedArea`)

La clé `restrictedArea` permet de limiter l’accès au mode édition selon une comparaison spatiale entre la géométrie de la feature sélectionnée et une zone de compétence.

Exemple avec URL JSON :

```json
"restrictedArea": {
  "url": "/my/custom/area",
  "operation": "INTERSECTS"
}
```

Exemple avec WKT fourni en configuration :

```json
"restrictedArea": {
  "wkt": "POLYGON((...))",
  "operation": "WITHIN"
}
```

Clés supportées :

- `url` : URL libre retournant un JSON exploitable par le plugin
- `wkt` : géométrie fournie directement dans la config
- `operation` : `WITHIN`, `INTERSECTS` ou `CONTAINS`
- `allowedRoles` : rôles qui ignorent cette restriction spatiale

Règles :

- La géométrie de contrôle provient soit du `wkt`, soit du JSON retourné par `url`.
- Aucun appel HTTP n’est fait si un `wkt` est fourni.
- Si aucun `url` ou `wkt` n’est fourni, aucune géométrie de contrôle n’est chargée.
- Le `wkt` est interprété en `EPSG:4326`.
- Si nécessaire, cette géométrie est reprojetée vers le CRS des features Identify avant la comparaison spatiale.
- Si la comparaison spatiale échoue pour l’opération configurée, l’interface affiche un bouton d’état `record` avec une tooltip métier.
- Si l’utilisateur possède un rôle présent dans `allowedRoles`, la restriction spatiale est ignorée.

## Exemple complet (global + couche + champs)

```json
{
  "name": "panel_editor",
  "cfg": {
    "title": "Projets avisés",
    "tooltip": "Projets avisés",
    "icon": "map",
    "iconByContext": {
      "12": "pencil",
      "Contexte urbanisme": "folder-open",
      "default": "map"
    },
    "size": 420,
    "serverUrl": "http://localhost/geoserver",
    "layers": {
      "test:avisee_projets": {
        "featureFieldLabel": "nom",
        "idField": "id",
        "hidden": [
          "geom",
          "log_date_crea",
          "log_date_modi",
          "log_user_crea",
          "log_user_modi"
        ],
        "auto": [
          ["type_saisie", "value", "manual"],
          ["log_user_modi", "header", "name"],
          ["log_date_modi", "date", "DD/MM/YYYY"],
          ["surface_carto", "area"],
          ["longueur_carto", "length"]
        ],
        "allowEdit": true,
        "allowEditRoles": ["EDITOR", "ADMIN"],
        "allowDelete": true,
        "delete": ["ADMIN"],
        "restrictedArea": {
          "url": "/console/account/areaofcompetence",
          "operation": "INTERSECTS"
        },
        "fields": [
          ["numero_identifiant", "Identifiant", "string", true, true],
          ["nom", "Nom", "string", false, true],
          ["etat", "Etat", "list", true, false, ["EDITOR", "ADMIN"], ["Nouveau", "Validé", "Refusé"]],
          ["dpt", "Département", "list", true, false, [], []],
          ["commentaire", "Commentaire", "string", true, false]
        ]
      }
    }
  }
}
```

## Notes importantes

- La liste des entités affiche un label au format:
  `[numero] - (nom_champ) valeur_champ`.
- `ADMIN` / `ROLE_ADMIN` a tous les droits.
- Si un champ est `required` et vide, il reste éditable même si `editable` vaut `false` ou si son édition est limitée à certains rôles.
- Les champs `auto` restent en lecture seule et sont valorisés au moment de la sauvegarde.
- Les champs `hidden` sont toujours masqués en lecture.
- En mode édition, un champ `hidden` n’est affiché que s’il est déclaré dans `fields`.
- En lecture, l’interface affiche soit le bouton stylo, soit des boutons d’état : `lock` pour un refus par rôle, `record` pour un refus par zone, ou les deux si nécessaire.
- Si `allowEdit` vaut `false`, aucun rôle, y compris `ADMIN`, ne peut passer en édition.
- Si `allowEditRoles` est défini, il est prioritaire sur `edit` / `editingRoles`.
- En mode édition, les sélecteurs de couche et d’entité sont verrouillés jusqu’à `Enregistrer` ou `Annuler`.
- Le bouton supprimer n’est affiché que si `allowDelete` vaut `true`.
- Les unités par défaut des calculs géométriques sont `m²` pour `area` et `m` pour `length`.
- La clé de restriction spatiale utilisée par le plugin est `restrictedArea`.
- Une réponse WFS-T en HTTP `200` mais contenant une erreur XML est traitée comme un échec et affiche une notification d’erreur.
