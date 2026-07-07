import type { Category, RecordItem, MonthlyStat } from '../types';

declare global {
  interface Window {
    electronAPI: {
      getAllCategories: () => Promise<Category[]>;
      addRecord: (id: string, amount: number, categoryId: number, note: string, recordDate: string) => Promise<void>;
      getRecords: (limit?: number, offset?: number) => Promise<RecordItem[]>;
      getMonthlyStats: (year: number, month: number) => Promise<MonthlyStat[]>;
      getMonthlyTotal: (year: number, month: number) => Promise<number>;
      deleteRecord: (id: string) => Promise<void>;
    };
  }
}

const api = window.electronAPI;

export async function getAllCategories(): Promise<Category[]> {
  return await api.getAllCategories();
}

export async function addRecord(id: string, amount: number, categoryId: number, note: string, recordDate: string): Promise<void> {
  await api.addRecord(id, amount, categoryId, note, recordDate);
}

export async function getRecords(limit?: number, offset?: number): Promise<RecordItem[]> {
  return await api.getRecords(limit, offset);
}

export async function getMonthlyStats(year: number, month: number): Promise<MonthlyStat[]> {
  return await api.getMonthlyStats(year, month);
}

export async function getMonthlyTotal(year: number, month: number): Promise<number> {
  return await api.getMonthlyTotal(year, month);
}

export async function deleteRecord(id: string): Promise<void> {
  await api.deleteRecord(id);
}
