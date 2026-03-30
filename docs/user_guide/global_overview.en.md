# Presentation

The `panel_editor` plugin adds a right-side panel.

![sidebar location](images/main-toolbar.png)

## User flow

1. Enable the tool from the sidebar menu (`panel_editor`).
2. Click on the map to select a feature (identify).
3. Select the layer (if multiple responses) and the feature.
4. Read visible attributes in read mode.
5. Switch to edit mode with the pencil button (according to user role and restricted area).
6. Save, cancel, or delete according to permissions.

![read mode](images/write-mode.png)


## UI behavior

- Panel title comes from `cfg.title`.
- Sidebar button icon comes from `cfg.icon` or `cfg.iconByContext` depending on the current context.
- Edit mode is displayed with a label.
- Action toolbar is fixed (outside scrolling area).
- Fields are displayed in a scrollable area.
- Feature labels in the selector use:
  - `[number] - (field_name) field_value`
  - where `field_name` is configured with `featureFieldLabel` at layer level.
