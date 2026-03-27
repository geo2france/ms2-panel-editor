# Guide technique

## Architecture plugin

Organisation du code :

- `js/extension/components` : UI React (sans I/O direct).
- `js/extension/stateManagement` : actions, reducer, selectors, epics.
- `js/extension/requests` : appels I/O (WFS, zone de compétence).
- `js/extension/utiles` : helpers purs (permissions, attributs, champs auto, i18n, géométrie).
- `js/extension/plugin` : wiring MapStore (`createPlugin`, reducers, epics).

Flux Redux attendu :

1. Le composant dispatch une action.
2. Un epic intercepte et appelle `requests`.
3. Succès/erreur renvoient des actions Redux.
4. Les selectors alimentent l’UI.

## Installer en local

Prérequis :

- Node.js et npm
- dépôt cloné avec submodule MapStore2

Commandes :

```bash
npm install
npm start
```

Application disponible sur `http://localhost:8081`.

## Build extension

```bash
npm run ext:build
```

Le zip d’extension est généré dans `dist/`.

## Notes de configuration

- Le plugin est déclaré dans `assets/index.json` avec le nom `panel_editor`.
- Le nom d’extension est défini dans `config.js`.
- La configuration d’exécution se fait dans `configs/localConfig.json`.
- Les champs automatiques (`auto`) sont résolus dans les helpers, puis injectés dans la transaction au moment de la sauvegarde.
- Les types `auto` supportés incluent `header`, `date`, `area`, `length` et `value`. Les unités par défaut sont `m²` pour `area` et `m` pour `length`.
- Pour `auto: ["...", "header", source]`, la documentation supporte uniquement `source = "name"` ou `source = "role"`, lus depuis `currentUser` (géré et fournis par MapStore2 lors du mapping entre georchestra et le fonctionnement de mapstore).
- Les champs `list` acceptent une liste statique, une source JSON distante `{ url, field }`, ou une liste vide pour déduire les valeurs depuis les entités déjà chargées.
- La visibilité des champs distingue lecture et écriture : `hidden` masque en lecture, tandis qu’en écriture un champ `hidden` peut être réaffiché s’il est configuré dans `fields`.
- Les permissions de couche supportent `allowEdit`, `allowEditRoles`, puis le fallback historique `edit` / `editingRoles`.
- `restrictedArea` peut s’appuyer soit sur un `wkt` / `wtk`, soit sur une `url` JSON. Aucun endpoint par défaut n’est imposé.
- Le `wkt` / `wtk` est interprété en `EPSG:4326`, puis reprojeté vers le CRS des features Identify avant les tests `WITHIN` / `INTERSECTS` / `CONTAINS`.
- Le résultat de `restrictedArea` est évalué avant l’entrée en édition et, combiné au contrôle de rôles, alimente l’état d’interface (`lock`, `record`, ou les deux).
- En mode édition, les sélecteurs de couche et d’entité sont désactivés pour empêcher un changement de contexte avant validation ou annulation.
- Le bouton de suppression dépend d’un double contrôle : visibilité via `allowDelete`, puis activation selon les droits `delete` / `deletionRoles`.
- La couche `requests` valide aussi le contenu XML des réponses WFS-T : un HTTP `200` contenant une erreur OGC/WFS est renvoyé comme erreur applicative.

## Référence complémentaire

Pour plus de détails sur le modèle d’extension et les plugins MapStore, voir le dépôt officiel :

- [MapStoreExtension (GeoSolutions)](https://github.com/geosolutions-it/MapStoreExtension)
