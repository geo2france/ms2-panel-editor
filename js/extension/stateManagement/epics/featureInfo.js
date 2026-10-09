import Rx from "rxjs";
import { featureInfoClick } from "@mapstore/actions/mapInfo";
import { CLICK_ON_MAP } from "@mapstore/actions/map";
import { getLayersList } from "../../utiles/attributes";
import { setEditMode } from "../actions";
import { isActive, pluginCfgSelector } from "../selectors";

export const requestFeatureInfoOnMapClickEpic = (action$, store) =>
    action$
        .ofType(CLICK_ON_MAP)
        .filter(({ point }) => {
            const state = store.getState();
            return !!point && isActive(state) && state?.mapInfo?.enabled === false;
        })
        .switchMap(({ point, layer }) => {
            const pluginCfg = pluginCfgSelector(store.getState());
            const configuredLayerNames = getLayersList(pluginCfg)
                .map((layerConfig) => layerConfig?.name)
                .filter(Boolean);

            if (!configuredLayerNames.length) {
                return Rx.Observable.of(
                    setEditMode(false),
                    featureInfoClick(point, layer)
                );
            }

            const overrideParams = configuredLayerNames.reduce((acc, layerName) => ({
                ...acc,
                [layerName]: {
                    info_format: "application/json"
                }
            }), {});

            return Rx.Observable.of(
                setEditMode(false),
                featureInfoClick(point, layer || configuredLayerNames[0], configuredLayerNames, overrideParams)
            );
        });
