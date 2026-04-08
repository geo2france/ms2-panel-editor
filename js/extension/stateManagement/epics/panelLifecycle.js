import Rx from "rxjs";
import { TOGGLE_CONTROL, SET_CONTROL_PROPERTY } from "@mapstore/actions/controls";
import { UPDATE_MAP_LAYOUT, updateDockPanelsList, updateMapLayout } from "@mapstore/actions/maplayout";
import { changeMapInfoFormat, changeMapInfoState } from "@mapstore/actions/mapInfo";
import { resetPanelEditorState, setMapInfoPreviousFormat, setMapInfoWasEnabled } from "../actions";
import { PANEL_EDITOR_CONTROL } from "../../plugin/constants";
import {
    currentMapInfoFormatSelector,
    isActive,
    mapInfoPreviousFormatSelector,
    mapInfoWasEnabledSelector,
    pluginCfgSelector
} from "../selectors";

const isPanelEditorControlAction = (action = {}) =>
    action?.control === PANEL_EDITOR_CONTROL
    && (!action?.property || action?.property === "enabled");

const getCurrentPanelState = (state) => !!state?.controls?.[PANEL_EDITOR_CONTROL]?.enabled;

const getEnabledFromControlAction = (action = {}, state = {}) => {
    if (!isPanelEditorControlAction(action)) {
        return null;
    }
    if (action.type === TOGGLE_CONTROL) {
        return !getCurrentPanelState(state);
    }
    if (action.type === SET_CONTROL_PROPERTY) {
        return !!action?.value;
    }
    return null;
};

const PANEL_SIZE_EXTRA = 100;

const getPanelSize = (state = {}) => {
    const pluginCfg = pluginCfgSelector(state);
    const configuredSize = Number.isFinite(pluginCfg?.sizePanel)
        ? pluginCfg.sizePanel
        : pluginCfg?.size;
    const baseSize = Number.isFinite(configuredSize) ? configuredSize : 420;
    return baseSize + PANEL_SIZE_EXTRA;
};

export const syncIdentifyStateWithPanelEditorEpic = (action$, { getState }) =>
    action$
        .ofType(TOGGLE_CONTROL, SET_CONTROL_PROPERTY)
        .map((action) => ({ action, state: getState() }))
        .map(({ action, state }) => ({
            enabled: getEnabledFromControlAction(action, state),
            state
        }))
        .filter(({ enabled }) => enabled !== null)
        .switchMap(({ enabled, state }) => {
            if (enabled) {
                return Rx.Observable.empty();
            }
            return Rx.Observable.from([
                updateDockPanelsList(PANEL_EDITOR_CONTROL, "remove", "right"),
                resetPanelEditorState(),
                changeMapInfoState(mapInfoWasEnabledSelector(state)),
                changeMapInfoFormat(mapInfoPreviousFormatSelector(state)),
                setMapInfoWasEnabled(false)
            ]);
        });

export const registerPanelEditorDockPanelEpic = (action$, { getState }) =>
    action$
        .ofType(TOGGLE_CONTROL, SET_CONTROL_PROPERTY)
        .map((action) => ({ action, state: getState() }))
        .map(({ action, state }) => ({
            enabled: getEnabledFromControlAction(action, state),
            state
        }))
        .filter(({ enabled }) => enabled === true)
        .switchMap(({ state }) => Rx.Observable.from([
            updateDockPanelsList(PANEL_EDITOR_CONTROL, "add", "right"),
            setMapInfoWasEnabled(!!state?.mapInfo?.enabled),
            setMapInfoPreviousFormat(currentMapInfoFormatSelector(state)),
            changeMapInfoState(false),
            changeMapInfoFormat("application/json")
        ]));

export const updatePanelEditorLayoutEpic = (action$, store) =>
    action$
        .ofType(UPDATE_MAP_LAYOUT)
        .filter(() => isActive(store.getState()))
        .filter(({ source }) => source !== PANEL_EDITOR_CONTROL)
        .map(({ layout }) => {
            const size = getPanelSize(store.getState());
            const sidebarRight = layout?.boundingSidebarRect?.right ?? 0;
            const rightOffset = size + sidebarRight;
            const action = updateMapLayout({
                ...layout,
                right: rightOffset,
                boundingMapRect: {
                    ...(layout?.boundingMapRect || {}),
                    right: rightOffset
                },
                rightPanel: true
            });
            return { ...action, source: PANEL_EDITOR_CONTROL };
        });
