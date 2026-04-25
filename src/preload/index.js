import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
    getLatestVersion: () => ipcRenderer.invoke('getLatestVersion'),
    openPath: path => ipcRenderer.invoke('openPath', path),
    getInstancePath: () => ipcRenderer.invoke('getInstancePath'),
    getInstances: () => ipcRenderer.invoke('getInstances'),
    onInstancesUpdated: callback => ipcRenderer.on('instances-updated', event => callback()),
    importModpack: () => ipcRenderer.invoke('importModpack'),
    exportModpack: name => ipcRenderer.invoke('exportModpack', name),
    onImportProgress: callback => ipcRenderer.on('import-progress', (event, progress) => callback(progress)),
    onExportProgress: callback => ipcRenderer.on('export-progress', (event, progress) => callback(progress)),
    onImportMsg: callback => ipcRenderer.on('import-msg', (event, msg) => callback(msg)),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI);
        contextBridge.exposeInMainWorld('api', api);
    } catch (error) {
        console.error(error);
    }
} else {
    window.electron = electronAPI;
    window.api = api;
}
