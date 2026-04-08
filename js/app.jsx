/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { checkForMissingPlugins } from '@mapstore/utils/DebugUtils';
import main from '@mapstore/product/main';
const ConfigUtils = require('@mapstore/utils/ConfigUtils').default;
/**
 * Add custom (overriding) translations with:
 *
 * ConfigUtils.setConfigProp('translationsPath', ['./MapStore2/web/client/translations', './translations']);
 */
ConfigUtils.setConfigProp('translationsPath', './MapStore2/web/client/translations');
ConfigUtils.setConfigProp('themePrefix', 'MapStoreExtension');
/**
 * Use a custom plugins configuration file with:
 *
 * ConfigUtils.setLocalConfigurationFile('configs/localConfig.json');
 *
 * Use a custom application configuration file with:
 *
 * const appConfig = require('./appConfig');
 *
 * Or override the application configuration file with (e.g. only one page with a mapviewer) - in this case the map loaded will be `config.json` in the root of the app:
 *
 * const appConfig = {
 *     ...require('@mapstore/product/appConfig').default,
 *     pages: [{
 *         name: "mapviewer",
 *         path: "/",
 *         component: require('@mapstore/product/pages/MapViewer').default
 *     }]
 * };
 */
// const appConfig = require('@mapstore/product/appConfig').default;

ConfigUtils.setLocalConfigurationFile('configs/localConfig.json');
const appConfig = {
    ...require('@mapstore/product/appConfig').default,
    pages: [{
        name: "mapviewer",
        path: "/",
        component: require('@mapstore/product/pages/MapViewer').default
    }]
};

/**
 * Define a custom list of plugins with:
 *
 * const plugins = require('./plugins');
 */
const plugins = require('@mapstore/product/plugins').default;

// Import plugin directly in application. Comment the 3 lines below to test the extension live.
const extensions = require('./extensions').default;
plugins.plugins = { ...plugins.plugins, ...extensions };
ConfigUtils.setConfigProp('translationsPath', ['./MapStore2/web/client/translations', './assets/translations']);
// end of lines to comment
checkForMissingPlugins(plugins.plugins);

main(appConfig, plugins);
