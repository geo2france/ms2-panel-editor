import React from "react";
import { connect } from "react-redux";
import { Glyphicon } from "react-bootstrap";
import { toggleControl } from "@mapstore/actions/controls";
import { mapLayoutValuesSelector } from "@mapstore/selectors/maplayout";
import { createPlugin } from "@mapstore/utils/PluginsUtils";
import SidebarElement from "../../../MapStore2/web/client/components/sidebarmenu/SidebarElement";
import { name } from "../../../config";
import PanelEditor from "../components/PanelEditor";
import reducer from "../stateManagement/reducer";
import epics from "../stateManagement/epics";
import {
    setup,
    requestDelete,
    requestCancelEdit,
    requestStartEdit,
    requestSave,
    requestZoomToRestrictedArea,
    setSelectedFeatureIndex,
    setSelectedResponseIndex,
    updateFormValue
} from "../stateManagement/actions";
import {
    canStartEditSelector,
    editModeSelector,
    editPermissionReasonsSelector,
    formValuesSelector,
    isActive,
    responseOptionsSelector,
    resolvedListFieldOptionsSelector,
    saveMessageSelector,
    saveStatusSelector,
    selectedFeatureCollectionSelector,
    selectedDescribeFeatureTypeSelector,
    selectedFeatureIndexSelector,
    selectedLayerConfigSelector,
    selectedFeaturePropertiesSelector,
    selectedFeatureSelector,
    selectedResponseIndexSelector,
    userRolesSelector,
    validationErrorsSelector
} from "../stateManagement/selectors";
import { PANEL_EDITOR_CONTROL, PANEL_EDITOR_REDUCER_NAME } from "./constants";
import init from "./init";
import "../assets/style.css";

const compose = (...functions) => (args) =>
    functions.reduceRight((arg, fn) => fn(arg), args);

const mapStateToProps = (state, ownProps) => ({
    active: isActive(state),
    enabled: isActive(state),
    dockStyle: mapLayoutValuesSelector(state, { height: true, right: true }, true),
    locale: state?.locale?.current || "en-US",
    userRoles: userRolesSelector(state),
    canStartEdit: canStartEditSelector(state),
    editPermissionReasons: editPermissionReasonsSelector(state),
    responseOptions: responseOptionsSelector(state),
    selectedResponseIndex: selectedResponseIndexSelector(state),
    selectedFeatureIndex: selectedFeatureIndexSelector(state),
    selectedFeatures: selectedFeatureCollectionSelector(state),
    layerConfig: selectedLayerConfigSelector(state),
    describeFeatureType: selectedDescribeFeatureTypeSelector(state),
    selectedFeature: selectedFeatureSelector(state),
    selectedAttributes: selectedFeaturePropertiesSelector(state),
    resolvedListFieldOptions: resolvedListFieldOptionsSelector(state),
    editMode: editModeSelector(state),
    formValues: formValuesSelector(state),
    saveStatus: saveStatusSelector(state),
    saveMessage: saveMessageSelector(state),
    validationErrors: validationErrorsSelector(state),
    cfg: ownProps?.cfg || {}
});

const mapDispatchToProps = (dispatch) => ({
    onClose: () => dispatch(toggleControl(PANEL_EDITOR_CONTROL, "enabled")),
    onSelectResponse: (index) => dispatch(setSelectedResponseIndex(index)),
    onSelectFeature: (index) => dispatch(setSelectedFeatureIndex(index)),
    onStartEdit: () => dispatch(requestStartEdit()),
    onCancelEdit: () => dispatch(requestCancelEdit()),
    onZoomToRestrictedArea: () => dispatch(requestZoomToRestrictedArea()),
    onUpdateField: (fieldName, value) => dispatch(updateFormValue(fieldName, value)),
    onSave: () => dispatch(requestSave()),
    onDelete: () => dispatch(requestDelete())
});

const PanelEditorPluginComponent = compose(
    connect(mapStateToProps, mapDispatchToProps),
    compose(
        connect(() => ({}), { setup }),
        init()
    )
)(PanelEditor);

const panelEditorSelector = (state, ownProps) => ({
    bsStyle: state?.controls?.[PANEL_EDITOR_CONTROL]?.enabled ? "primary" : "tray",
    active: !!state?.controls?.[PANEL_EDITOR_CONTROL]?.enabled,
    contextResource: state?.context?.resource || {},
    pluginCfg: ownProps?.pluginCfg || ownProps?.cfg || {}
});

const getSidebarIconGlyph = (pluginCfg = {}, contextResource = {}) => {
    const iconByContext = pluginCfg?.iconByContext;

    if (iconByContext && typeof iconByContext === "object" && !Array.isArray(iconByContext)) {
        const hasContextId = contextResource?.id !== null && contextResource?.id !== undefined;
        const contextId = hasContextId ? String(contextResource.id) : null;
        const contextName = contextResource?.name;

        if (contextId && iconByContext[contextId]) {
            return iconByContext[contextId];
        }
        if (contextName && iconByContext[contextName]) {
            return iconByContext[contextName];
        }
        if (iconByContext.default) {
            return iconByContext.default;
        }
    }

    return pluginCfg?.icon || "list-alt";
};

const SidebarMenuTool = (props) => (
    <SidebarElement {...props}>
        <Glyphicon glyph={getSidebarIconGlyph(props?.pluginCfg, props?.contextResource)} />
    </SidebarElement>
);

const ConnectedSidebarMenuTool = connect(
    panelEditorSelector,
    {
        onClick: toggleControl.bind(null, PANEL_EDITOR_CONTROL, "enabled")
    }
)(SidebarMenuTool);

export default createPlugin(name, {
    component: PanelEditorPluginComponent,
    containers: {
        SidebarMenu: {
            name,
            position: 8,
            icon: <Glyphicon glyph="list-alt" />,
            tool: ConnectedSidebarMenuTool,
            doNotHide: true,
            priority: 1,
            selector: panelEditorSelector
        },
        BurgerMenu: {
            name,
            position: 8,
            icon: <Glyphicon glyph="th-list" />,
            action: toggleControl.bind(null, PANEL_EDITOR_CONTROL, "enabled"),
            doNotHide: true,
            priority: 3
        }
    },
    reducers: {
        [PANEL_EDITOR_REDUCER_NAME]: reducer
    },
    epics
});
