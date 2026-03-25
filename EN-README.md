# ms2-panel-editor

`panel_editor` is a MapStore plugin dedicated to attribute **read** and **edit** workflows.

The plugin is **independent from other MapStore plugins**: it owns its Redux state, actions, and access rules without relying on another plugin's business logic.

This work is funded by **Géo2France**: [https://www.geo2france.fr](https://www.geo2france.fr)

## Documentation structure

The documentation follows the same structure as the MkDocs site:

Published documentation: [https://geo2france.github.io/ms2-panel-editor/](https://geo2france.github.io/ms2-panel-editor/)

The documentation is built and published by a GitHub Actions workflow on every push.

- **Home**: project overview and positioning
- **User guide**: functional usage and configuration
- **Technical guide**: architecture, local setup, build, and implementation notes

## User guide

The `panel_editor` user guide is split into 3 sections:

- **Presentation**: [Global overview](docs/user_guide/global_overview.en.md)
- **Configuration**: [Getting started](docs/user_guide/getting_started.en.md)
- **Role restrictions**: [Menus and toolbars](docs/user_guide/tools.en.md)

The plugin shows identified map features, lets users switch to edit mode, and applies per-layer permission rules.

## Technical guide

The technical documentation covers:

- plugin architecture
- local installation
- extension build
- configuration notes

Read it here: [docs/technical_guides/index.en.md](docs/technical_guides/index.en.md)
