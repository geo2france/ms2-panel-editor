import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, Glyphicon, HelpBlock } from "react-bootstrap";
import { Combobox } from "react-widgets";
import uniqueId from "lodash/uniqueId";
import AutocompleteListItem from "@mapstore/components/data/query/AutocompleteListItem";
import { t } from "../../utiles/i18n";

const DEFAULT_SERVICE_URL = "https://data.geopf.fr/geocodage";
const isCoordinate = (value, max) => typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= max;
const GeocodingSuggestion = (props) => <AutocompleteListItem {...props} textField="label" valueField="label" />;

const GeocodingInputControl = ({ value, onChange, onCoordinatesChange, disabled, locale,
    reverseOnly, pickActive, mapPoint, onMapPickToggle, initialPoint, geocodingService }) => {
    const serviceUrl = (geocodingService?.trim() || DEFAULT_SERVICE_URL).replace(/\/+$/, "");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [open, setOpen] = useState(false);
    const [labelId] = useState(() => uniqueId("panel-editor-geocoding-label-"));
    const request = useRef(0);
    const controller = useRef(null);
    const timer = useRef(null);
    // Keep the address already present when opening the editor without looking it up.
    const selectedAddress = useRef(value ?? "");

    const invalidate = () => {
        clearTimeout(timer.current);
        request.current += 1;
        controller.current?.abort();
        setLoading(false);
        setResults([]);
        setOpen(false);
        setMessage("");
    };

    const selectResult = (result, point) => {
        invalidate();
        selectedAddress.current = result.label;
        onChange(result.label);
        onCoordinatesChange(point ? { x: point.x, y: point.y } : { x: result.x, y: result.y });
    };

    const search = async(text, point) => {
        invalidate();
        const id = request.current;
        try {
            controller.current = new AbortController();
            setLoading(true);
            const params = new URLSearchParams(point
                ? { index: "address", limit: "1", lon: point.x, lat: point.y }
                : { text: text.trim(), type: "StreetAddress", maximumResponses: "5" });
            const response = await fetch(`${serviceUrl}/${point ? "reverse" : "completion/"}?${params}`, {
                signal: controller.current.signal
            });
            if (!response.ok) {
                throw new Error("Geocoding request failed");
            }
            const data = await response.json();
            if (id !== request.current) {
                return;
            }
            const candidates = (point
                ? (Array.isArray(data.features) ? data.features : [])
                    .filter((feature) => feature?.geometry?.type === "Point")
                    .map((feature) => ({ label: feature.properties?.label,
                        x: feature.geometry.coordinates?.[0], y: feature.geometry.coordinates?.[1] }))
                : (Array.isArray(data.results) ? data.results : [])
                    .map((result) => ({ label: result.fulltext, x: result.x, y: result.y }))
            ).filter((result) => result.label && isCoordinate(result.x, 180) && isCoordinate(result.y, 90));
            if (!candidates.length) {
                setMessage(t(locale, "geocodingNoResults"));
            } else if (point) {
                selectResult(candidates[0], point);
            } else {
                setResults(candidates);
                setOpen(true);
            }
        } catch (error) {
            if (id === request.current) {
                setMessage(t(locale, "geocodingError"));
            }
        } finally {
            if (id === request.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        invalidate();
        const text = String(value ?? "");
        if (!disabled && !reverseOnly && !pickActive && text.trim().length >= 3 && text !== selectedAddress.current) {
            timer.current = setTimeout(() => search(text), 350);
        }
        return () => {
            clearTimeout(timer.current);
            request.current += 1;
            controller.current?.abort();
        };
    }, [value, disabled, reverseOnly, pickActive, serviceUrl]);

    useEffect(() => {
        if (!disabled && !pickActive && mapPoint && isCoordinate(mapPoint.x, 180) && isCoordinate(mapPoint.y, 90)) {
            search(null, mapPoint);
        }
    }, [mapPoint, pickActive]);

    // Only initialize once: clearing an address later must not refill it automatically.
    useEffect(() => {
        if (!disabled && !pickActive && !mapPoint && !String(value ?? "").trim()
            && initialPoint && isCoordinate(initialPoint.x, 180) && isCoordinate(initialPoint.y, 90)) {
            search(null, initialPoint);
        }
    }, []);

    return (
        <div className="panel-editor-geocoding" aria-busy={loading}>
            <div className="panel-editor-geocoding-input">
                <span id={labelId} className="sr-only">{t(locale, "geocodingAddress")}</span>
                <Combobox value={value ?? ""} data={results} textField="label" valueField="label"
                    itemComponent={GeocodingSuggestion} filter={false}
                    disabled={disabled} readOnly={reverseOnly || pickActive}
                    aria-labelledby={labelId} busy={loading} open={open}
                    messages={{ open: t(locale, "geocodingResults"), emptyList: t(locale, "geocodingNoResults") }}
                    onToggle={(nextOpen) => {
                        if (!disabled && !reverseOnly && !pickActive) {
                            setOpen(nextOpen && results.length > 0);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            invalidate();
                            selectedAddress.current = value;
                            if (pickActive) { onMapPickToggle(); }
                        }
                        if (event.key === "Enter" && !open && !disabled && !reverseOnly && !pickActive && String(value).trim().length >= 3) {
                            event.preventDefault();
                            search(String(value));
                        }
                    }}
                    onChange={(nextValue) => {
                        if (nextValue && typeof nextValue === "object") {
                            selectResult(nextValue);
                            return;
                        }
                        invalidate();
                        selectedAddress.current = null;
                        onChange(nextValue);
                    }} />
                <Button type="button" disabled={disabled} active={pickActive}
                    bsStyle={pickActive ? "primary" : "default"}
                    aria-pressed={pickActive} aria-label={t(locale, "geocodingPick")}
                    title={t(locale, "geocodingPick")} onClick={() => {
                        invalidate();
                        selectedAddress.current = value;
                        onMapPickToggle();
                    }}>
                    <Glyphicon glyph="map-marker" />
                </Button>
            </div>
            {pickActive ? <HelpBlock role="status">{t(locale, "geocodingPickHint")}</HelpBlock> : null}
            {loading ? <HelpBlock role="status">{t(locale, "geocodingLoading")}</HelpBlock> : null}
            {message ? <HelpBlock role="status">{message}</HelpBlock> : null}
        </div>
    );
};

GeocodingInputControl.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    onCoordinatesChange: PropTypes.func,
    disabled: PropTypes.bool,
    locale: PropTypes.string,
    geocodingService: PropTypes.string,
    reverseOnly: PropTypes.bool,
    pickActive: PropTypes.bool,
    mapPoint: PropTypes.object,
    initialPoint: PropTypes.object,
    onMapPickToggle: PropTypes.func
};

GeocodingInputControl.defaultProps = {
    value: "", onChange: () => {}, onCoordinatesChange: () => {}, disabled: false, locale: "en-US",
    reverseOnly: false, pickActive: false, mapPoint: null, initialPoint: null, onMapPickToggle: () => {},
    geocodingService: DEFAULT_SERVICE_URL
};

export default GeocodingInputControl;
