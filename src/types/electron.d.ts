// TypeScript declaration file for Electron window interface

interface ElectronWindowControls {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  reload: () => void;
}

interface ElectronStore {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<boolean>;
  delete: (key: string) => Promise<boolean>;
  clear: () => Promise<boolean>;
}

interface Electron {
  windowControls: ElectronWindowControls;
  store: ElectronStore;
}

// Augment the Window interface
declare global {
  interface Window {
    electron?: Electron;
  }
}

export {}; 