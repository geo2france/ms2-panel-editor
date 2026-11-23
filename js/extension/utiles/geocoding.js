import { reproject } from "@mapstore/utils/CoordinatesUtils";

/** Returns the WGS84 position of a Point feature, or null for other geometries. */
export const getFeatureGeocodingPoint = (geometry, projection = "EPSG:4326") => {
    const coordinates = geometry?.coordinates;
    if (geometry?.type !== "Point" || !Array.isArray(coordinates)
        || !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) {
        return null;
    }
    try {
        const point = reproject({ x: coordinates[0], y: coordinates[1] }, projection, "EPSG:4326");
        return Number.isFinite(point?.x) && Number.isFinite(point?.y)
            && Math.abs(point.x) <= 180 && Math.abs(point.y) <= 90 ? { x: point.x, y: point.y } : null;
    } catch (error) {
        return null;
    }
};
