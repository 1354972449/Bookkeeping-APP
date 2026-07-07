const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDatabase, getAllCategories, addRecord, getRecords, getMonthlyStats, getMonthlyTotal, deleteRecord } = require('./database');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: '黑马记账',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../public/icon.png'),
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 注册 IPC 处理器
function registerIpcHandlers() {
  ipcMain.handle('db:getAllCategories', () => {
    return getAllCategories();
  });

  ipcMain.handle('db:addRecord', (_event, id, amount, categoryId, note, recordDate) => {
    addRecord(id, amount, categoryId, note, recordDate);
    return true;
  });

  ipcMain.handle('db:getRecords', (_event, limit, offset) => {
    return getRecords(limit, offset);
  });

  ipcMain.handle('db:getMonthlyStats', (_event, year, month) => {
    return getMonthlyStats(year, month);
  });

  ipcMain.handle('db:getMonthlyTotal', (_event, year, month) => {
    return getMonthlyTotal(year, month);
  });

  ipcMain.handle('db:deleteRecord', (_event, id) => {
    deleteRecord(id);
    return true;
  });
}

app.whenReady().then(async () => {
  await initDatabase(app.getPath('userData'));
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
