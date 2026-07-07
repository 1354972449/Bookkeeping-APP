const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { initDatabase, getAllCategories, addRecord, getRecords, getMonthlyStats, getMonthlyTotal, deleteRecord } = require('./database');

let mainWindow;

function setupChineseMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '重新加载',
          accelerator: 'CmdOrCtrl+R',
          click: () => { mainWindow?.reload(); }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => { app.quit(); }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '放大',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const wc = mainWindow?.webContents;
            if (wc) wc.setZoomLevel(wc.getZoomLevel() + 0.5);
          }
        },
        {
          label: '缩小',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const wc = mainWindow?.webContents;
            if (wc) wc.setZoomLevel(wc.getZoomLevel() - 0.5);
          }
        },
        {
          label: '重置缩放',
          accelerator: 'CmdOrCtrl+0',
          click: () => { mainWindow?.webContents?.setZoomLevel(0); }
        },
        { type: 'separator' },
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: () => { mainWindow?.webContents?.toggleDevTools(); }
        },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于黑马记账',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于黑马记账',
              message: '黑马记账 v1.0.0',
              detail: '一款简洁好用的个人记账应用\n帮助您记录每一笔消费，养成理财好习惯\n© 2026 黑马记账'
            });
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 900,
    minHeight: 640,
    title: '黑马记账 - 个人财务管家',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../public/icon.png'),
    backgroundColor: '#f5f7fa',
    show: false,
  });

  setupChineseMenu();

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

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
