import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let vibeWindow: BrowserWindow | null = null;

function createHUD() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 340,
    height: height,
    x: width - 340,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.setVisibleOnAllWorkspaces(true);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

function createVibePopup(screenshotPath: string) {
  const { width } = screen.getPrimaryDisplay().workAreaSize;

  vibeWindow = new BrowserWindow({
    width: 400,
    height: 280,
    x: width - 760,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  vibeWindow.loadURL(
    process.env.NODE_ENV === 'development'
      ? `http://localhost:5173/vibe?screenshot=${encodeURIComponent(screenshotPath)}`
      : `file://${path.join(__dirname, '../renderer/index.html')}#/vibe`
  );

  // Auto-close after 5 seconds
  setTimeout(() => {
    vibeWindow?.close();
    vibeWindow = null;
  }, 5000);
}

app.whenReady().then(() => {
  createHUD();

  ipcMain.on('show-vibe-popup', (_event, screenshotPath: string) => {
    createVibePopup(screenshotPath);
  });

  ipcMain.on('quit', () => app.quit());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
