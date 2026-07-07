export interface Category {
  id: number;
  name: string;
  icon: string;
  children: SubCategory[];
}

export interface SubCategory {
  id: number;
  name: string;
}

export interface RecordItem {
  id: string;
  amount: number;
  note: string;
  recordDate: string;
  createdAt: string;
  subCategory: string;
  mainCategory: string;
  icon: string;
}

export interface MonthlyStat {
  category: string;
  icon: string;
  total: number;
}

export interface TrendItem {
  label: string;
  total: number;
}

export type StatPeriod = 'year' | 'month' | 'day';
