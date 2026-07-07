const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 数据库操作
  getAllCategories: () => ipcRenderer.invoke('db:getAllCategories'),
  addCategory: (name, icon, parentId) =>
    ipcRenderer.invoke('db:addCategory', name, icon, parentId),
  addRecord: (id, amount, categoryId, note, recordDate) =>
    ipcRenderer.invoke('db:addRecord', id, amount, categoryId, note, recordDate),
  getRecords: (limit, offset) => ipcRenderer.invoke('db:getRecords', limit, offset),
  getMonthlyStats: (year, month) => ipcRenderer.invoke('db:getMonthlyStats', year, month),
  getYearlyStats: (year) => ipcRenderer.invoke('db:getYearlyStats', year),
  getDailyStats: (dateStr) => ipcRenderer.invoke('db:getDailyStats', dateStr),
  getTrendByPeriod: (periodType, value) =>
    ipcRenderer.invoke('db:getTrendByPeriod', periodType, value),
  getMonthlyTotal: (year, month) => ipcRenderer.invoke('db:getMonthlyTotal', year, month),
  getYearlyTotal: (year) => ipcRenderer.invoke('db:getYearlyTotal', year),
  getDailyTotal: (dateStr) => ipcRenderer.invoke('db:getDailyTotal', dateStr),
  deleteRecord: (id) => ipcRenderer.invoke('db:deleteRecord', id),
});

