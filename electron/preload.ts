// Electron preload script with TypeScript types
// This exposes Electron APIs to the renderer process
// TypeScript interface for the electron window APIs

import { contextBridge, ipcRenderer } from 'electron';

// Expose Electron APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // Window control handlers
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
  },
  
  // Store API for saving data
  store: {
    get: (key: string) => ipcRenderer.invoke('store-get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store-delete', key),
  }
}); 