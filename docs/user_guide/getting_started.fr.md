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
| `serverUrl` | `string` | non | URL GeoServer de base utilisée pour construire l'endpoint WFS si `wfsUrl` n'est pas défini. |
| `wfsUrl` | `string` | non | URL WFS globale explicite, prioritaire sur `serverUrl`. |
| `geocodingService` | `string` | non | URL de base du service de géocodage, commune aux champs `geocoding` et `reverse-geocoding`. Défaut si absente ou vide : `https://data.geopf.fr/geocodage`. |
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
| `serverUrl` | `string` | non | URL GeoServer de base spécifique à la couche, utilisée seulement si `wfsUrl` n'est pas défini pour la couche ni globalement. |
| `wfsUrl` | `string` | non | URL WFS spécifique à la couche, prioritaire sur `serverUrl` de la couche et sur la configuration globale. |
| `idField` | `string` | non | Nom du champ identifiant (défaut: `id`). |
| `restrictedArea` | `object` | non | Restriction spatiale d’édition (zone de compétence) basée sur un `wkt` ou sur le JSON retourné par une `url`. |

Règles de résolution de l'URL WFS :

1. `cfg.layers["workspace:layer"].wfsUrl`
2. `cfg.wfsUrl`
3. `cfg.layers["workspace:layer"].serverUrl`
4. `cfg.serverUrl`

Conséquence :

- `wfsUrl` et `serverUrl` ne sont pas complémentaires pour une même portée de configuration ; `wfsUrl` surcharge `serverUrl`.
- Si `wfsUrl` est renseigné, `serverUrl` est ignoré pour cette portée.
- `serverUrl` sert uniquement de fallback pour construire automatiquement une URL WFS à partir d'une URL GeoServer de base.

## 3) Configuration par champ (`fields`)

Chaque entrée de `fields` accepte le format compact:
`[name, label, type, editable, required, roles, options]`

| Position | Nom | Type | Description |
|---:|---|---|---|
| `0` | `name` | `string` | Nom du champ (clé attribut). |
| `1` | `label` | `string` | Libellé affiché. |
| `2` | `type` | `string` | Type UI (`string`, `number`, `date`, `list`, `geocoding`, `reverse-geocoding`, etc.). |
| `3` | `editable` | `boolean` | Champ éditable ou non. |
| `4` | `required` | `boolean` | Champ obligatoire. |
| `5` | `roles` | `string[]` | Rôles autorisés à éditer ce champ. En mode édition, si l’utilisateur n’a pas l’un de ces rôles, le champ reste affiché mais en lecture seule. |
| `6` | `options` | `array \| object` | Valeurs pour listes (`list`) via tableau statique, URL JSON distante, ou tableau vide pour auto-détection depuis la couche ; champs de coordonnées pour le géocodage (`xField`, `yField`). |

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

### Champs `geocoding` et `reverse-geocoding`

Ces types renseignent un attribut texte contenant une adresse avec le service de géocodage de la Géoplateforme :

- `geocoding` permet de saisir une adresse, de choisir une suggestion ou de sélectionner un point sur la carte.
- `reverse-geocoding` permet de retrouver une adresse depuis un point sur la carte. Le texte est en lecture seule, mais le bouton de sélection reste disponible si le champ est modifiable.

Exemples dans `cfg.layers["workspace:layer"].fields` :

```json
["adresse", "Adresse", "geocoding", true, false, []]
```

```json
["adresse", "Adresse", "reverse-geocoding", true, false, []]
```

Les booléens JSON `true`/`false` et les chaînes `"true"`/`"false"` sont acceptés dans le format compact. Les règles `editable`, `required` et `roles` s’appliquent comme pour les autres champs.

#### Options de coordonnées

L’objet `options` permet de renseigner des attributs de coordonnées en plus de l’adresse :

| Option | Type | Description |
|---|---|---|
| `xField` | `string` | Nom de l’attribut recevant la longitude (X), en degrés WGS84 (`EPSG:4326`). |
| `yField` | `string` | Nom de l’attribut recevant la latitude (Y), en degrés WGS84 (`EPSG:4326`). |

Exemple compact :

```json
[
  ["adresse", "Adresse", "geocoding", true, false, [], { "xField": "longitude", "yField": "latitude" }],
  ["longitude", "Longitude", "number", true, false],
  ["latitude", "Latitude", "number", true, false]
]
```

Le format objet est également accepté :

```json
[
  {
    "name": "adresse",
    "label": "Adresse",
    "type": "geocoding",
    "editable": true,
    "options": { "xField": "longitude", "yField": "latitude" }
  },
  { "name": "longitude", "type": "number", "editable": true },
  { "name": "latitude", "type": "number", "editable": true }
]
```

Les mêmes options s’appliquent à `reverse-geocoding`.

- Les attributs cibles doivent déjà exister sur l’entité, être différents du champ adresse et être modifiables selon leurs droits. Un attribut absent ou non modifiable est ignoré.
- Si les attributs X/Y sont dans `hidden`, les déclarer aussi dans `fields` pour permettre leur enregistrement.
- Sans `xField`/`yField`, seule l’adresse est renseignée. Ces options ne créent pas de nouveaux attributs.
- La sélection d’une suggestion utilise les coordonnées retournées par le service. Une recherche inverse réussie conserve les coordonnées du point choisi, plutôt que celles de l’adresse retournée.
- Saisir ou effacer du texte seul ne met pas à jour et n’efface pas les coordonnées X/Y.
- L’adresse et les coordonnées sont enregistrées avec les autres attributs à la sauvegarde du formulaire. La géométrie de l’entité n’est pas modifiée. Les attributs X/Y reçoivent toujours des coordonnées WGS84, quel que soit le CRS de la couche.

#### Initialisation et recherche

À l’ouverture de l’édition, une adresse déjà renseignée est conservée sans recherche. Pour les deux types, si l’adresse est vide, le champ modifiable et la géométrie de l’entité de type `Point`, une recherche inverse utilise sa position pour renseigner une adresse par défaut. La position est reprojetée en WGS84 depuis le CRS de la réponse Identify (`EPSG:4326` par défaut). Une géométrie non ponctuelle ou une position invalide ne déclenche pas cette initialisation. Effacer ensuite l’adresse ne relance pas l’initialisation.

L’URL de base du service est définie dans `localConfig.json`, sous `cfg.geocodingService` du plugin. Exemple dans `cfg` :

```json
{ "geocodingService": "https://data.geopf.fr/geocodage" }
```

Si la clé est absente ou vide, cette URL est utilisée par défaut. Une barre oblique finale est acceptée. Le contrôle appelle directement le service depuis le navigateur et ajoute les chemins suivants à l’URL de base. Un service alternatif doit accepter les mêmes paramètres et formats de réponse :

- Autocomplétion : `/completion/`, paramètres `text`, `type=StreetAddress` et `maximumResponses=5`. La recherche démarre dès trois caractères, après une pause de 350 ms.
- Recherche inverse : `/reverse`, paramètres `lon`, `lat`, `index=address` et `limit=1`.

Le navigateur doit pouvoir accéder à ce service. En cas d’erreur ou d’absence de résultat exploitable, un message s’affiche sans renseigner l’adresse ni les coordonnées. Voir [l’utilisation du champ](tools.fr.md#utiliser-un-champ-de-geocodage).

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
