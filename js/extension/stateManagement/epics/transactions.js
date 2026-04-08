import Rx from "rxjs";
import { featureInfoClick } from "@mapstore/actions/mapInfo";
import { refreshLayers } from "@mapstore/actions/layers";
import {
    buildDeleteTransactionPayload,
    buildUpdateTransactionPayload,
    postWfsTransaction
} from "../../requests/wfsTransaction";
import {
    getEditableVisibleFieldNames,
    getWfsUrl,
    resolveAttributeName,
    resolveFieldDefinition
} from "../../utiles/attributes";
import { getAutomaticFieldChanges } from "../../utiles/autoFields";
import { t } from "../../utiles/i18n";
import { canEditField } from "../../utiles/permissions";
import {
    PANEL_EDITOR_REQUEST_CANCEL_EDIT,
    PANEL_EDITOR_REQUEST_DELETE,
    PANEL_EDITOR_REQUEST_SAVE,
    setEditMode,
    setFormValues,
    setSaveMessage,
    setSaveStatus,
    setValidationErrors
} from "../actions";
import {
    currentLocaleSelector,
    currentUserSelector,
    formValuesSelector,
    isActive,
    mapInfoClickLayerSelector,
    mapInfoClickPointSelector,
    mapInfoFilterNameListSelector,
    mapInfoItemIdSelector,
    mapInfoOverrideParamsSelector,
    selectedDescribeFeatureTypeSelector,
    selectedFeatureIdSelector,
    selectedFeaturePropertiesSelector,
    selectedFeatureSelector,
    selectedLayerConfigSelector,
    selectedResponseLayerNameSelector,
    userRolesSelector
} from "../selectors";

const isRequiredValueMissing = (value) =>
    value === null
    || value === undefined
    || (typeof value === "string" && value.trim() === "");

const getLayerToRefresh = (state = {}, selectedLayerName = "") =>
    (state?.layers?.flat || []).find((layer) =>
        layer?.name === selectedLayerName
        || layer?.id === selectedLayerName
    );

const getEditableFieldChanges = ({
    locale,
    userRoles,
    selectedAttributes = {},
    formValues = {},
    layerConfig = {},
    describeFeatureType = null
}) => {
    const visibleFields = getEditableVisibleFieldNames(selectedAttributes, layerConfig);
    return visibleFields.reduce((acc, fieldName) => {
        const fieldDefinition = resolveFieldDefinition(
            fieldName,
            selectedAttributes[fieldName],
            layerConfig,
            describeFeatureType
        );

        if (!canEditField(userRoles, fieldDefinition, selectedAttributes[fieldName])) {
            return acc;
        }

        const nextValue = Object.prototype.hasOwnProperty.call(formValues, fieldName)
            ? formValues[fieldName]
            : selectedAttributes[fieldName];
        const previousValue = selectedAttributes[fieldName];

        if (fieldDefinition.required && isRequiredValueMissing(nextValue)) {
            acc.validationErrors[fieldName] = t(locale, "requiredField");
            return acc;
        }

        if (nextValue !== previousValue) {
            acc.changedAttributes[fieldName] = nextValue;
        }

        return acc;
    }, { changedAttributes: {}, validationErrors: {} });
};

const getTransactionParams = (state = {}) => {
    const pluginCfg = state?.panelEditor?.pluginCfg || {};
    const selectedLayerName = selectedResponseLayerNameSelector(state);
    const selectedAttributes = selectedFeaturePropertiesSelector(state);
    const selectedFeatureId = selectedFeatureIdSelector(state);
    const selectedFeature = selectedFeatureSelector(state);
    const currentUser = currentUserSelector(state);
    const userRoles = userRolesSelector(state);
    const formValues = formValuesSelector(state);
    const locale = currentLocaleSelector(state);
    const layerConfig = selectedLayerConfigSelector(state);
    const describeFeatureType = selectedDescribeFeatureTypeSelector(state);
    const clickPoint = mapInfoClickPointSelector(state);
    const clickLayer = mapInfoClickLayerSelector(state);
    const filterNameList = mapInfoFilterNameListSelector(state);
    const overrideParams = mapInfoOverrideParamsSelector(state);
    const itemId = mapInfoItemIdSelector(state);
    const layerToRefresh = getLayerToRefresh(state, selectedLayerName);

    const typeName = layerConfig?.name || selectedLayerName;
    const idField = resolveAttributeName(layerConfig?.idField || "id", selectedAttributes);
    const idValue = selectedAttributes?.[idField] ?? selectedFeatureId;
    const wfsUrl = getWfsUrl(pluginCfg, layerConfig);

    return {
        locale,
        typeName,
        idField,
        idValue,
        wfsUrl,
        formValues,
        currentUser,
        userRoles,
        describeFeatureType,
        selectedFeature,
        selectedAttributes,
        layerConfig,
        selectedLayerName,
        clickPoint,
        clickLayer,
        filterNameList,
        overrideParams,
        itemId,
        layerToRefresh
    };
};

export const handlePanelEditorTransactionEpic = (action$, store) =>
    action$
        .ofType(PANEL_EDITOR_REQUEST_SAVE, PANEL_EDITOR_REQUEST_DELETE)
        .filter(() => isActive(store.getState()))
        .switchMap((action) => {
            const state = store.getState();
            const {
                locale,
                typeName,
                idField,
                idValue,
                wfsUrl,
                formValues,
                currentUser,
                userRoles,
                describeFeatureType,
                selectedFeature,
                selectedAttributes,
                layerConfig,
                selectedLayerName,
                clickPoint,
                clickLayer,
                filterNameList,
                overrideParams,
                itemId,
                layerToRefresh
            } = getTransactionParams(state);

            if (!wfsUrl || !typeName || idValue === undefined || idValue === null) {
                return Rx.Observable.of(
                    setSaveStatus("error"),
                    setSaveMessage(t(locale, "saveErrorMissingConfig")),
                    setValidationErrors({})
                );
            }

            const {
                changedAttributes,
                validationErrors
            } = action.type === PANEL_EDITOR_REQUEST_SAVE
                ? getEditableFieldChanges({
                    locale,
                    userRoles,
                    selectedAttributes,
                    formValues,
                    layerConfig,
                    describeFeatureType
                })
                : { changedAttributes: {}, validationErrors: {} };
            const automaticChanges = action.type === PANEL_EDITOR_REQUEST_SAVE
                ? getAutomaticFieldChanges({
                    currentUser,
                    featureGeometry: selectedFeature?.geometry,
                    selectedAttributes,
                    layerConfig
                })
                : {};
            const attributesToSave = {
                ...changedAttributes,
                ...automaticChanges
            };

            if (action.type === PANEL_EDITOR_REQUEST_SAVE && Object.keys(validationErrors).length) {
                return Rx.Observable.of(
                    setValidationErrors(validationErrors),
                    setSaveStatus("error"),
                    setSaveMessage(t(locale, "saveValidationError"))
                );
            }

            if (action.type === PANEL_EDITOR_REQUEST_SAVE && !Object.keys(attributesToSave).length) {
                return Rx.Observable.of(
                    setValidationErrors({}),
                    setSaveStatus("idle"),
                    setSaveMessage(t(locale, "saveNoChanges"))
                );
            }

            const payload = action.type === PANEL_EDITOR_REQUEST_SAVE
                ? buildUpdateTransactionPayload({
                    typeName,
                    idField,
                    idValue,
                    attributes: attributesToSave
                })
                : buildDeleteTransactionPayload({
                    typeName,
                    idField,
                    idValue
                });

            return Rx.Observable.fromPromise(postWfsTransaction(wfsUrl, payload))
                .switchMap(() => {
                    const successActions = [
                        setEditMode(false),
                        setValidationErrors({}),
                        setSaveStatus("success"),
                        setSaveMessage(t(locale, "saveSuccess"))
                    ];

                    if (clickPoint) {
                        successActions.push(featureInfoClick(
                            clickPoint,
                            clickLayer || selectedLayerName,
                            filterNameList || [],
                            overrideParams || {},
                            itemId || null
                        ));
                    }

                    if (layerToRefresh) {
                        successActions.push(refreshLayers([layerToRefresh], { force: true }));
                    }

                    return Rx.Observable.from(successActions);
                })
                .catch(() => Rx.Observable.of(
                    setSaveStatus("error"),
                    setSaveMessage(t(locale, "saveErrorGeneric"))
                ))
                .startWith(setValidationErrors({}), setSaveMessage(""), setSaveStatus("saving"));
        });

export const cancelEditPanelEditorEpic = (action$, store) =>
    action$
        .ofType(PANEL_EDITOR_REQUEST_CANCEL_EDIT)
        .filter(() => isActive(store.getState()))
        .switchMap(() => {
            const state = store.getState();
            const selectedAttributes = selectedFeaturePropertiesSelector(state);
            return Rx.Observable.of(
                setFormValues(selectedAttributes || {}),
                setEditMode(false),
                setSaveStatus("idle"),
                setSaveMessage(""),
                setValidationErrors({})
            );
        });
