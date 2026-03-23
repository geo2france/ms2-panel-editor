# Configuring a ReadTheDocs Project

## Python Requirements

They will be picked up by the ReadTheDocs compiler, so make sure to keep them up-to-date!

## Adding a `.readthedocs.yaml` Configuration File

**In the `docs` directory, create a `.readthedocs.yaml` file.** The settings in this file will be used for the compilation on Read The Docs (RTD).

```yaml
# .readthedocs.yaml
# Read the Docs configuration file
# See https://docs.readthedocs.io/en/stable/config-file/v2.html for details

# Required
version: 2

# Set the version of Python and other tools you might need
build:
  os: ubuntu-22.04
  tools:
    python: "3.11"

mkdocs:
  configuration: mkdocs.yml

# Optionally declare the Python requirements required to build your docs
python:
   install:
   - requirements: mkdocs_requirements.txt
```

## Creating a New RTD Project

* Go to the page [https://readthedocs.org/dashboard/](https://readthedocs.org/dashboard/).
* Click on `Import a project`.
* Click the `Import manually` button.
* Enter a name/code for the product that follows the geOrchestra documentation project naming rules:
  * All names should start with `georchestra` followed by the product name, separated by a hyphen. Example: `georchestra-cadastrapp`
  * If it’s a plugin for a product, name it according to this example: `georchestra-mapstore2-urbanisme`
* Paste the URL of the repository hosted on GitHub (or another online repository).
* **IMPORTANT** Manually specify the default branch name for the project: `master` for older projects, `main` for recent ones.
* Check the box `Edit project’s advanced options`.
* Documentation type: `Mkdocs`.
* Language: `French`.
* Click on `Finish` => the RTD project is created.

At this stage: test a compilation.
If it passes: you can manually trigger a documentation build.

## Building a Release

TODO

## Configuring the Webhook

Setting up a webhook is necessary if you want an automatic build for every commit on a specific branch.

[https://docs.readthedocs.io/en/latest/integrations.html](https://docs.readthedocs.io/en/latest/integrations.html)

* On the project page, at the top, click on `Admin`.
* In the left sidebar, choose `Integrations`.
* A `GitHub Incoming Webhook` is created automatically. However, at this stage, it is inactive due to permissions on GitHub (unless authenticated via GitHub on RTD).
* Copy the URL link.
* Go to the GitHub project page.
* Navigate to Settings > Webhooks.
* Click on the `Add webhook` button.
* Paste the URL in `Payload URL`.
* Content type: `application/json`.
* Secret: copy-paste the code.
* Check the option `Let me select individual events.` and choose:
  * Pull requests
  * Pushes
  * Releases
* Finally, at the bottom, click on the `Add webhook` button.

To test if the webhook is working for the selected events, simply modify a file and push the change to GitHub. If `Pushes` was selected, then, on the RTD site, check the `Builds` tab to see if a build is in progress.
