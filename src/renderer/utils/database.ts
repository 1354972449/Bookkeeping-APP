import type { Category, RecordItem, MonthlyStat } from '../types';

const FALLBACK_CATEGORIES: Category[] = (() => {
  const MAINS = [
    { name: '餐饮美食', icon: '🍜', children: ['早餐', '午餐', '晚餐', '夜宵', '外卖', '水果', '零食', '奶茶饮品', '聚餐宴请'] },
    { name: '交通出行', icon: '🚗', children: ['公交地铁', '打车/网约车', '共享单车', '火车高铁', '机票船票', '加油充电', '停车过路费', '维修保养'] },
    { name: '购物消费', icon: '🛒', children: ['日用百货', '服装鞋帽', '数码电器', '美妆护肤', '奢侈品', '家居饰品', '母婴用品', '宠物用品'] },
    { name: '居住生活', icon: '🏠', children: ['房租/房贷', '水电燃气', '物业费', '网费话费', '家居维修', '搬家费用', '家政服务'] },
    { name: '通讯社交', icon: '💬', children: ['话费充值', '流量套餐', '宽带网络', '会员充值', '社交礼物'] },
    { name: '娱乐休闲', icon: '🎮', children: ['游戏充值', '电影演出', '运动健身', 'KTV聚会', '酒吧夜店', '旅游度假', '酒店住宿'] },
    { name: '医疗健康', icon: '🏥', children: ['门诊看病', '药品费用', '体检', '保健品', '牙科眼科', '医疗保险'] },
    { name: '学习教育', icon: '📚', children: ['书籍购买', '在线课程', '线下培训', '文具用品', '考试报名', '资料打印'] },
    { name: '人情往来', icon: '🎁', children: ['红包礼金', '请客送礼', '份子钱', '节日礼物'] },
    { name: '爱车养车', icon: '🚙', children: ['车辆保险', '加油充电', '停车费用', '维修保养', '洗车美容', '违章罚款'] },
    { name: '宝宝育儿', icon: '👶', children: ['奶粉辅食', '尿布用品', '童装玩具', '早教启蒙', '医疗疫苗', '幼儿园学费'] },
    { name: '金融保险', icon: '💼', children: ['银行手续费', '信用卡利息', '保险费用', '贷款还款', '投资亏损', '其他费用'] },
    { name: '美容美发', icon: '💇', children: ['剪发烫染', '美容SPA', '美甲美睫', '护肤化妆品', '健身减肥'] },
    { name: '宠物生活', icon: '🐕', children: ['宠物粮食', '医疗驱虫', '美容洗澡', '玩具用品', '寄养服务'] },
    { name: '其他支出', icon: '📦', children: ['丢失赔偿', '公益捐赠', '杂项支出', '无法归类'] },
  ];
  let _id = 1;
  return MAINS.map(m => {
    const mid = _id++;
    return {
      id: mid,
      name: m.name,
      icon: m.icon,
      children: m.children.map(c => ({ id: _id++, name: c })),
    };
  });
})();

declare global {
  interface Window {
    electronAPI?: {
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
  try {
    if (!api) {
      console.warn('[frontend] electronAPI 不存在，使用前端兜底分类');
      return FALLBACK_CATEGORIES;
    }
    const cats = await api.getAllCategories();
    if (!cats || cats.length === 0 || !cats[0]?.children?.length) {
      console.warn('[frontend] 后端分类异常，使用前端兜底分类');
      return FALLBACK_CATEGORIES;
    }
    return cats;
  } catch (e) {
    console.error('[frontend] getAllCategories 出错，使用兜底分类:', e);
    return FALLBACK_CATEGORIES;
  }
}

export async function addRecord(id: string, amount: number, categoryId: number, note: string, recordDate: string): Promise<void> {
  if (!api) throw new Error('运行环境异常，无法写入数据库');
  await api.addRecord(id, amount, categoryId, note, recordDate);
}

export async function getRecords(limit?: number, offset?: number): Promise<RecordItem[]> {
  if (!api) return [];
  try {
    return await api.getRecords(limit, offset);
  } catch (e) {
    console.error('[frontend] getRecords 出错:', e);
    return [];
  }
}

export async function getMonthlyStats(year: number, month: number): Promise<MonthlyStat[]> {
  if (!api) return [];
  try {
    return await api.getMonthlyStats(year, month);
  } catch (e) {
    console.error('[frontend] getMonthlyStats 出错:', e);
    return [];
  }
}

export async function getMonthlyTotal(year: number, month: number): Promise<number> {
  if (!api) return 0;
  try {
    return await api.getMonthlyTotal(year, month);
  } catch (e) {
    console.error('[frontend] getMonthlyTotal 出错:', e);
    return 0;
  }
}

export async function deleteRecord(id: string): Promise<void> {
  if (!api) throw new Error('运行环境异常');
  await api.deleteRecord(id);
}
