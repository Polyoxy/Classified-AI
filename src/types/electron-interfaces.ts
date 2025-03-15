// TypeScript interfaces for Electron
export interface ElectronWindowControls {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  reload: () => void;
}

export interface ElectronStore {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<boolean>;
  delete: (key: string) => Promise<boolean>;
  clear: () => Promise<boolean>;
}

export interface Electron {
  windowControls: ElectronWindowControls;
  store: ElectronStore;
} 