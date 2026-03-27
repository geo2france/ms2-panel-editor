# Configuration

Configuration is defined in `localConfig.json` under the `panel_editor` plugin.

## 1) Global plugin configuration (`cfg`)

| Key | Type | Required | Description |
|---|---|---:|---|
| `title` | `string` | no | Panel title. |
| `tooltip` | `string` | no | Plugin button tooltip. |
| `icon` | `string` | no | Default MapStore icon (`Glyphicon`). |
| `iconByContext` | `object` | no | Icon override based on the current context. Keys can be the context id or context name, with an optional `default` key. |
| `size` | `number` | no | Base panel width (plugin adds +100 px). |
| `geoserver` | `string` | no | Base GeoServer URL (WFS fallback). |
| `wfsUrl` | `string` | no | Global WFS URL (higher priority than `geoserver`). |
| `layers` | `object` | yes | Per-layer rules (`workspace:layer`). |

### Sidebar button icon by context

The `SidebarMenu` button can use a different icon depending on the current context.

Resolution order:

- `cfg.iconByContext[context.resource.id]`
- `cfg.iconByContext[context.resource.name]`
- `cfg.iconByContext.default`
- `cfg.icon`
- internal fallback: `list-alt`

Example:

```json
"cfg": {
  "icon": "list-alt",
  "iconByContext": {
    "12": "pencil",
    "Urban planning context": "folder-open",
    "default": "map"
  }
}
```

## 2) Layer configuration (`cfg.layers["workspace:layer"]`)

| Key | Type | Required | Description |
|---|---|---:|---|
| `featureFieldLabel` | `string` | no | Field used in feature selector labels. |
| `featureFielLabel` | `string` | no | Tolerated alias (compatibility). |
| `hidden` | `string[]` | no | Fields hidden in read mode. In edit mode, a `hidden` field stays hidden unless it is also declared in `fields`. |
| `fields` | `array` | no | Detailed field definition (see next table). |
| `auto` | `array` | no | Fields filled automatically on save. |
| `allowEdit` | `boolean` | no | If `false`, completely disables layer editing regardless of roles. |
| `allowEditRoles` | `string[]` | no | If provided, priority list of roles allowed to edit the layer. |
| `edit` / `editingRoles` | `string[]` | no | Roles allowed to edit the layer. |
| `allowDelete` | `boolean` | no | Shows the delete button only when set to `true`. |
| `delete` / `deletionRoles` | `string[]` | no | Roles allowed to delete. |
| `wfsUrl` | `string` | no | Layer-specific WFS URL. |
| `idField` | `string` | no | Identifier field name (default: `id`). |
| `restrictedArea` | `object` | no | Spatial edit restriction (area of competence) based on either a `wkt`/`wtk` or the JSON returned by a `url`. |

## 3) Field configuration (`fields`)

Each `fields` entry accepts compact format:
`[name, label, type, editable, required, roles, options]`

| Position | Name | Type | Description |
|---:|---|---|---|
| `0` | `name` | `string` | Attribute key. |
| `1` | `label` | `string` | Display label. |
| `2` | `type` | `string` | UI type (`string`, `number`, `date`, `list`, etc.). |
| `3` | `editable` | `boolean` | Editable or read-only. |
| `4` | `required` | `boolean` | Required field. |
| `5` | `roles` | `string[]` | Roles allowed to edit this field. In edit mode, if the user does not have one of these roles, the field stays visible but read-only. |
| `6` | `options` | `array \| object` | Values for `list` inputs from a static array, a remote JSON URL, or an empty array for automatic layer-based values. |

### Supported cases for `type: "list"`

- **Static list**

```json
["dpt", "Department", "list", true, false, [], [75, 77, 78, 91, 92, 93, 94, 95]]
```

- **Automatic values** from existing field values in the current layer

```json
["dpt", "Department", "list", true, false, [], []]
```

- **Remote values** from a WFS or OGC API Features JSON URL

```json
[
  "dpt",
  "Department",
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

Rules:

- If `options` is a non-empty array, that array is used as-is.
- If `options` is an object `{ "url": "...", "field": "..." }`, the plugin reads the JSON response and extracts unique values from the configured field.
- If `options` is empty or missing for a `list` field, the plugin proposes unique values already present for that field in the loaded layer features.
- Duplicate and empty values are filtered out.
- A field listed in `hidden` can be shown again in edit mode when it is explicitly declared in `fields`.

## 4) Automatic field configuration (`auto`)

Each `auto` entry accepts compact format:
`[name, type, source]`

| Position | Name | Type | Description |
|---:|---|---|---|
| `0` | `name` | `string` | Field name to populate. |
| `1` | `type` | `string` | Automatic type. Supported values: `header`, `date`, `area`, `length`, `value`. |
| `2` | `source` | `string` | Source to use. For `header`, only `name` and `role` are documented, read from `currentUser`. For `date`, desired display format. For `value`, fixed value to inject. Not used for `area` and `length`. |

Rules:

- A field declared in `auto` is never editable in the form.
- The panel always displays the last known value.
- If `type` is `header`, the value is read from `currentUser`.
- Documented values for `header`: `name`, `role`.
- If `type` is `date`, the value is replaced with the current date on save.
- If `type` is `value`, the configured value is injected as-is on save.
- If `type` is `area`, the value is computed from the feature geometry. Default unit is square meters (`m²`).
- If `type` is `length`, the value is computed from the feature geometry. For a line, this is the length. For a polygon, this is the perimeter. Default unit is meters (`m`).
- `auto` fields are injected into the WFS-T transaction even if they are also listed in `hidden`.

## 5) Spatial restriction (`restrictedArea`)

The `restrictedArea` key limits access to edit mode using a spatial comparison between the selected feature geometry and an area of competence.

Example with a JSON URL:

```json
"restrictedArea": {
  "url": "/my/custom/area",
  "operation": "INTERSECTS"
}
```

Example with a WKT provided in configuration:

```json
"restrictedArea": {
  "wtk": "POLYGON((...))",
  "operation": "WITHIN"
}
```

Supported keys:

- `url`: any URL returning JSON that the plugin can parse
- `wkt` / `wtk`: geometry provided directly in configuration
- `operation`: `WITHIN`, `INTERSECTS`, or `CONTAINS`
- `allowedRoles`: roles that bypass this spatial restriction

Rules:

- The control geometry comes either from `wkt` / `wtk` or from the JSON returned by `url`.
- No HTTP call is made if a `wkt` / `wtk` is provided.
- If no `url`, `wkt`, or `wtk` is provided, no control geometry is loaded.
- `wkt` / `wtk` is interpreted as `EPSG:4326`.
- When needed, that geometry is reprojected to the Identify features CRS before spatial comparison.
- If the spatial check fails for the configured operation, the UI shows a `record` status button with a dedicated tooltip.
- If the user has a role listed in `allowedRoles`, the spatial restriction is bypassed.

## Complete example (global + layer + fields)

```json
{
  "name": "panel_editor",
  "cfg": {
    "title": "Reviewed projects",
    "tooltip": "Reviewed projects",
    "icon": "map",
    "iconByContext": {
      "12": "pencil",
      "Urban planning context": "folder-open",
      "default": "map"
    },
    "size": 420,
    "geoserver": "http://localhost/geoserver",
    "layers": {
      "test:reviewed_projects": {
        "featureFieldLabel": "name",
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
          ["identifier", "Identifier", "string", true, true],
          ["name", "Name", "string", false, true],
          ["status", "Status", "list", true, false, ["EDITOR", "ADMIN"], ["New", "Validated", "Rejected"]],
          ["dpt", "Department", "list", true, false, [], []],
          ["comment", "Comment", "string", true, false]
        ]
      }
    }
  }
}
```

## Important notes

- Feature selector labels follow:
  `[number] - (field_name) field_value`.
- `ADMIN` / `ROLE_ADMIN` has full permissions.
- If a field is `required` and empty, it stays editable even if `editable` is `false` or editing is restricted to specific roles.
- `auto` fields stay read-only and are populated at save time.
- `hidden` fields are always hidden in read mode.
- In edit mode, a `hidden` field is shown only if it is declared in `fields`.
- In read mode, the UI shows either the pencil button or status buttons: `lock` for role denial, `record` for spatial denial, or both when needed.
- If `allowEdit` is `false`, no role, including `ADMIN`, can enter edit mode.
- If `allowEditRoles` is defined, it takes precedence over `edit` / `editingRoles`.
- In edit mode, layer and feature selectors are locked until `Save` or `Cancel`.
- The delete button is shown only when `allowDelete` is `true`.
- Default units for geometry-based calculations are `m²` for `area` and `m` for `length`.
- Spatial restriction key supported by the plugin is `restrictedArea`.
- A WFS-T HTTP `200` response that contains an XML error is treated as a failure and shows an error notification.
