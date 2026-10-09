# Panel Editor — MapStore 2025.02

Portage du plugin `panelEditor` de `../ms2-panel-editor` (MapStore 2024) sur la branche `2025.02.xx` de ce projet. Le sous-module MapStore2 est conservé à la révision `1950fed9555d47191726e0dcee7686b964221e87` (`v2025.02.03` plus un commit).

Le plugin permet de consulter, modifier et supprimer les attributs des entités identifiées. Il conserve les restrictions par rôle et zone géographique, les champs automatiques, les listes distantes et les traductions françaises, anglaises et italiennes.

## Développement

Installation et compilation vérifiées avec Node.js 22 et npm 10 :

```sh
npm install
npm run fe:start
```

Ouvrir `http://localhost:8081`, puis une carte. Le plugin est chargé par `js/extensions.js`. Sa configuration se trouve dans `configs/localConfig.json`, dans `plugins.desktop` sous le nom `panelEditor`.

Les couches `test:avis_urbanisme` et `test:avisee_projets` et l’URL `http://localhost/geoserver` proviennent du projet source : adapter ces valeurs à votre GeoServer et aux couches de votre carte. Les transactions nécessitent un service WFS-T accessible avec les droits correspondants.

## Validation et installation

```sh
npm run lint
npm test -- --browsers FirefoxHeadless
npm run ext:build
```

Les tests utilisent les reducers et le middleware Redux Observable de MapStore pour vérifier l’ouverture, la fermeture, la restauration de l’identification et l’espace réservé au panneau.

L’archive `dist/panelEditor.zip` contient l’extension à importer dans la bibliothèque des extensions de MapStore 2025.02. Ajouter ensuite `panelEditor` au contexte cible et configurer ses couches et ses droits.

La configuration fonctionnelle reste celle décrite dans la [documentation du plugin](https://geo2france.github.io/ms2-panel-editor/).

## Adaptations

- Code métier, composants, styles et traductions repris du plugin 2024.
- Imports des composants MapStore via l’alias `@mapstore`.
- Nom `panelEditor` utilisé pour le chargement, la configuration et l’archive.
- Ouverture et fermeture synchronisées avec l’état Redux après traitement de l’action, avec restauration du format et de l’état de l’identification.
- Configuration des tests reprise du socle MapStore sans le chargeur d’instrumentation obsolète et absent des dépendances déclarées.
- Aucune nouvelle dépendance de production.
