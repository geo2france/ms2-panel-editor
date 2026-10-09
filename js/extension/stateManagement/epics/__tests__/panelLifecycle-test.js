import expect from 'expect';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import controls from '@mapstore/reducers/controls';
import mapInfo from '@mapstore/reducers/mapInfo';
import maplayout from '@mapstore/reducers/maplayout';
import { toggleControl, setControlProperty } from '@mapstore/actions/controls';
import { updateMapLayout } from '@mapstore/actions/maplayout';
import panelEditor from '../../reducer';
import { setup, setEditMode } from '../../actions';
import {
    registerPanelEditorDockPanelEpic,
    syncIdentifyStateWithPanelEditorEpic,
    updatePanelEditorLayoutEpic
} from '../panelLifecycle';

const makeStore = (enabled = true) => createStore(
    combineReducers({ controls, mapInfo, maplayout, panelEditor }),
    { mapInfo: { enabled, configuration: { infoFormat: 'text/html' } } },
    applyMiddleware(createEpicMiddleware(combineEpics(
        syncIdentifyStateWithPanelEditorEpic,
        registerPanelEditorDockPanelEpic,
        updatePanelEditorLayoutEpic
    )))
);

const expectOpen = (store) => {
    const state = store.getState();
    expect(state.controls.panelEditor.enabled).toBe(true);
    expect(state.maplayout.dockPanels.right).toInclude('panelEditor');
    expect(state.mapInfo.enabled).toBe(false);
    expect(state.mapInfo.configuration.infoFormat).toBe('application/json');
};

const expectClosed = (store, identifyEnabled = true) => {
    const state = store.getState();
    expect(state.controls.panelEditor.enabled).toBe(false);
    expect(state.maplayout.dockPanels.right).toExclude('panelEditor');
    expect(state.mapInfo.enabled).toBe(identifyEnabled);
    expect(state.mapInfo.configuration.infoFormat).toBe('text/html');
    expect(state.panelEditor.editMode).toBe(false);
};

describe('Panel Editor lifecycle with MapStore controls', () => {
    it('opens and closes from the sidebar toggle, restoring Identify', () => {
        const store = makeStore();
        store.dispatch(toggleControl('panelEditor', 'enabled'));
        expectOpen(store);
        store.dispatch(setEditMode(true));
        store.dispatch(toggleControl('panelEditor', 'enabled'));
        expectClosed(store);
    });

    it('keeps Identify disabled if it was disabled before opening', () => {
        const store = makeStore(false);
        store.dispatch(toggleControl('panelEditor', 'enabled'));
        expectOpen(store);
        store.dispatch(toggleControl('panelEditor', 'enabled'));
        expectClosed(store, false);
    });

    it('handles explicit control values and the controls reducer toggle option', () => {
        const store = makeStore();
        store.dispatch(setControlProperty('panelEditor', 'enabled', true));
        expectOpen(store);
        store.dispatch(setControlProperty('panelEditor', 'enabled', true, true));
        expect(store.getState().controls.panelEditor.enabled).toBe(undefined);
        expect(store.getState().maplayout.dockPanels.right).toExclude('panelEditor');
        expect(store.getState().mapInfo.enabled).toBe(true);
    });

    it('ignores other controls and unrelated panel properties', () => {
        const store = makeStore();
        store.dispatch(toggleControl('otherPanel', 'enabled'));
        store.dispatch(setControlProperty('panelEditor', 'expanded', true));
        expect(store.getState().maplayout.dockPanels.right).toExclude('panelEditor');
        expect(store.getState().mapInfo.configuration.infoFormat).toBe('text/html');
    });

    it('reserves the configured width and sidebar space without a layout loop', () => {
        const store = makeStore();
        store.dispatch(setup({ sizePanel: 350 }));
        store.dispatch(toggleControl('panelEditor', 'enabled'));
        store.dispatch(updateMapLayout({ boundingSidebarRect: { right: 40 } }));
        expect(store.getState().maplayout.layout.right).toBe(490);
        expect(store.getState().maplayout.boundingMapRect.right).toBe(490);
    });
});
