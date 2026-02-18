import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('aegis', {
  onRelay: (callback: (data: unknown) => void) => {
    ipcRenderer.on('relay-event', (_event, data) => callback(data));
  },
  showVibePopup: (screenshotPath: string) => {
    ipcRenderer.send('show-vibe-popup', screenshotPath);
  },
  quit: () => ipcRenderer.send('quit'),
});
