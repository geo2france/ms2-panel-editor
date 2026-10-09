import {
    PANEL_EDITOR_SET_EDIT_MODE,
    PANEL_EDITOR_SET_SELECTED_RESPONSE_INDEX,
    PANEL_EDITOR_SET_SELECTED_FEATURE_INDEX,
    PANEL_EDITOR_SET_FORM_VALUES,
    PANEL_EDITOR_UPDATE_FORM_VALUE,
    PANEL_EDITOR_RESET,
    PANEL_EDITOR_SET_SAVE_STATUS,
    PANEL_EDITOR_SET_SAVE_MESSAGE,
    PANEL_EDITOR_SET_VALIDATION_ERRORS,
    PANEL_EDITOR_SET_MAPINFO_WAS_ENABLED,
    PANEL_EDITOR_SET_MAPINFO_PREVIOUS_FORMAT,
    PANEL_EDITOR_SET_EDIT_PERMISSION,
    PANEL_EDITOR_SETUP,
    PANEL_EDITOR_REQUEST_DESCRIBE_FEATURE_TYPE,
    PANEL_EDITOR_SET_DESCRIBE_FEATURE_TYPE,
    PANEL_EDITOR_DESCRIBE_FEATURE_TYPE_ERROR,
    PANEL_EDITOR_REQUEST_LIST_FIELD_OPTIONS,
    PANEL_EDITOR_SET_LIST_FIELD_OPTIONS,
    PANEL_EDITOR_LIST_FIELD_OPTIONS_ERROR
} from "./actions";

const initialState = {
    editMode: false,
    selectedResponseIndex: 0,
    selectedFeatureIndex: 0,
    formValues: {},
    saveStatus: "idle",
    saveMessage: "",
    validationErrors: {},
    editPermission: {
        allowed: false,
        pending: false,
        reasons: []
    },
    mapInfoWasEnabled: false,
    mapInfoPreviousFormat: "text/plain",
    pluginCfg: {},
    describeFeatureTypes: {},
    describeFeatureTypeRequests: {},
    listFieldOptions: {},
    listFieldOptionsRequests: {}
};

export default function panelEditor(state = initialState, action = {}) {
    switch (action.type) {
    case PANEL_EDITOR_SET_EDIT_MODE:
        return {
            ...state,
            editMode: action.enabled
        };
    case PANEL_EDITOR_SET_SELECTED_RESPONSE_INDEX:
        return {
            ...state,
            editMode: false,
            selectedResponseIndex: Math.max(0, action.index || 0),
            selectedFeatureIndex: 0,
            formValues: {},
            saveStatus: "idle",
            saveMessage: "",
            validationErrors: {}
        };
    case PANEL_EDITOR_SET_SELECTED_FEATURE_INDEX:
        return {
            ...state,
            editMode: false,
            selectedFeatureIndex: Math.max(0, action.index || 0),
            formValues: {},
            saveStatus: "idle",
            saveMessage: "",
            validationErrors: {}
        };
    case PANEL_EDITOR_SET_FORM_VALUES:
        return {
            ...state,
            formValues: action.values || {}
        };
    case PANEL_EDITOR_UPDATE_FORM_VALUE:
        const nextValidationErrors = { ...(state.validationErrors || {}) };
        delete nextValidationErrors[action.name];
        return {
            ...state,
            formValues: {
                ...state.formValues,
                [action.name]: action.value
            },
            validationErrors: nextValidationErrors
        };
    case PANEL_EDITOR_SET_SAVE_STATUS:
        return {
            ...state,
            saveStatus: action.status || "idle"
        };
    case PANEL_EDITOR_SET_SAVE_MESSAGE:
        return {
            ...state,
            saveMessage: action.message || ""
        };
    case PANEL_EDITOR_SET_VALIDATION_ERRORS:
        return {
            ...state,
            validationErrors: action.errors || {}
        };
    case PANEL_EDITOR_SET_EDIT_PERMISSION:
        return {
            ...state,
            editPermission: {
                allowed: !!action.allowed,
                pending: !!action.pending,
                reasons: Array.isArray(action.reasons) ? action.reasons : []
            }
        };
    case PANEL_EDITOR_SET_MAPINFO_WAS_ENABLED:
        return {
            ...state,
            mapInfoWasEnabled: !!action.enabled
        };
    case PANEL_EDITOR_SET_MAPINFO_PREVIOUS_FORMAT:
        return {
            ...state,
            mapInfoPreviousFormat: action.infoFormat || "text/plain"
        };
    case PANEL_EDITOR_SETUP:
        return {
            ...initialState,
            pluginCfg: action.pluginCfg || {}
        };
    case PANEL_EDITOR_REQUEST_DESCRIBE_FEATURE_TYPE:
        return {
            ...state,
            describeFeatureTypeRequests: {
                ...state.describeFeatureTypeRequests,
                [action.layerName]: true
            }
        };
    case PANEL_EDITOR_SET_DESCRIBE_FEATURE_TYPE:
        return {
            ...state,
            describeFeatureTypes: {
                ...state.describeFeatureTypes,
                [action.layerName]: action.describeFeatureType || {}
            },
            describeFeatureTypeRequests: {
                ...state.describeFeatureTypeRequests,
                [action.layerName]: false
            }
        };
    case PANEL_EDITOR_DESCRIBE_FEATURE_TYPE_ERROR:
        return {
            ...state,
            describeFeatureTypeRequests: {
                ...state.describeFeatureTypeRequests,
                [action.layerName]: false
            }
        };
    case PANEL_EDITOR_REQUEST_LIST_FIELD_OPTIONS:
        return {
            ...state,
            listFieldOptionsRequests: {
                ...state.listFieldOptionsRequests,
                [`${action.layerName}::${action.fieldName}`]: true
            }
        };
    case PANEL_EDITOR_SET_LIST_FIELD_OPTIONS:
        return {
            ...state,
            listFieldOptions: {
                ...state.listFieldOptions,
                [`${action.layerName}::${action.fieldName}`]: action.options || []
            },
            listFieldOptionsRequests: {
                ...state.listFieldOptionsRequests,
                [`${action.layerName}::${action.fieldName}`]: false
            }
        };
    case PANEL_EDITOR_LIST_FIELD_OPTIONS_ERROR:
        return {
            ...state,
            listFieldOptionsRequests: {
                ...state.listFieldOptionsRequests,
                [`${action.layerName}::${action.fieldName}`]: false
            }
        };
    case PANEL_EDITOR_RESET:
        return {
            ...initialState
        };
    default:
        return state;
    }
}
