import expect from "expect";
import { createStore, combineReducers, applyMiddleware } from "redux";
import { combineEpics, createEpicMiddleware } from "redux-observable";
import { clickOnMap, REGISTER_EVENT_LISTENER, UNREGISTER_EVENT_LISTENER } from "@mapstore/actions/map";
import { FEATURE_INFO_CLICK } from "@mapstore/actions/mapInfo";
import panelEditor from "../../reducer";
import { setEditMode, setGeocodingPickField, resetPanelEditorState, setSelectedFeatureIndex } from "../../actions";
import { geocodingMapClickEpic, geocodingMapListenerEpic } from "../geocoding";
import { requestFeatureInfoOnMapClickEpic } from "../featureInfo";

const makeStore = () => {
    const actions = [];
    const record = () => (next) => (action) => { actions.push(action); return next(action); };
    const store = createStore(combineReducers({
        panelEditor,
        controls: (state = { panelEditor: { enabled: true } }) => state,
        mapInfo: (state = { enabled: false }) => state
    }), applyMiddleware(record, createEpicMiddleware(combineEpics(
        geocodingMapClickEpic, geocodingMapListenerEpic, requestFeatureInfoOnMapClickEpic
    ))));
    store.dispatch(setEditMode(true));
    return { store, actions };
};

describe("Panel Editor geocoding map interaction", () => {
    it("captures one click for the requested field and stops picking without identifying another feature", () => {
        const { store, actions } = makeStore();
        store.dispatch(setGeocodingPickField("adresse"));
        expect(actions.some((action) => action.type === REGISTER_EVENT_LISTENER && action.toolName === "panelEditorGeocoding")).toBe(true);
        store.dispatch(clickOnMap({ latlng: { lng: 2.3, lat: 48.8 } }));
        expect(store.getState().panelEditor.geocodingPoint).toEqual({ field: "adresse", x: 2.3, y: 48.8 });
        expect(store.getState().panelEditor.geocodingPickField).toBe("");
        expect(store.getState().panelEditor.editMode).toBe(true);
        expect(actions.some((action) => action.type === FEATURE_INFO_CLICK)).toBe(false);
        expect(actions[actions.length - 1].type).toBe(UNREGISTER_EVENT_LISTENER);
        const point = store.getState().panelEditor.geocodingPoint;
        store.dispatch(clickOnMap({ latlng: { lng: 3, lat: 49 } }));
        expect(store.getState().panelEditor.geocodingPoint).toBe(point);
    });

    it("publishes the point and deactivates picking in the same state update", () => {
        const { store } = makeStore();
        const states = [];
        store.dispatch(setGeocodingPickField("adresse"));
        const unsubscribe = store.subscribe(() => { states.push(store.getState().panelEditor); });
        store.dispatch(clickOnMap({ latlng: { lng: 2.3, lat: 48.8 } }));
        unsubscribe();
        const pointStates = states.filter((state) => !!state.geocodingPoint);
        expect(pointStates.length > 0).toBe(true);
        pointStates.forEach((state) => expect(state.geocodingPickField).toBe(""));
    });

    it("clears the previous point when starting another pick", () => {
        const { store } = makeStore();
        store.dispatch(setGeocodingPickField("adresse"));
        store.dispatch(clickOnMap({ latlng: { lng: 2.3, lat: 48.8 } }));
        store.dispatch(setGeocodingPickField("adresse"));
        expect(store.getState().panelEditor.geocodingPoint).toBe(null);
        store.dispatch(setGeocodingPickField());
        expect(store.getState().panelEditor.geocodingPoint).toBe(null);
    });

    it("cleans up picking on cancellation, feature changes and panel reset", () => {
        [setEditMode(false), setSelectedFeatureIndex(1), resetPanelEditorState()].forEach((stop) => {
            const { store, actions } = makeStore();
            store.dispatch(setGeocodingPickField("adresse"));
            store.dispatch(stop);
            expect(store.getState().panelEditor.geocodingPickField).toBe("");
            expect(store.getState().panelEditor.geocodingPoint).toBe(null);
            expect(actions[actions.length - 1].type).toBe(UNREGISTER_EVENT_LISTENER);
        });
    });

    it("routes a click to the latest field and allows cancelling the picker", () => {
        const { store, actions } = makeStore();
        store.dispatch(setGeocodingPickField("adresse"));
        store.dispatch(setGeocodingPickField("autre_adresse"));
        store.dispatch(clickOnMap({ latlng: { lng: 0, lat: 0 } }));
        expect(store.getState().panelEditor.geocodingPoint.field).toBe("autre_adresse");
        store.dispatch(setGeocodingPickField("adresse"));
        store.dispatch(setGeocodingPickField());
        expect(store.getState().panelEditor.geocodingPickField).toBe("");
        expect(actions[actions.length - 1].type).toBe(UNREGISTER_EVENT_LISTENER);
    });
});
