const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 数据库操作
  getAllCategories: () => ipcRenderer.invoke('db:getAllCategories'),
  addRecord: (id, amount, categoryId, note, recordDate) =>
    ipcRenderer.invoke('db:addRecord', id, amount, categoryId, note, recordDate),
  getRecords: (limit, offset) => ipcRenderer.invoke('db:getRecords', limit, offset),
  getMonthlyStats: (year, month) => ipcRenderer.invoke('db:getMonthlyStats', year, month),
  getMonthlyTotal: (year, month) => ipcRenderer.invoke('db:getMonthlyTotal', year, month),
  deleteRecord: (id) => ipcRenderer.invoke('db:deleteRecord', id),
});
