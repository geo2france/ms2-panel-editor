import { CLICK_ON_MAP, registerEventListener, unRegisterEventListener } from "@mapstore/actions/map";
import {
    PANEL_EDITOR_SET_GEOCODING_PICK_FIELD,
    PANEL_EDITOR_SET_GEOCODING_POINT,
    PANEL_EDITOR_SET_EDIT_MODE,
    PANEL_EDITOR_SET_SELECTED_FEATURE_INDEX,
    PANEL_EDITOR_SET_SELECTED_RESPONSE_INDEX,
    PANEL_EDITOR_RESET,
    PANEL_EDITOR_SETUP,
    setGeocodingPoint
} from "../actions";
import { isActive } from "../selectors";

const TOOL = "panelEditorGeocoding";

export const geocodingMapListenerEpic = (action$, { getState }) => action$
    .ofType(PANEL_EDITOR_SET_GEOCODING_PICK_FIELD, PANEL_EDITOR_SET_GEOCODING_POINT, PANEL_EDITOR_SET_EDIT_MODE,
        PANEL_EDITOR_SET_SELECTED_FEATURE_INDEX, PANEL_EDITOR_SET_SELECTED_RESPONSE_INDEX,
        PANEL_EDITOR_RESET, PANEL_EDITOR_SETUP)
    .map(() => {
        const state = getState();
        return isActive(state) && state.panelEditor?.editMode && state.panelEditor?.geocodingPickField
            ? registerEventListener("click", TOOL)
            : unRegisterEventListener("click", TOOL);
    });

export const geocodingMapClickEpic = (action$, { getState }) => action$
    .ofType(CLICK_ON_MAP)
    .filter(({ point }) => {
        const state = getState();
        return isActive(state) && state.panelEditor?.editMode && !!state.panelEditor?.geocodingPickField
            && Number.isFinite(point?.latlng?.lng) && Number.isFinite(point?.latlng?.lat);
    })
    .map(({ point }) => setGeocodingPoint(getState().panelEditor.geocodingPickField, { x: point.latlng.lng, y: point.latlng.lat }));
