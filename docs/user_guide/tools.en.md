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
