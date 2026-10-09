import React, { useState } from "react";
import expect from "expect";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import GeocodingInputControl from "../GeocodingInputControl";
import renderInputByType from "../renderInputByType";
import { resolveFieldDefinition } from "../../../utiles/attributes";
import { Provider, connect } from "react-redux";
import { createStore } from "redux";
import reducer from "../../../stateManagement/reducer";
import { updateFormValue } from "../../../stateManagement/actions";
import PanelEditor from "../../PanelEditor";
import { getFeatureGeocodingPoint } from "../../../utiles/geocoding";

const label = "10 rue de la Paix 75002 Paris";
const response = (features = [{
    geometry: { type: "Point", coordinates: [2.331, 48.869] }, properties: { label }
}]) => ({ ok: true, json: () => Promise.resolve({ features }) });
const completionResponse = (results = [{ fulltext: label, x: 2.331, y: 48.869 }]) => ({
    ok: true, json: () => Promise.resolve({ status: "OK", results })
});
const ControlledInput = (props) => {
    const [value, setValue] = useState(props.value || "");
    return (
        <GeocodingInputControl {...props} value={value} onChange={(next) => {
            setValue(next);
            props.onChange?.(next);
        }} />
    );
};
const pause = () => new Promise((resolve) => setTimeout(resolve, 400));
const typeAddress = async(view, text = "rue de la Paix") => {
    await act(async() => {
        fireEvent.change(view.getByLabelText("Adresse"), { target: { value: text } });
    });
    await act(async() => { await pause(); });
};

describe("GeocodingInputControl", () => {
    let originalFetch;
    let requests;
    beforeEach(() => {
        originalFetch = window.fetch;
        requests = [];
        window.fetch = (url) => {
            requests.push(new URL(url));
            return Promise.resolve(new URL(url).pathname.endsWith("reverse") ? response() : completionResponse());
        };
    });
    afterEach(() => { cleanup(); window.fetch = originalFetch; });

    it("registers both types and supports string booleans in compact configuration", () => {
        expect(renderInputByType({ type: "geocoding" }).type).toBe(GeocodingInputControl);
        expect(renderInputByType({ type: "reverse-geocoding" }).props.reverseOnly).toBe(true);
        ["geocoding", "reverse-geocoding"].forEach((type) => {
            const definition = resolveFieldDefinition("adresse", "", {
                fields: [["adresse", "adresse", type, "true", "false", []]]
            });
            expect(definition.editable).toBe(true);
            expect(definition.required).toBe(false);
            expect(definition.type).toBe(type);
        });
        expect(resolveFieldDefinition("adresse", "", {
            fields: [["adresse", "adresse", "geocoding", "false", "true", []]]
        }).editable).toBe(false);
    });

    it("searches when the field value is controlled by Redux as in PanelEditor", async() => {
        const store = createStore(reducer);
        const Control = connect((state) => ({ value: state.formValues.adresse || "" }), {
            onChange: (value) => updateFormValue("adresse", value)
        })((props) => renderInputByType({ ...props, type: "geocoding", locale: "fr" }));
        const view = render(<Provider store={store}><Control /></Provider>);
        await typeAddress(view);
        expect(store.getState().formValues.adresse).toBe("rue de la Paix");
        expect(requests.length).toBe(1);
        expect(view.getByText(label)).toExist();
    });

    it("shows autocomplete in the actual attributes panel after a Redux update", async() => {
        const store = createStore(reducer);
        const Panel = connect((state) => ({ formValues: state.formValues }), {
            onUpdateField: updateFormValue
        })(PanelEditor);
        const view = render(<Provider store={store}><Panel
            enabled editMode locale="fr" selectedAttributes={{ adresse: "" }}
            responseOptions={[{ value: 0, label: "Couche" }]}
            layerConfig={{ fields: [["adresse", "adresse", "geocoding", "true", "false", []]] }}
        /></Provider>);
        await typeAddress(view);
        expect(store.getState().formValues.adresse).toBe("rue de la Paix");
        expect(requests.length).toBe(1);
        expect(view.getByText(label)).toExist();
    });

    ["geocoding", "reverse-geocoding"].forEach((type) => {
        it(`uses the configured service in the panel for ${type}`, async() => {
            const store = createStore(reducer);
            const Panel = connect((state) => ({ formValues: state.formValues }), {
                onUpdateField: updateFormValue
            })(PanelEditor);
            const view = render(<Provider store={store}><Panel
                enabled editMode locale="fr" selectedAttributes={{ adresse: "" }}
                cfg={{ geocodingService: "https://example.org/custom/geocoding/" }}
                selectedFeature={type === "reverse-geocoding" ? { geometry: { type: "Point", coordinates: [2.3, 48.8] } } : null}
                responseOptions={[{ value: 0, label: "Couche" }]}
                layerConfig={{ fields: [["adresse", "Adresse", type, true, false, []]] }}
            /></Provider>);
            if (type === "geocoding") {
                await typeAddress(view);
            } else {
                await act(async() => {});
            }
            expect(requests.length).toBe(1);
            expect(requests[0].origin).toBe("https://example.org");
            expect(requests[0].pathname).toBe(`/custom/geocoding/${type === "geocoding" ? "completion/" : "reverse"}`);
        });
    });

    it("does not search an existing address when entering edit mode, then searches user changes", async() => {
        const store = createStore(reducer);
        store.dispatch(updateFormValue("adresse", label));
        const Panel = connect((state) => ({ formValues: state.formValues }), {
            onUpdateField: updateFormValue
        })(PanelEditor);
        const props = {
            enabled: true, locale: "fr", selectedAttributes: { adresse: label },
            selectedFeature: { geometry: { type: "Point", coordinates: [2.3, 48.8] } },
            responseOptions: [{ value: 0, label: "Couche" }],
            layerConfig: { fields: [["adresse", "adresse", "geocoding", "true", "false", []]] }
        };
        const view = render(<Provider store={store}><Panel {...props} /></Provider>);
        view.rerender(<Provider store={store}><Panel {...props} editMode /></Provider>);
        await act(async() => { await pause(); });
        expect(view.getByLabelText("Adresse").value).toBe(label);
        expect(requests.length).toBe(0);
        await typeAddress(view);
        expect(requests.length).toBe(1);
        expect(requests[0].searchParams.get("text")).toBe("rue de la Paix");
        expect(view.getByText(label)).toExist();
    });

    ["geocoding", "reverse-geocoding"].forEach((type) => {
        it(`initializes an empty ${type} address from the feature point in its source CRS`, async() => {
            const store = createStore(reducer);
            const Panel = connect((state) => ({ formValues: state.formValues }), {
                onUpdateField: updateFormValue
            })(PanelEditor);
            const view = render(<Provider store={store}><Panel
                enabled editMode locale="fr" featureProjection="EPSG:3857"
                selectedFeature={{ geometry: { type: "Point", coordinates: [111319.49079327357, 111325.1428663851] } }}
                selectedAttributes={{ adresse: "", longitude: null, latitude: null }}
                responseOptions={[{ value: 0, label: "Couche" }]}
                layerConfig={{ fields: [
                    ["adresse", "adresse", type, true, false, [], { xField: "longitude", yField: "latitude" }],
                    ["longitude", "longitude", "number"], ["latitude", "latitude", "number"]
                ] }}
            /></Provider>);
            await act(async() => {});
            expect(requests.length).toBe(1);
            expect(requests[0].pathname).toBe("/geocodage/reverse");
            expect(Math.abs(Number(requests[0].searchParams.get("lon")) - 1) < 0.000001).toBe(true);
            expect(Math.abs(Number(requests[0].searchParams.get("lat")) - 1) < 0.000001).toBe(true);
            expect(view.getByLabelText("Adresse").value).toBe(label);
            expect(store.getState().formValues.adresse).toBe(label);
            expect(Math.abs(store.getState().formValues.longitude - 1) < 0.000001).toBe(true);
            if (type === "geocoding") {
                fireEvent.change(view.getByLabelText("Adresse"), { target: { value: "" } });
                await act(async() => { await pause(); });
                expect(store.getState().formValues.adresse).toBe("");
                expect(requests.length).toBe(1);
            }
        });
    });

    it("ignores unsupported geometries and does not initialize a disabled address", async() => {
        expect(getFeatureGeocodingPoint({ type: "Polygon", coordinates: [] })).toBe(null);
        expect(getFeatureGeocodingPoint({ type: "Point", coordinates: [null, 48] })).toBe(null);
        expect(getFeatureGeocodingPoint({ type: "Point", coordinates: [2, 48] }, "unknown")).toBe(null);
        render(<GeocodingInputControl disabled initialPoint={{ x: 2.3, y: 48.8 }} />);
        await act(async() => {});
        expect(requests.length).toBe(0);
    });

    it("does not overwrite user input with a late default address", async() => {
        let resolveRequest;
        window.fetch = () => new Promise((resolve) => { resolveRequest = resolve; });
        const view = render(<ControlledInput locale="fr" initialPoint={{ x: 2.3, y: 48.8 }} />);
        fireEvent.change(view.getByLabelText("Adresse"), { target: { value: "Ma" } });
        await act(async() => { resolveRequest(response()); });
        expect(view.getByLabelText("Adresse").value).toBe("Ma");
    });

    it("debounces input, shows suggestions and updates address and XY on selection", async() => {
        const onChange = expect.createSpy();
        const onCoordinatesChange = expect.createSpy();
        const view = render(<ControlledInput locale="fr" onChange={onChange} onCoordinatesChange={onCoordinatesChange} />);
        fireEvent.change(view.getByLabelText("Adresse"), { target: { value: "ru" } });
        await act(async() => { await pause(); });
        expect(requests.length).toBe(0);
        fireEvent.change(view.getByLabelText("Adresse"), { target: { value: "rue" } });
        await typeAddress(view);
        expect(requests.length).toBe(1);
        expect(requests[0].pathname).toBe("/geocodage/completion/");
        expect(requests[0].searchParams.get("text")).toBe("rue de la Paix");
        expect(requests[0].searchParams.get("type")).toBe("StreetAddress");
        expect(view.getByLabelText("Adresse").getAttribute("aria-expanded")).toBe("true");
        expect(onCoordinatesChange).toNotHaveBeenCalled();
        fireEvent.click(view.getByText(label));
        expect(onChange).toHaveBeenCalledWith(label);
        expect(onCoordinatesChange).toHaveBeenCalledWith({ x: 2.331, y: 48.869 });
        view.rerender(<ControlledInput locale="fr" onChange={onChange} onCoordinatesChange={onCoordinatesChange} />);
        await act(async() => { await pause(); });
        expect(requests.length).toBe(1);
        expect(view.getByLabelText("Adresse").getAttribute("aria-expanded")).toBe("false");
    });

    it("toggles map picking and reverse geocodes the clicked point without snapping XY", async() => {
        const onChange = expect.createSpy();
        const onCoordinatesChange = expect.createSpy();
        const onMapPickToggle = expect.createSpy();
        const props = { locale: "fr", onChange, onCoordinatesChange, onMapPickToggle, reverseOnly: true };
        const view = render(<GeocodingInputControl {...props} />);
        expect(view.getByLabelText("Adresse").readOnly).toBe(true);
        const button = view.getByRole("button", { name: "Choisir un point sur la carte pour retrouver l’adresse" });
        fireEvent.click(button);
        expect(onMapPickToggle).toHaveBeenCalled();
        view.rerender(<GeocodingInputControl {...props} pickActive />);
        expect(button.getAttribute("aria-pressed")).toBe("true");
        expect(view.getByText("Cliquez sur la carte pour retrouver l’adresse. Recliquez sur le bouton pour annuler.")).toExist();
        await act(async() => {
            view.rerender(<GeocodingInputControl {...props} mapPoint={{ x: 0, y: 48 }} />);
        });
        expect(onChange).toHaveBeenCalledWith(label);
        expect(requests[0].pathname).toBe("/geocodage/reverse");
        expect(requests[0].searchParams.get("lon")).toBe("0");
        expect(requests[0].searchParams.get("lat")).toBe("48");
        expect(onCoordinatesChange).toHaveBeenCalledWith({ x: 0, y: 48 });
    });

    it("selects a MapStore suggestion with ArrowDown and Enter", async() => {
        const onCoordinatesChange = expect.createSpy();
        const view = render(<ControlledInput locale="fr" onCoordinatesChange={onCoordinatesChange} />);
        await typeAddress(view);
        const input = view.getByLabelText("Adresse");
        fireEvent.keyDown(input, { key: "ArrowDown" });
        fireEvent.keyDown(input, { key: "Enter" });
        expect(input.value).toBe(label);
        expect(input.getAttribute("aria-expanded")).toBe("false");
        expect(onCoordinatesChange).toHaveBeenCalledWith({ x: 2.331, y: 48.869 });
        expect(onCoordinatesChange.calls.length).toBe(1);
        await act(async() => { await pause(); });
        expect(requests.length).toBe(1);
    });

    it("keeps reverse geocoding alive when the picker deactivates after receiving the point", async() => {
        let resolveRequest;
        let signal;
        window.fetch = (url, options) => {
            signal = options.signal;
            return new Promise((resolve) => { resolveRequest = resolve; });
        };
        const onChange = expect.createSpy();
        const point = { x: 2.3, y: 48.8 };
        const view = render(<GeocodingInputControl locale="fr" value="Ancienne adresse" pickActive onChange={onChange} />);
        await act(async() => {
            view.rerender(<GeocodingInputControl locale="fr" value="Ancienne adresse" pickActive mapPoint={point} onChange={onChange} />);
        });
        await act(async() => {
            view.rerender(<GeocodingInputControl locale="fr" value="Ancienne adresse" mapPoint={point} onChange={onChange} />);
        });
        expect(signal.aborted).toBe(false);
        await act(async() => { resolveRequest(response()); });
        expect(onChange).toHaveBeenCalledWith(label);
    });

    it("blocks disabled actions and invalid map coordinates", async() => {
        const onMapPickToggle = expect.createSpy();
        const view = render(<GeocodingInputControl locale="fr" disabled onMapPickToggle={onMapPickToggle} />);
        expect(view.getByLabelText("Adresse").disabled).toBe(true);
        fireEvent.click(view.getByRole("button", { name: "Choisir un point sur la carte pour retrouver l’adresse" }));
        expect(onMapPickToggle).toNotHaveBeenCalled();
        await act(async() => {
            view.rerender(<GeocodingInputControl locale="fr" mapPoint={{ x: 181, y: 48 }} />);
        });
        expect(requests.length).toBe(0);
    });

    it("reports empty results and service errors without selecting a value", async() => {
        const onCoordinatesChange = expect.createSpy();
        window.fetch = () => Promise.resolve(completionResponse([]));
        const view = render(<ControlledInput locale="fr" onCoordinatesChange={onCoordinatesChange} />);
        await typeAddress(view);
        expect(view.getByText("Aucune adresse trouvée.")).toExist();
        window.fetch = () => Promise.resolve({ ok: false });
        await typeAddress(view, "Lille");
        expect(view.getByText("Le service de géocodage est indisponible. Réessayez.")).toExist();
        expect(onCoordinatesChange).toNotHaveBeenCalled();
    });

    it("ignores late responses when switching to map picking", async() => {
        let resolveRequest;
        window.fetch = () => new Promise((resolve) => { resolveRequest = resolve; });
        const view = render(<ControlledInput locale="fr" />);
        await typeAddress(view);
        view.rerender(<ControlledInput locale="fr" pickActive />);
        await act(async() => { resolveRequest(completionResponse()); });
        expect(view.queryByText(label)).toBe(null);
        expect(view.getByLabelText("Adresse").readOnly).toBe(true);
    });
});
