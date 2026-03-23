---
hide:
  - navigation
  - toc
---

# Accueil

`panel_editor` est un plugin MapStore dédié à la **lecture** et à l’**édition** d’attributs.

Le plugin est **indépendant des autres plugins MapStore**: il gère son état, ses actions Redux et ses règles d’accès sans dépendre d’une logique métier d’un autre plugin.

Ce dépôt `ms2-panel-editor` sert à la **gestion du projet**, à la préparation des **releases**, ainsi qu'aux **sources et au build de la documentation**.

Le **code source du plugin** est maintenu dans le dépôt [geo2france/MapStoreExtension](https://github.com/geo2france/MapStoreExtension), sur la branche [panel-editor](https://github.com/geo2france/MapStoreExtension/tree/panel-editor).

Cette organisation permet de **ne pas dupliquer le fork `MapStoreExtension`**. Si plusieurs plugins sont développés, il est plus simple de tous les aligner sur une même version de MapStore et d'éviter de dupliquer les dépendances MapStore en changeant simplement de branche, plutôt qu'en créant un fork distinct pour chaque extension.

Ce travail est financé par **Géo2France** : [https://www.geo2france.fr](https://www.geo2france.fr)
