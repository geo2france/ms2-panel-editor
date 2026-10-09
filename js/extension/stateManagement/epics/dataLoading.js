import Rx from "rxjs";
import { LOAD_FEATURE_INFO } from "@mapstore/actions/mapInfo";
import { getDescribeFeatureType } from "../../requests/describeFeatureType";
import { getListFieldOptions } from "../../requests/listFieldOptions";
import { getConfiguredListFields, getWfsUrl, isRemoteListOptions } from "../../utiles/attributes";
import {
    PANEL_EDITOR_SET_SELECTED_RESPONSE_INDEX,
    describeFeatureTypeError,
    listFieldOptionsError,
    requestDescribeFeatureType,
    requestListFieldOptions,
    setDescribeFeatureType,
    setListFieldOptions
} from "../actions";
import {
    describeFeatureTypeRequestsSelector,
    isActive,
    listFieldOptionsRequestsSelector,
    listFieldOptionsSelector,
    pluginCfgSelector,
    selectedDescribeFeatureTypeSelector,
    selectedLayerConfigSelector,
    selectedResponseLayerNameSelector
} from "../selectors";

const getDescribeFeatureTypeParams = (state = {}) => {
    const pluginCfg = pluginCfgSelector(state);
    const selectedLayerName = selectedResponseLayerNameSelector(state);
    const layerConfig = selectedLayerConfigSelector(state);
    const describeFeatureTypes = describeFeatureTypeRequestsSelector(state);
    const wfsUrl = getWfsUrl(pluginCfg, layerConfig);

    return {
        selectedLayerName,
        typeName: layerConfig?.name || selectedLayerName,
        wfsUrl,
        isPending: !!describeFeatureTypes?.[selectedLayerName],
        hasDescribeFeatureType: !!selectedDescribeFeatureTypeSelector(state)
    };
};

const getListFieldOptionsParams = (state = {}) => {
    const selectedLayerName = selectedResponseLayerNameSelector(state);
    const layerConfig = selectedLayerConfigSelector(state);
    const pendingRequests = listFieldOptionsRequestsSelector(state);
    const loadedOptions = listFieldOptionsSelector(state);

    return getConfiguredListFields(layerConfig)
        .filter((field) => isRemoteListOptions(field?.options))
        .map((field) => {
            const requestKey = `${selectedLayerName}::${field.name}`;
            return {
                layerName: selectedLayerName,
                fieldName: field.name,
                url: field.options.url,
                sourceField: field.options.field,
                isPending: !!pendingRequests?.[requestKey],
                hasOptions: Array.isArray(loadedOptions?.[requestKey])
            };
        });
};

export const loadDescribeFeatureTypeEpic = (action$, store) =>
    action$
        .ofType(LOAD_FEATURE_INFO, PANEL_EDITOR_SET_SELECTED_RESPONSE_INDEX)
        .filter(() => isActive(store.getState()))
        .switchMap(() => {
            const state = store.getState();
            const {
                selectedLayerName,
                typeName,
                wfsUrl,
                isPending,
                hasDescribeFeatureType
            } = getDescribeFeatureTypeParams(state);

            if (!selectedLayerName || !typeName || !wfsUrl || isPending || hasDescribeFeatureType) {
                return Rx.Observable.empty();
            }

            return Rx.Observable.fromPromise(getDescribeFeatureType(wfsUrl, typeName))
                .map((describeFeatureType) => setDescribeFeatureType(selectedLayerName, describeFeatureType))
                .catch(() => Rx.Observable.of(describeFeatureTypeError(selectedLayerName)))
                .startWith(requestDescribeFeatureType(selectedLayerName));
        });

export const loadListFieldOptionsEpic = (action$, store) =>
    action$
        .ofType(LOAD_FEATURE_INFO, PANEL_EDITOR_SET_SELECTED_RESPONSE_INDEX)
        .filter(() => isActive(store.getState()))
        .switchMap(() => {
            const requests = getListFieldOptionsParams(store.getState())
                .filter(({ layerName, fieldName, url, sourceField, isPending, hasOptions }) =>
                    !!layerName && !!fieldName && !!url && !!sourceField && !isPending && !hasOptions
                );

            if (!requests.length) {
                return Rx.Observable.empty();
            }

            return Rx.Observable.from(requests)
                .mergeMap(({ layerName, fieldName, url, sourceField }) =>
                    Rx.Observable.fromPromise(getListFieldOptions(url, sourceField))
                        .map((options) => setListFieldOptions(layerName, fieldName, options))
                        .catch(() => Rx.Observable.of(listFieldOptionsError(layerName, fieldName)))
                        .startWith(requestListFieldOptions(layerName, fieldName))
                );
        });
