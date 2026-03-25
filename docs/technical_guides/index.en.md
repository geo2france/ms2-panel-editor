# Technical Guide

## Plugin architecture

Code organization:

- `js/extension/components`: React UI (no direct I/O).
- `js/extension/stateManagement`: actions, reducer, selectors, epics.
- `js/extension/requests`: I/O calls (WFS, area of competence).
- `js/extension/utiles`: pure helpers (permissions, attributes, auto fields, i18n, geometry).
- `js/extension/plugin`: MapStore wiring (`createPlugin`, reducers, epics).

Expected Redux flow:

1. Component dispatches an action.
2. Epic intercepts and calls `requests`.
3. Success/error dispatches Redux actions.
4. Selectors feed the UI.

## Local install

Prerequisites:

- Node.js and npm
- repository cloned with MapStore2 submodule

Commands:

```bash
npm install
npm start
```

Application runs on `http://localhost:8081`.

## Build extension

```bash
npm run ext:build
```

The extension zip is generated in `dist/`.

## Configuration notes

- Plugin is declared in `assets/index.json` with name `panel_editor`.
- Extension name is defined in `config.js`.
- Runtime configuration is in `configs/localConfig.json`.
- Automatic fields (`auto`) are resolved in helpers, then injected into the transaction at save time.
- Supported `auto` types include `header`, `date`, `area`, `length`, and `value`. Default units are `m²` for `area` and `m` for `length`.
- `list` fields support a static array, a remote JSON source `{ url, field }`, or an empty array to infer values from already loaded features.
- Field visibility differs between read and edit modes: `hidden` always hides in read mode, while a `hidden` field can be shown in edit mode when configured in `fields`.
- Layer permissions support `allowEdit`, `allowEditRoles`, then the legacy fallback `edit` / `editingRoles`.
- `restrictedArea` can rely either on a `wkt` / `wtk` or on a JSON `url`. There is no built-in default endpoint.
- `wkt` / `wtk` is interpreted as `EPSG:4326`, then reprojected to the Identify features CRS before `WITHIN` / `INTERSECTS` / `CONTAINS` checks.
- `restrictedArea` is evaluated before entering edit mode and, combined with role checks, drives UI state (`lock`, `record`, or both).
- In edit mode, layer and feature selectors are disabled to prevent context changes before save or cancel.
- Delete button behavior uses two checks: visibility through `allowDelete`, then enabled state through `delete` / `deletionRoles` permissions.
- The `requests` layer also validates WFS-T XML responses: an HTTP `200` containing an OGC/WFS error is treated as an application error.

## Additional reference

For more details about MapStore extension patterns and plugin development, see the official repository:

- [MapStoreExtension (GeoSolutions)](https://github.com/geosolutions-it/MapStoreExtension)
