import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
    openPath: path => ipcRenderer.invoke('openPath', path),
    getInstances: () => ipcRenderer.invoke('getInstances'),
    importModpack: () => ipcRenderer.invoke('importModpack'),
    exportModpack: name => ipcRenderer.invoke('exportModpack', name),
    onExportProgress: callback => ipcRenderer.on('export-progress', (event, progress) => callback(progress)),
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
