import Rx from "rxjs";
import { zoomToExtent } from "@mapstore/actions/map";
import { LOAD_FEATURE_INFO } from "@mapstore/actions/mapInfo";
import { getAreaOfCompetence } from "../../requests/restrictedArea";
import { t } from "../../utiles/i18n";
import { canEditLayer, isRoleAllowed } from "../../utiles/permissions";
import { extractAreaGeometry, getGeometryBounds, isRestrictedAreaOperationAllowed } from "../../utiles/restrictedArea";
import {
    PANEL_EDITOR_REQUEST_START_EDIT,
    PANEL_EDITOR_REQUEST_ZOOM_TO_RESTRICTED_AREA,
    PANEL_EDITOR_SET_SELECTED_FEATURE_INDEX,
    PANEL_EDITOR_SET_SELECTED_RESPONSE_INDEX,
    setEditMode,
    setEditPermission,
    setFormValues,
    setSaveMessage,
    setSaveStatus,
    setValidationErrors
} from "../actions";
import {
    currentLocaleSelector,
    isActive,
    selectedFeaturePropertiesSelector,
    selectedFeatureSelector,
    selectedResponseFeaturesCrsSelector,
    selectedLayerConfigSelector,
    userRolesSelector
} from "../selectors";

const getStartEditParams = (state = {}) => {
    const selectedFeature = selectedFeatureSelector(state);
    const selectedAttributes = selectedFeaturePropertiesSelector(state);
    const userRoles = userRolesSelector(state);
    const locale = currentLocaleSelector(state);
    const layerConfig = selectedLayerConfigSelector(state);
    const restrictedArea = layerConfig?.restrictedArea;
    const featureProjection = selectedResponseFeaturesCrsSelector(state) || state?.map?.projection || "EPSG:4326";

    return {
        locale,
        userRoles,
        selectedFeature,
        selectedAttributes,
        layerConfig,
        restrictedArea,
        featureProjection
    };
};

const getRestrictedAreaGeometry = ({ restrictedArea }) => {
    const fallbackWkt = restrictedArea?.wkt || restrictedArea?.wtk;

    return getAreaOfCompetence({
        url: restrictedArea?.url,
        wkt: fallbackWkt
    }).then((response) => extractAreaGeometry(response, fallbackWkt, "EPSG:4326"));
};

const isEditAllowedByRestrictedArea = ({
    userRoles,
    restrictedArea,
    selectedFeature,
    featureProjection
}) => {
    if (!selectedFeature) {
        return Promise.resolve(false);
    }

    const bypassRestrictedArea = isRoleAllowed(userRoles, restrictedArea?.allowedRoles || []);
    if (!restrictedArea || bypassRestrictedArea) {
        return Promise.resolve(true);
    }

    const restrictedAreaOperation = restrictedArea?.operation || "WITHIN";

    return getRestrictedAreaGeometry({ restrictedArea })
        .then((areaGeometry) => {
            if (!areaGeometry) {
                return true;
            }
            const areaAllowEdit = isRestrictedAreaOperationAllowed({
                operation: restrictedAreaOperation,
                featureGeometry: selectedFeature?.geometry,
                areaGeometry,
                featureProjection,
                areaProjection: "EPSG:4326"
            });
            return areaAllowEdit;
        })
        .catch(() => true);
};

export const zoomToRestrictedAreaEpic = (action$, store) =>
    action$
        .ofType(PANEL_EDITOR_REQUEST_ZOOM_TO_RESTRICTED_AREA)
        .filter(() => isActive(store.getState()))
        .switchMap(() => {
            const state = store.getState();
            const { restrictedArea } = getStartEditParams(state);

            if (!restrictedArea) {
                return Rx.Observable.empty();
            }

            return Rx.Observable.fromPromise(getRestrictedAreaGeometry({ restrictedArea }))
                .mergeMap((areaGeometry) => {
                    const bounds = getGeometryBounds(areaGeometry);
                    if (!bounds) {
                        return Rx.Observable.empty();
                    }
                    return Rx.Observable.of(zoomToExtent(bounds, "EPSG:4326"));
                })
                .catch(() => Rx.Observable.empty());
        });

const resolveEditPermission = ({
    userRoles,
    layerConfig,
    restrictedArea,
    selectedFeature,
    featureProjection
}) => {
    if (!selectedFeature) {
        return Promise.resolve({ allowed: false, reasons: [] });
    }

    const hasRolePermission = canEditLayer(userRoles, layerConfig);

    return isEditAllowedByRestrictedArea({
        userRoles,
        restrictedArea,
        selectedFeature,
        featureProjection
    }).then((allowedByArea) => {
        const reasons = [];
        if (!hasRolePermission) {
            reasons.push("role");
        }
        if (!allowedByArea) {
            reasons.push("restrictedArea");
        }
        return {
            allowed: reasons.length === 0,
            reasons
        };
    });
};

export const startEditWithPermissionsEpic = (action$, store) =>
    action$
        .ofType(PANEL_EDITOR_REQUEST_START_EDIT)
        .filter(() => isActive(store.getState()))
        .switchMap(() => {
            const state = store.getState();
            const {
                locale,
                userRoles,
                selectedFeature,
                selectedAttributes,
                layerConfig,
                restrictedArea,
                featureProjection
            } = getStartEditParams(state);

            return Rx.Observable.fromPromise(resolveEditPermission({
                userRoles,
                layerConfig,
                restrictedArea,
                selectedFeature,
                featureProjection
            }))
                .switchMap(({ allowed, reasons }) => {
                    if (allowed) {
                        return Rx.Observable.of(
                            setFormValues(selectedAttributes || {}),
                            setEditMode(true),
                            setSaveStatus("idle"),
                            setSaveMessage(""),
                            setValidationErrors({})
                        );
                    }
                    return Rx.Observable.of(
                        setEditMode(false),
                        setSaveStatus("idle"),
                        setSaveMessage(reasons.includes("restrictedArea") ? t(locale, "editRestrictedAreaDenied") : ""),
                        setValidationErrors({})
                    );
                });
        });

export const evaluateEditPermissionEpic = (action$, store) =>
    action$
        .ofType(LOAD_FEATURE_INFO, PANEL_EDITOR_SET_SELECTED_RESPONSE_INDEX, PANEL_EDITOR_SET_SELECTED_FEATURE_INDEX)
        .filter(() => isActive(store.getState()))
        .switchMap(() => {
            const state = store.getState();
            const {
                userRoles,
                selectedFeature,
                layerConfig,
                restrictedArea,
                featureProjection
            } = getStartEditParams(state);

            if (!selectedFeature) {
                return Rx.Observable.of(setEditPermission(false, false, []));
            }

            return Rx.Observable.fromPromise(resolveEditPermission({
                userRoles,
                layerConfig,
                restrictedArea,
                selectedFeature,
                featureProjection
            }))
                .map(({ allowed, reasons }) => setEditPermission(allowed, false, reasons))
                .startWith(setEditPermission(false, true, []));
        });
