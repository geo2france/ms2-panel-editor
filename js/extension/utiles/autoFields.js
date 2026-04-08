import GeoJSON from "ol/format/GeoJSON";
import { getArea, getLength } from "ol/sphere";
import {
    formatDateValue,
    getAutoFields,
    resolveAttributeName
} from "./attributes";

const geoJsonFormat = new GeoJSON();

export const isAutoFieldUpdatedOnSave = (autoField = {}) => {
    if (autoField?.onSave) {
        return true;
    }
    return ["date", "header", "area", "length", "value"].includes(autoField?.type);
};

const getValueByPath = (source = {}, path = "") =>
    String(path || "")
        .split(".")
        .filter(Boolean)
        .reduce((result, key) => (result === null || result === undefined ? undefined : result[key]), source);

export const resolveHeaderAutoValue = (currentUser = {}, source = "") => {
    const normalizedSource = String(source || "").trim();
    if (!normalizedSource) {
        return "";
    }

    return String(getValueByPath(currentUser, normalizedSource) || "");
};

const readGeometry = (geometry) => {
    if (!geometry) {
        return null;
    }
    try {
        return geoJsonFormat.readGeometry(geometry);
    } catch (error) {
        return null;
    }
};

const resolveGeometryAutoValue = (geometry, type) => {
    const olGeometry = readGeometry(geometry);
    if (!olGeometry) {
        return null;
    }

    if (type === "area") {
        return getArea(olGeometry);
    }
    if (type === "length") {
        return getLength(olGeometry);
    }
    return null;
};

export const getAutomaticFieldChanges = ({
    featureGeometry = null,
    selectedAttributes = {},
    layerConfig = {},
    currentUser = {}
}) =>
    getAutoFields(layerConfig).reduce((acc, autoField) => {
        if (!isAutoFieldUpdatedOnSave(autoField)) {
            return acc;
        }

        const attributeName = resolveAttributeName(autoField.name, selectedAttributes);
        const previousValue = selectedAttributes[attributeName];
        let nextValue = previousValue;

        if (autoField.type === "date") {
            nextValue = formatDateValue(new Date());
        }

        if (autoField.type === "header") {
            nextValue = resolveHeaderAutoValue(currentUser, autoField.source);
        }

        if (autoField.type === "value") {
            nextValue = autoField.source ?? "";
        }

        if (autoField.type === "area" || autoField.type === "length") {
            nextValue = resolveGeometryAutoValue(featureGeometry, autoField.type);
        }

        if (nextValue !== previousValue) {
            acc[attributeName] = nextValue;
        }

        return acc;
    }, {});
