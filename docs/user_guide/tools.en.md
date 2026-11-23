# Role restrictions

The plugin applies permissions at layer and field levels.

## General rules

- `ADMIN` (or `ROLE_ADMIN`) has full access.
- If `allowEdit` is `false`, nobody can edit the layer.
- If `allowEditRoles` is provided, only those roles can edit the layer.
- Without `edit`/`editingRoles`, layer editing is allowed.
- Without `delete`/`deletionRoles`, delete follows layer edit permission.
- If `allowDelete` is missing or set to `false`, the delete button is hidden.

## Field rules

- If a field has `editable: false`, it is read-only.
- If a field defines `roles`, only those roles can edit it.
- Active business override:
  a `required` field with an empty value stays editable, even if configured as non-editable or restricted to specific roles.

## Action buttons

- Read mode: pencil button to enter edit mode.
- Edit mode: save (green), cancel (yellow), delete (red).
- Buttons stay visible in the static toolbar (outside scroll area).
- In edit mode, the user must save or cancel before switching layer or feature.

## Using a geocoding field

In edit mode, to search for an address with `geocoding`:

1. Enter at least three characters and wait for suggestions (up to five results).
2. Select a suggestion to populate the address and any configured longitude/latitude attributes.
3. Save the form to persist the values.

To look up an address from the map, click the marker button next to the field, then click the desired point. Point selection ends after this click, and the reverse lookup populates the address if successful. The click does not identify another feature. Clicking the button again cancels point selection; pressing Escape in the field also cancels it.

For `reverse-geocoding`, use the map point selection button: the address text is read-only. A non-editable field also disables the button.

An empty address can be populated automatically when entering edit mode from the position of a point feature, if the field is editable. An existing address is kept. Messages indicate a lookup in progress, no results or a service error.

Geocoding changes form attributes without moving the feature geometry. Changes require saving; the cancel button discards them. See [field configuration](getting_started.en.md#geocoding-and-reverse-geocoding-fields).

## UI behavior based on permissions

- If the user cannot edit because of roles, a `lock` status button is shown with a tooltip.
- If the user cannot edit because of `restrictedArea`, a `record` status button is shown with a tooltip.
- If both restrictions apply, both buttons are shown.
- In edit mode, unauthorized fields are still shown but stay read-only.
- A `required` empty field becomes editable to allow mandatory input, including when editing is normally restricted to specific roles.
- Delete button is shown only when `allowDelete` is `true`.
- When the button is shown, it is enabled only if delete permission is granted.
- In read mode, hidden fields (`hidden`) are not rendered.
- In edit mode, a `hidden` field is rendered only if it is declared in `fields`.
