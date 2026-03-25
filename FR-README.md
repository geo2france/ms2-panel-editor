# ms2-panel-editor

`panel_editor` est un plugin MapStore dedie a la **lecture** et a l'**edition** d'attributs.

Le plugin est **independant des autres plugins MapStore** : il gere son etat, ses actions Redux et ses regles d'acces sans dependre d'une logique metier d'un autre plugin.

Ce travail est finance par **Geo2France** : [https://www.geo2france.fr](https://www.geo2france.fr)

## Structure de la documentation

La documentation reprend la meme structure que le site MkDocs :

- **Accueil** : presentation et positionnement du projet
- **Guide utilisateur** : usage fonctionnel et configuration
- **Guide technique** : architecture, installation locale, build et notes d'implementation

## Guide utilisateur

Le guide utilisateur du plugin `panel_editor` est organise en 3 parties :

- **Presentation** : [Vue globale](docs/user_guide/global_overview.fr.md)
- **Configuration** : [Prendre en main](docs/user_guide/getting_started.fr.md)
- **Restrictions par roles** : [Barres ou menus d'outils](docs/user_guide/tools.fr.md)

Le plugin affiche les entites identifiees sur la carte, permet de passer en mode edition et applique les regles de droits definies par couche.

## Guide technique

La documentation technique couvre :

- l'architecture du plugin
- l'installation en local
- le build de l'extension
- les notes de configuration

Lire : [docs/technical_guides/index.fr.md](docs/technical_guides/index.fr.md)
