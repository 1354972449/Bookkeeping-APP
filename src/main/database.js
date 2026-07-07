const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
let DB_DIR, DB_PATH;

const CATEGORIES = [
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

const BACKUP_CATEGORIES_RESULT = (() => {
  let _id = 1;
  return CATEGORIES.map(main => {
    const mid = _id++;
    const children = main.children.map(n => ({ id: _id++, name: n }));
    return { id: mid, name: main.name, icon: main.icon, children };
  });
})();

function resolveWasmPath() {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    return path.resolve(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm');
  }

  const distWasm = path.resolve(__dirname, '../../dist/sql-wasm.wasm');
  if (fs.existsSync(distWasm)) return distWasm;

  const asarUnpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'sql-wasm.wasm');
  if (fs.existsSync(asarUnpacked)) return asarUnpacked;

  return path.join(process.resourcesPath, 'dist', 'sql-wasm.wasm');
}

async function initDatabase(userDataPath) {
  const wasmPath = resolveWasmPath();
  const SQL = await initSqlJs({
    locateFile: (file) => {
      if (file === 'sql-wasm.wasm') return wasmPath;
      return file;
    },
  });

  DB_DIR = path.join(userDataPath, 'data');
  DB_PATH = path.join(DB_DIR, 'heimazhangji.db');

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  try {
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      try {
        db = new SQL.Database(buffer);
      } catch (openErr) {
        console.error('打开现有数据库失败，将重建:', openErr.message);
        const bakPath = DB_PATH + '.bak-' + Date.now();
        try { fs.copyFileSync(DB_PATH, bakPath); } catch (_) { /* noop */ }
        db = new SQL.Database();
      }
    } else {
      db = new SQL.Database();
    }
  } catch (outerErr) {
    console.error('数据库初始化异常，使用纯内存模式:', outerErr.message);
    db = new SQL.Database();
  }

  try {
    createTables();
  } catch (e) {
    console.error('建表失败，强制重建表结构:', e.message);
    try {
      db.run('DROP TABLE IF EXISTS records');
      db.run('DROP TABLE IF EXISTS categories');
      createTables();
    } catch (e2) {
      console.error('重建表结构仍失败:', e2.message);
    }
  }

  try {
    initCategories();
  } catch (e) {
    console.error('分类初始化失败，尝试强制重建:', e.message);
    try {
      db.run('DROP TABLE IF EXISTS categories');
      createTables();
      initCategories();
    } catch (e2) {
      console.error('强制重建分类仍失败:', e2.message);
    }
  }
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      parent_id INTEGER,
      level INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      is_custom INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    )
  `);

  try {
    db.run('ALTER TABLE categories ADD COLUMN is_custom INTEGER NOT NULL DEFAULT 0');
  } catch (_) { /* 旧库已有该字段则忽略 */ }

  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      note TEXT,
      record_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_records_date ON records(record_date)
  `);

  saveDatabase();
}

function rebuildCategoriesPreserveRecords() {
  db.run('DROP TABLE IF EXISTS records');
  db.run('DROP TABLE IF EXISTS categories');
  saveDatabase();
  createTables();
  doInsertCategories();
}

function isCategoriesStructureValid() {
  try {
    const mainResult = db.exec(
      `SELECT id, name FROM categories WHERE level = 1 AND is_custom = 0 ORDER BY sort_order`
    );
    if (!mainResult[0] || mainResult[0].values.length !== CATEGORIES.length) {
      return false;
    }
    for (let i = 0; i < mainResult[0].values.length; i++) {
      const [pid, pname] = mainResult[0].values[i];
      const expected = CATEGORIES[i];
      if (pname !== expected.name) return false;
      const subResult = db.exec(
        `SELECT id FROM categories WHERE parent_id = ${pid} AND is_custom = 0 ORDER BY sort_order`
      );
      const subCount = subResult[0]?.values.length || 0;
      if (subCount !== expected.children.length) return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function doInsertCategories() {
  const stmt = db.prepare(
    'INSERT INTO categories (name, icon, parent_id, level, sort_order, is_custom) VALUES (?, ?, ?, ?, ?, 0)'
  );

  CATEGORIES.forEach((cat, index) => {
    stmt.run([cat.name, cat.icon, null, 1, index]);
    const parentRes = db.exec('SELECT last_insert_rowid() AS lid');
    const parentId = parentRes?.[0]?.values?.[0]?.[0];
    if (!parentId) return;

    cat.children.forEach((childName, childIndex) => {
      stmt.run([childName, null, parentId, 2, childIndex]);
    });
  });

  stmt.free();
  saveDatabase();
}

function addCategory(name, icon, parentId) {
  if (!db) throw new Error('数据库未初始化');
  if (!name || !String(name).trim()) throw new Error('分类名称不能为空');

  const level = parentId ? 2 : 1;
  const iconVal = icon || (level === 1 ? '📌' : null);

  const maxSortRes = db.exec(
    `SELECT COALESCE(MAX(sort_order), -1) FROM categories WHERE ${parentId ? `parent_id = ${Number(parentId)}` : 'parent_id IS NULL'}`
  );
  const nextSort = (maxSortRes?.[0]?.values?.[0]?.[0] ?? -1) + 1;

  const stmt = db.prepare(
    'INSERT INTO categories (name, icon, parent_id, level, sort_order, is_custom) VALUES (?, ?, ?, ?, ?, 1)'
  );
  stmt.run([String(name).trim(), iconVal, parentId ? Number(parentId) : null, level, nextSort]);
  stmt.free();
  saveDatabase();

  const lastRes = db.exec('SELECT last_insert_rowid() AS lid');
  const newId = lastRes?.[0]?.values?.[0]?.[0];
  return { id: newId, level };
}

function initCategories() {
  let count = 0;
  try {
    const result = db.exec('SELECT COUNT(*) as cnt FROM categories');
    count = result?.[0]?.values?.[0]?.[0] || 0;
  } catch (e) {
    console.error('查询分类数量失败，强制重建:', e.message);
    count = 0;
  }

  if (count === 0) {
    try {
      doInsertCategories();
      return;
    } catch (e) {
      console.error('首次插入分类失败:', e.message);
      return;
    }
  }

  let needRebuild = false;
  try {
    needRebuild = !isCategoriesStructureValid();
  } catch (e) {
    console.error('分类结构校验异常，将重建:', e.message);
    needRebuild = true;
  }

  if (needRebuild) {
    console.log('内置分类结构不完整，重建内置分类（保留用户自定义分类和记录）...');
    let oldRecords = [];
    let customCats = [];
    try {
      const recResult = db.exec(`
        SELECT r.amount, r.note, r.record_date, r.created_at,
               c2.name as sub_name, c1.name as main_name
        FROM records r
        JOIN categories c2 ON r.category_id = c2.id
        JOIN categories c1 ON c2.parent_id = c1.id
      `);
      oldRecords = recResult?.[0]?.values || [];
    } catch (e) {
      console.warn('迁移旧记录时查询失败，放弃迁移:', e.message);
      oldRecords = [];
    }

    try {
      const cc = db.exec(`
        SELECT id, name, icon, parent_id, level, sort_order FROM categories WHERE is_custom = 1 ORDER BY id
      `);
      customCats = cc?.[0]?.values || [];
    } catch (e) {
      console.warn('备份用户自定义分类失败:', e.message);
      customCats = [];
    }

    try {
      db.run('DROP TABLE IF EXISTS records');
      db.run('DROP TABLE IF EXISTS categories');
      createTables();
      doInsertCategories();
    } catch (e) {
      console.error('重建内置分类表失败:', e.message);
      return;
    }

    if (customCats.length > 0) {
      try {
        const idMap = {};
        const insCat = db.prepare(
          'INSERT INTO categories (name, icon, parent_id, level, sort_order, is_custom) VALUES (?, ?, ?, ?, ?, 1)'
        );
        const tmpCustomLevel1 = customCats.filter(r => r[4] === 1);
        const tmpCustomLevel2 = customCats.filter(r => r[4] === 2);
        for (const r of tmpCustomLevel1) {
          const [oldId, name, icon, , level, so] = r;
          insCat.run([name, icon || '📌', null, level, so]);
          const lr = db.exec('SELECT last_insert_rowid() AS lid');
          const newId = lr?.[0]?.values?.[0]?.[0];
          if (oldId != null) idMap[oldId] = newId;
        }
        for (const r of tmpCustomLevel2) {
          const [oldId, name, icon, oldPid, level, so] = r;
          insCat.run([name, icon, idMap[oldPid] ? Number(idMap[oldPid]) : null, level, so]);
          const lr = db.exec('SELECT last_insert_rowid() AS lid');
          const newId = lr?.[0]?.values?.[0]?.[0];
          if (oldId != null) idMap[oldId] = newId;
        }
        insCat.free();
        saveDatabase();
      } catch (e) {
        console.error('恢复用户自定义分类失败:', e.message);
      }
    }

    if (oldRecords.length > 0) {
      try {
        const v1 = db.exec('SELECT id, name, parent_id FROM categories ORDER BY id');
        const allRows = v1?.[0]?.values || [];
        const subMap = {};
        for (const row of allRows) {
          const [id, name, pid] = row;
          if (pid !== null && pid !== undefined) {
            subMap[name] = id;
          }
        }

        const insertStmt = db.prepare(
          'INSERT INTO records (id, amount, category_id, note, record_date, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        );
        const { v4: uuidv4 } = require('uuid');
        for (const rec of oldRecords) {
          const [amount, note, record_date, created_at, subName] = rec;
          const newSubId = subMap[subName];
          if (newSubId) {
            insertStmt.run([uuidv4(), amount, newSubId, note, record_date, created_at]);
          }
        }
        insertStmt.free();
        saveDatabase();
      } catch (e) {
        console.error('恢复旧记录失败:', e.message);
      }
    }
  }
}

function saveDatabase() {
  if (!db || !DB_PATH) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (e) {
    console.error('保存数据库失败（文件可能被占用）:', e.message);
    try {
      const tmpPath = DB_PATH + '.tmp-' + Date.now();
      fs.writeFileSync(tmpPath, Buffer.from(db.export()));
      try { fs.renameSync(tmpPath, DB_PATH); } catch (_) { /* noop */ }
    } catch (e2) {
      console.error('备用保存路径也失败:', e2.message);
    }
  }
}

function getAllCategories() {
  if (!db) {
    console.warn('数据库未初始化，返回内置兜底分类');
    return JSON.parse(JSON.stringify(BACKUP_CATEGORIES_RESULT));
  }

  try {
    const result = db.exec(`
      SELECT c1.id, c1.name, c1.icon, c1.level
      FROM categories c1
      WHERE c1.level = 1
      ORDER BY c1.sort_order
    `);

    const mainRows = result?.[0]?.values || [];
    if (mainRows.length === 0) {
      console.warn('categories 表无大类数据，返回内置兜底分类，并尝试重写数据库');
      try {
        doInsertCategories();
      } catch (_) { /* noop */ }
      return JSON.parse(JSON.stringify(BACKUP_CATEGORIES_RESULT));
    }

    const categories = [];
    let totalChildren = 0;
    for (const row of mainRows) {
      const parentId = row[0];
      let childResult;
      try {
        childResult = db.exec(`
          SELECT id, name FROM categories WHERE parent_id = ${parentId} ORDER BY sort_order
        `);
      } catch (e) {
        childResult = null;
      }
      const childrenRows = childResult?.[0]?.values || [];
      totalChildren += childrenRows.length;

      const children = childrenRows.map(r => ({
        id: r[0],
        name: r[1],
      }));

      categories.push({
        id: parentId,
        name: row[1],
        icon: row[2],
        children,
      });
    }

    if (totalChildren === 0) {
      console.warn('所有大类都没有子分类，返回内置兜底分类');
      try {
        db.run('DROP TABLE IF EXISTS categories');
        createTables();
        doInsertCategories();
      } catch (_) { /* noop */ }
      return JSON.parse(JSON.stringify(BACKUP_CATEGORIES_RESULT));
    }

    return categories;
  } catch (e) {
    console.error('查询分类失败，返回内置兜底分类:', e.message);
    return JSON.parse(JSON.stringify(BACKUP_CATEGORIES_RESULT));
  }
}

function addRecord(id, amount, categoryId, note, recordDate) {
  if (!db) throw new Error('数据库未初始化');

  try {
    const chk = db.exec('SELECT COUNT(*) FROM categories');
    const cnt = chk?.[0]?.values?.[0]?.[0] || 0;
    if (cnt === 0) {
      console.warn('写记录前发现分类表为空，立即插入分类');
      doInsertCategories();
    } else {
      const chkId = db.exec(`SELECT id FROM categories WHERE id = ${Number(categoryId)} LIMIT 1`);
      const hasId = chkId?.[0]?.values?.length > 0;
      if (!hasId) {
        console.warn(`写记录时分类ID=${categoryId}不存在，尝试重建分类表`);
        db.run('DROP TABLE IF EXISTS records');
        db.run('DROP TABLE IF EXISTS categories');
        createTables();
        doInsertCategories();
      }
    }
  } catch (e) {
    console.error('写记录前分类校验异常，尝试兜底插入:', e.message);
    try {
      db.run('DROP TABLE IF EXISTS categories');
      createTables();
      doInsertCategories();
    } catch (_) { /* noop */ }
  }

  const stmt = db.prepare(
    'INSERT INTO records (id, amount, category_id, note, record_date) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run([id, amount, categoryId, note, recordDate]);
  stmt.free();
  saveDatabase();
}

function getRecords(limit = 50, offset = 0) {
  const result = db.exec(`
    SELECT r.id, r.amount, r.note, r.record_date, r.created_at,
           c2.name as sub_category, c1.name as main_category, c1.icon
    FROM records r
    JOIN categories c2 ON r.category_id = c2.id
    JOIN categories c1 ON c2.parent_id = c1.id
    ORDER BY r.record_date DESC, r.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return (result[0]?.values || []).map(row => ({
    id: row[0],
    amount: row[1],
    note: row[2],
    recordDate: row[3],
    createdAt: row[4],
    subCategory: row[5],
    mainCategory: row[6],
    icon: row[7],
  }));
}

function getMonthlyStats(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const result = db.exec(`
    SELECT c1.name, c1.icon, SUM(r.amount) as total
    FROM records r
    JOIN categories c2 ON r.category_id = c2.id
    JOIN categories c1 ON c2.parent_id = c1.id
    WHERE r.record_date LIKE '${prefix}%'
    GROUP BY c1.id
    ORDER BY total DESC
  `);

  return (result[0]?.values || []).map(row => ({
    category: row[0],
    icon: row[1],
    total: row[2],
  }));
}

function getYearlyStats(year) {
  const prefix = `${year}-`;
  const result = db.exec(`
    SELECT c1.name, c1.icon, SUM(r.amount) as total
    FROM records r
    JOIN categories c2 ON r.category_id = c2.id
    JOIN categories c1 ON c2.parent_id = c1.id
    WHERE r.record_date LIKE '${prefix}%'
    GROUP BY c1.id
    ORDER BY total DESC
  `);

  return (result[0]?.values || []).map(row => ({
    category: row[0],
    icon: row[1],
    total: row[2],
  }));
}

function getDailyStats(dateStr) {
  const result = db.exec(`
    SELECT c1.name, c1.icon, SUM(r.amount) as total
    FROM records r
    JOIN categories c2 ON r.category_id = c2.id
    JOIN categories c1 ON c2.parent_id = c1.id
    WHERE r.record_date = '${String(dateStr).slice(0, 10)}'
    GROUP BY c1.id
    ORDER BY total DESC
  `);

  return (result[0]?.values || []).map(row => ({
    category: row[0],
    icon: row[1],
    total: row[2],
  }));
}

function getMonthlyTotal(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const result = db.exec(`
    SELECT COALESCE(SUM(amount), 0) FROM records WHERE record_date LIKE '${prefix}%'
  `);
  return result[0]?.values[0]?.[0] || 0;
}

function getYearlyTotal(year) {
  const prefix = `${year}-`;
  const result = db.exec(`
    SELECT COALESCE(SUM(amount), 0) FROM records WHERE record_date LIKE '${prefix}%'
  `);
  return result[0]?.values[0]?.[0] || 0;
}

function getDailyTotal(dateStr) {
  const result = db.exec(`
    SELECT COALESCE(SUM(amount), 0) FROM records WHERE record_date = '${String(dateStr).slice(0, 10)}'
  `);
  return result[0]?.values[0]?.[0] || 0;
}

function getTrendByPeriod(periodType, value) {
  try {
    if (periodType === 'year') {
      const year = Number(value);
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      return months.map(m => {
        const prefix = `${year}-${String(m).padStart(2, '0')}`;
        const r = db.exec(`SELECT COALESCE(SUM(amount),0) FROM records WHERE record_date LIKE '${prefix}%'`);
        return { label: `${m}月`, total: r?.[0]?.values?.[0]?.[0] || 0 };
      });
    }
    if (periodType === 'month') {
      const [y, m] = String(value).split('-').map(Number);
      const prefix = `${y}-${String(m).padStart(2, '0')}-`;
      const daysInMonth = new Date(y, m, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      return days.map(d => {
        const ds = `${prefix}${String(d).padStart(2, '0')}`;
        const r = db.exec(`SELECT COALESCE(SUM(amount),0) FROM records WHERE record_date = '${ds}'`);
        return { label: `${d}日`, total: r?.[0]?.values?.[0]?.[0] || 0 };
      });
    }
    if (periodType === 'day') {
      const dateStr = String(value).slice(0, 10);
      const result = db.exec(`
        SELECT r.record_date, c1.name, SUM(r.amount) AS total
        FROM records r
        JOIN categories c2 ON r.category_id = c2.id
        JOIN categories c1 ON c2.parent_id = c1.id
        WHERE r.record_date = '${dateStr}'
        GROUP BY r.record_date, c1.id
        ORDER BY total DESC
      `);
      return (result?.[0]?.values || []).map(row => ({
        label: row[1],
        total: row[2],
      }));
    }
    return [];
  } catch (e) {
    console.error('getTrendByPeriod error:', e.message);
    return [];
  }
}

function deleteRecord(id) {
  const safeId = String(id).replace(/'/g, "''");
  db.run(`DELETE FROM records WHERE id = '${safeId}'`);
  saveDatabase();
}

function getDatabase() {
  return db;
}

module.exports = {
  initDatabase,
  getDatabase,
  getAllCategories,
  addCategory,
  addRecord,
  getRecords,
  getMonthlyStats,
  getYearlyStats,
  getDailyStats,
  getTrendByPeriod,
  getMonthlyTotal,
  getYearlyTotal,
  getDailyTotal,
  deleteRecord,
};
