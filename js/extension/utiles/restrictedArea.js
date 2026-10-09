import WKT from "ol/format/WKT";
import GeoJSON from "ol/format/GeoJSON";
import { transform } from "ol/proj";
import booleanContains from "@turf/boolean-contains";
import booleanIntersects from "@turf/boolean-intersects";

const wktFormat = new WKT();
const geoJsonFormat = new GeoJSON();
const GEOJSON_GEOMETRY_TYPES = [
    "Point",
    "MultiPoint",
    "LineString",
    "MultiLineString",
    "Polygon",
    "MultiPolygon",
    "GeometryCollection"
];

const normalizeProjectionCode = (projection) => {
    if (!projection || typeof projection !== "string") {
        return "EPSG:4326";
    }
    if (projection.startsWith("EPSG:")) {
        return projection;
    }
    const lastToken = projection.split(":").pop();
    return lastToken ? `EPSG:${lastToken}` : "EPSG:4326";
};

const reprojectGeometryObject = (
    geometry = null,
    sourceProjection = "EPSG:4326",
    targetProjection = "EPSG:4326"
) => {
    const normalizedSourceProjection = normalizeProjectionCode(sourceProjection);
    const normalizedTargetProjection = normalizeProjectionCode(targetProjection);

    if (!geometry || !normalizedSourceProjection || !normalizedTargetProjection || normalizedSourceProjection === normalizedTargetProjection) {
        return geometry;
    }

    if (Array.isArray(geometry.coordinates)) {
        const transformCoordinates = (coordinates) => {
            if (!Array.isArray(coordinates)) {
                return coordinates;
            }
            if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
                return transform(coordinates, normalizedSourceProjection, normalizedTargetProjection);
            }
            return coordinates.map(transformCoordinates);
        };

        return {
            ...geometry,
            coordinates: transformCoordinates(geometry.coordinates)
        };
    }

    if (Array.isArray(geometry.geometries)) {
        return {
            ...geometry,
            geometries: geometry.geometries.map((item) => reprojectGeometryObject(item, normalizedSourceProjection, normalizedTargetProjection))
        };
    }

    return geometry;
};

const parseWktGeometry = (
    wktValue,
    sourceProjection = "EPSG:4326",
    targetProjection = "EPSG:4326"
) => {
    if (!wktValue || typeof wktValue !== "string") {
        return null;
    }
    try {
        const geometry = wktFormat.readGeometry(wktValue);
        return reprojectGeometryObject(geoJsonFormat.writeGeometryObject(geometry), sourceProjection, targetProjection);
    } catch (error) {
        return null;
    }
};

const toFeature = (featureOrGeometry) => {
    if (!featureOrGeometry) {
        return null;
    }
    if (typeof featureOrGeometry === "string") {
        const parsedGeometry = parseWktGeometry(featureOrGeometry);
        return parsedGeometry
            ? {
                type: "Feature",
                properties: {},
                geometry: parsedGeometry
            }
            : null;
    }
    if (featureOrGeometry.type === "Feature") {
        return featureOrGeometry;
    }
    if (
        GEOJSON_GEOMETRY_TYPES.includes(featureOrGeometry.type)
        && (
            featureOrGeometry.coordinates
            || Array.isArray(featureOrGeometry.geometries)
        )
    ) {
        return {
            type: "Feature",
            properties: {},
            geometry: featureOrGeometry
        };
    }
    return null;
};

const parseAreaGeometry = (
    rawResponse,
    fallbackWkt,
    targetProjection = "EPSG:4326",
    sourceProjection = "EPSG:4326"
) => {
    if (!rawResponse && fallbackWkt) {
        return parseWktGeometry(fallbackWkt, sourceProjection, targetProjection);
    }

    if (typeof rawResponse === "string") {
        const parsedWkt = parseWktGeometry(rawResponse, sourceProjection, targetProjection);
        if (parsedWkt) {
            return parsedWkt;
        }
        try {
            return parseAreaGeometry(JSON.parse(rawResponse), fallbackWkt, targetProjection, sourceProjection);
        } catch (error) {
            return parseWktGeometry(fallbackWkt, sourceProjection, targetProjection);
        }
    }

    if (Array.isArray(rawResponse)) {
        return rawResponse.length
            ? parseAreaGeometry(rawResponse[0], fallbackWkt, targetProjection, sourceProjection)
            : parseWktGeometry(fallbackWkt, sourceProjection, targetProjection);
    }

    if (!rawResponse || typeof rawResponse !== "object") {
        return parseWktGeometry(fallbackWkt, sourceProjection, targetProjection);
    }

    if (rawResponse.type === "FeatureCollection" && Array.isArray(rawResponse.features) && rawResponse.features.length > 0) {
        return parseAreaGeometry(rawResponse.features[0], fallbackWkt, targetProjection, sourceProjection);
    }
    if (rawResponse.type === "Feature") {
        return reprojectGeometryObject(rawResponse.geometry || null, sourceProjection, targetProjection);
    }
    if (rawResponse.type && rawResponse.coordinates) {
        return reprojectGeometryObject(rawResponse, sourceProjection, targetProjection);
    }

    const wktGeometry = parseWktGeometry(rawResponse.wkt || rawResponse.wtk || rawResponse.WKT, sourceProjection, targetProjection);
    if (wktGeometry) {
        return wktGeometry;
    }

    const candidateKeys = ["geometry", "areaOfCompetence", "area", "feature", "geojson", "result", "data"];
    for (let index = 0; index < candidateKeys.length; index += 1) {
        const key = candidateKeys[index];
        const nestedGeometry = parseAreaGeometry(rawResponse[key], fallbackWkt, targetProjection, sourceProjection);
        if (nestedGeometry) {
            return nestedGeometry;
        }
    }

    return parseWktGeometry(fallbackWkt, sourceProjection, targetProjection);
};

export const extractAreaGeometry = parseAreaGeometry;

export const getGeometryBounds = (geometry = null) => {
    if (!geometry) {
        return null;
    }

    let minx = Infinity;
    let miny = Infinity;
    let maxx = -Infinity;
    let maxy = -Infinity;

    const visitCoordinates = (coordinates) => {
        if (!Array.isArray(coordinates)) {
            return;
        }
        if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
            minx = Math.min(minx, coordinates[0]);
            miny = Math.min(miny, coordinates[1]);
            maxx = Math.max(maxx, coordinates[0]);
            maxy = Math.max(maxy, coordinates[1]);
            return;
        }
        coordinates.forEach(visitCoordinates);
    };

    if (Array.isArray(geometry.coordinates)) {
        visitCoordinates(geometry.coordinates);
    }

    if (Array.isArray(geometry.geometries)) {
        geometry.geometries.forEach((item) => {
            const childBounds = getGeometryBounds(item);
            if (!childBounds) {
                return;
            }
            minx = Math.min(minx, childBounds.minx);
            miny = Math.min(miny, childBounds.miny);
            maxx = Math.max(maxx, childBounds.maxx);
            maxy = Math.max(maxy, childBounds.maxy);
        });
    }

    if (![minx, miny, maxx, maxy].every(Number.isFinite)) {
        return null;
    }

    return { minx, miny, maxx, maxy };
};

export const isRestrictedAreaOperationAllowed = ({
    operation = "WITHIN",
    featureGeometry,
    areaGeometry,
    featureProjection = "EPSG:4326",
    areaProjection = "EPSG:4326"
}) => {
    const normalizedAreaProjection = normalizeProjectionCode(areaProjection);
    const projectedFeatureGeometry = reprojectGeometryObject(
        featureGeometry,
        featureProjection,
        normalizedAreaProjection
    );
    const feature = toFeature(projectedFeatureGeometry);
    const area = toFeature(areaGeometry);
    if (!feature || !area) {
        return true;
    }

    const normalizedOperation = String(operation || "WITHIN").toUpperCase();
    switch (normalizedOperation) {
    case "INTERSECTS":
        return booleanIntersects(feature, area);
    case "CONTAINS":
        return booleanContains(feature, area);
    case "WITHIN":
    default:
        return booleanContains(area, feature);
    }
};
