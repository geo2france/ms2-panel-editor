import {
    registerPanelEditorDockPanelEpic,
    syncIdentifyStateWithPanelEditorEpic,
    updatePanelEditorLayoutEpic
} from "./epics/panelLifecycle";
import {
    cancelEditPanelEditorEpic,
    handlePanelEditorTransactionEpic
} from "./epics/transactions";
import {
    evaluateEditPermissionEpic,
    startEditWithPermissionsEpic,
    zoomToRestrictedAreaEpic
} from "./epics/permissions";
import { requestFeatureInfoOnMapClickEpic } from "./epics/featureInfo";
import { loadDescribeFeatureTypeEpic, loadListFieldOptionsEpic } from "./epics/dataLoading";

export default {
    syncIdentifyStateWithPanelEditorEpic,
    registerPanelEditorDockPanelEpic,
    handlePanelEditorTransactionEpic,
    startEditWithPermissionsEpic,
    zoomToRestrictedAreaEpic,
    cancelEditPanelEditorEpic,
    evaluateEditPermissionEpic,
    requestFeatureInfoOnMapClickEpic,
    loadDescribeFeatureTypeEpic,
    loadListFieldOptionsEpic,
    updatePanelEditorLayoutEpic
};
