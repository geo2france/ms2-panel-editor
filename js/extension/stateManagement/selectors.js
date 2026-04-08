import { createSelector } from "reselect";
import { userGroupSecuritySelector } from "@mapstore/selectors/security";
import { PANEL_EDITOR_CONTROL } from "../plugin/constants";
import {
    getConfiguredListFields,
    getLayerNameFromResponse,
    getLayerTitleFromResponse,
    getLayersList,
    getUniqueFieldValuesFromFeatures,
    isRemoteListOptions,
    normalizeSelectOptions
} from "../utiles/attributes";

export const panelEditorStateSelector = (state) => state?.panelEditor || {};
export const panelEditorControlSelector = (state) => state?.controls?.[PANEL_EDITOR_CONTROL] || {};
export const mapInfoResponsesSelector = (state) => state?.mapInfo?.responses || [];
export const currentUserSelector = (state) => state?.security?.user || {};
export const currentLocaleSelector = (state) => state?.locale?.current || "en-US";
export const currentMapInfoFormatSelector = (state) => state?.mapInfo?.configuration?.infoFormat || "text/plain";

const toArray = (value) => {
    if (!value) {
        return [];
    }
    return Array.isArray(value) ? value : [value];
};

export const userRolesSelector = createSelector(
    currentUserSelector,
    userGroupSecuritySelector,
    (user = {}, userGroups = []) => {
        const groupNames = toArray(userGroups)
            .filter((group) => group?.enabled !== false)
            .map((group) => group?.groupName)
            .filter(Boolean);

        return [...new Set([
            ...groupNames,
            user?.role
        ].filter(Boolean))];
    }
);

export const panelEditorEnabledSelector = createSelector(
    panelEditorControlSelector,
    (control) => !!control?.enabled
);

export const isActive = panelEditorEnabledSelector;

export const pluginCfgSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => panelEditor?.pluginCfg || {}
);

export const describeFeatureTypesSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => panelEditor?.describeFeatureTypes || {}
);

export const describeFeatureTypeRequestsSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => panelEditor?.describeFeatureTypeRequests || {}
);

export const listFieldOptionsSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => panelEditor?.listFieldOptions || {}
);

export const listFieldOptionsRequestsSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => panelEditor?.listFieldOptionsRequests || {}
);

export const selectedResponseIndexSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => panelEditor?.selectedResponseIndex || 0
);

export const selectedFeatureIndexSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => panelEditor?.selectedFeatureIndex || 0
);

export const editModeSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => !!panelEditor?.editMode
);

export const formValuesSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => panelEditor?.formValues || {}
);

export const saveStatusSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => panelEditor?.saveStatus || "idle"
);

export const saveMessageSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => panelEditor?.saveMessage || ""
);

export const validationErrorsSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => panelEditor?.validationErrors || {}
);

export const editPermissionSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => panelEditor?.editPermission || { allowed: false, pending: false, reasons: [] }
);

export const canStartEditSelector = createSelector(
    editPermissionSelector,
    (editPermission) => !!editPermission?.allowed
);

export const editPermissionReasonsSelector = createSelector(
    editPermissionSelector,
    (editPermission) => Array.isArray(editPermission?.reasons) ? editPermission.reasons : []
);

export const mapInfoWasEnabledSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => !!panelEditor?.mapInfoWasEnabled
);

export const mapInfoPreviousFormatSelector = createSelector(
    panelEditorStateSelector,
    (panelEditor) => panelEditor?.mapInfoPreviousFormat || "text/plain"
);

const hasResponseFeatures = (response = {}) => {
    const features = response?.layerMetadata?.features;
    return Array.isArray(features) && features.length > 0;
};

export const panelEditorResponsesSelector = createSelector(
    mapInfoResponsesSelector,
    pluginCfgSelector,
    (responses = [], pluginCfg = {}) => {
        const configuredLayerNames = getLayersList(pluginCfg)
            .map((layer) => layer?.name)
            .filter(Boolean);

        return responses.filter((response) => {
            const layerName = getLayerNameFromResponse(response);
            const isConfiguredLayer = !configuredLayerNames.length || configuredLayerNames.includes(layerName);
            return isConfiguredLayer && hasResponseFeatures(response);
        });
    }
);

export const responseOptionsSelector = createSelector(
    panelEditorResponsesSelector,
    (responses = []) => responses.map((response, index) => ({
        value: index,
        layerName: getLayerNameFromResponse(response),
        label: getLayerTitleFromResponse(response) || getLayerNameFromResponse(response) || `Layer ${index + 1}`
    }))
);

export const safeSelectedResponseIndexSelector = createSelector(
    selectedResponseIndexSelector,
    panelEditorResponsesSelector,
    (selectedResponseIndex = 0, responses = []) =>
        responses.length ? Math.min(selectedResponseIndex, responses.length - 1) : 0
);

export const selectedResponseSelector = createSelector(
    panelEditorResponsesSelector,
    safeSelectedResponseIndexSelector,
    (responses = [], selectedResponseIndex = 0) => responses[selectedResponseIndex] || null
);

export const selectedResponseFeaturesCrsSelector = createSelector(
    selectedResponseSelector,
    (response) => response?.layerMetadata?.featuresCrs || null
);

export const selectedResponseLayerNameSelector = createSelector(
    selectedResponseSelector,
    (response) => getLayerNameFromResponse(response)
);

const findLayerConfigByName = (pluginCfg = {}, layerName = "") =>
    getLayersList(pluginCfg).find((layer) => layer?.name === layerName) || {};

export const layerConfigByNameSelector = createSelector(
    pluginCfgSelector,
    (state, layerName) => layerName,
    (pluginCfg, layerName) => findLayerConfigByName(pluginCfg, layerName)
);

export const selectedLayerConfigSelector = createSelector(
    pluginCfgSelector,
    selectedResponseLayerNameSelector,
    (pluginCfg, selectedLayerName) => findLayerConfigByName(pluginCfg, selectedLayerName)
);

export const selectedDescribeFeatureTypeSelector = createSelector(
    describeFeatureTypesSelector,
    selectedResponseLayerNameSelector,
    (describeFeatureTypes, selectedLayerName) => describeFeatureTypes?.[selectedLayerName] || null
);

export const selectedFeatureCollectionSelector = createSelector(
    selectedResponseSelector,
    (response) => response?.layerMetadata?.features || []
);

export const safeSelectedFeatureIndexSelector = createSelector(
    selectedFeatureIndexSelector,
    selectedFeatureCollectionSelector,
    (selectedFeatureIndex = 0, features = []) =>
        features.length ? Math.min(selectedFeatureIndex, features.length - 1) : 0
);

export const selectedFeatureSelector = createSelector(
    selectedFeatureCollectionSelector,
    safeSelectedFeatureIndexSelector,
    (features = [], selectedFeatureIndex = 0) => features[selectedFeatureIndex] || null
);

export const selectedFeaturePropertiesSelector = createSelector(
    selectedFeatureSelector,
    (feature) => feature?.properties || {}
);

export const resolvedListFieldOptionsSelector = createSelector(
    selectedLayerConfigSelector,
    selectedFeatureCollectionSelector,
    selectedFeaturePropertiesSelector,
    formValuesSelector,
    selectedResponseLayerNameSelector,
    listFieldOptionsSelector,
    (
        layerConfig,
        selectedFeatures,
        selectedAttributes,
        formValues,
        selectedLayerName,
        remoteOptionsByField
    ) => getConfiguredListFields(layerConfig).reduce((acc, fieldDefinition) => {
        const fieldName = fieldDefinition.name;
        const configuredOptions = fieldDefinition.options;
        const remoteKey = `${selectedLayerName}::${fieldName}`;
        const baseOptions = Array.isArray(configuredOptions) && configuredOptions.length
            ? configuredOptions
            : isRemoteListOptions(configuredOptions)
                ? (remoteOptionsByField?.[remoteKey] || [])
                : getUniqueFieldValuesFromFeatures(fieldName, selectedFeatures);
        const currentValue = formValues?.[fieldName] ?? selectedAttributes?.[fieldName];
        const optionsWithCurrentValue = currentValue === null || currentValue === undefined || currentValue === ""
            ? baseOptions
            : [...baseOptions, currentValue];

        acc[fieldName] = normalizeSelectOptions(optionsWithCurrentValue);
        return acc;
    }, {})
);

export const selectedFeatureIdSelector = createSelector(
    selectedFeatureSelector,
    (feature) => feature?.id
);

export const mapInfoClickPointSelector = (state) => state?.mapInfo?.clickPoint || null;
export const mapInfoClickLayerSelector = (state) => state?.mapInfo?.clickLayer || null;
export const mapInfoFilterNameListSelector = (state) => state?.mapInfo?.filterNameList || [];
export const mapInfoOverrideParamsSelector = (state) => state?.mapInfo?.overrideParams || {};
export const mapInfoItemIdSelector = (state) => state?.mapInfo?.itemId || null;
