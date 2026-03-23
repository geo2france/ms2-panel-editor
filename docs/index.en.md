---
hide:
  - navigation
  - toc
---

# Home

`panel_editor` is a MapStore plugin dedicated to attribute **read** and **edit** workflows.

The plugin is **independent from other MapStore plugins**: it owns its Redux state, actions, and access rules without relying on another plugin's business logic.

This `ms2-panel-editor` repository is used for **project management**, **release management**, and the **documentation sources and build**.

The plugin **source code** is maintained in the [geo2france/MapStoreExtension](https://github.com/geo2france/MapStoreExtension) repository, on the [panel-editor](https://github.com/geo2france/MapStoreExtension/tree/panel-editor) branch.

This setup avoids **duplicating the `MapStoreExtension` fork**. When several plugins are developed, it is simpler to keep them aligned on the same MapStore version and avoid duplicating MapStore dependencies by switching branches, instead of creating one fork per extension.

This work is funded by **Géo2France**: [https://www.geo2france.fr](https://www.geo2france.fr)
