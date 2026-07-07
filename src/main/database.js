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

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  createTables();
  initCategories();
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
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    )
  `);

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
    const mainResult = db.exec('SELECT id, name FROM categories WHERE level = 1 ORDER BY sort_order');
    if (!mainResult[0] || mainResult[0].values.length !== CATEGORIES.length) {
      return false;
    }
    for (let i = 0; i < mainResult[0].values.length; i++) {
      const [pid, pname] = mainResult[0].values[i];
      const expected = CATEGORIES[i];
      if (pname !== expected.name) return false;
      const subResult = db.exec(
        `SELECT id FROM categories WHERE parent_id = ${pid} ORDER BY sort_order`
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
    'INSERT INTO categories (name, icon, parent_id, level, sort_order) VALUES (?, ?, ?, ?, ?)'
  );

  CATEGORIES.forEach((cat, index) => {
    stmt.run([cat.name, cat.icon, null, 1, index]);
    const parentId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];

    cat.children.forEach((childName, childIndex) => {
      stmt.run([childName, null, parentId, 2, childIndex]);
    });
  });

  stmt.free();
}

function initCategories() {
  const result = db.exec('SELECT COUNT(*) as cnt FROM categories');
  const count = result[0]?.values[0][0] || 0;

  if (count === 0) {
    doInsertCategories();
    saveDatabase();
    return;
  }

  if (!isCategoriesStructureValid()) {
    console.log('分类结构不完整，重建分类表...');
    const recResult = db.exec(`
      SELECT r.amount, r.note, r.record_date, r.created_at,
             c2.name as sub_name, c1.name as main_name
      FROM records r
      JOIN categories c2 ON r.category_id = c2.id
      JOIN categories c1 ON c2.parent_id = c1.id
    `);
    const oldRecords = recResult[0]?.values || [];

    db.run('DROP TABLE IF EXISTS records');
    db.run('DROP TABLE IF EXISTS categories');
    createTables();
    doInsertCategories();

    if (oldRecords.length > 0) {
      const v1 = db.exec('SELECT id, name, parent_id FROM categories ORDER BY id');
      const allRows = v1[0]?.values || [];
      const subMap = {};
      for (const row of allRows) {
        const [id, name, pid] = row;
        if (pid !== null) {
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
    }
    saveDatabase();
  }
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function getAllCategories() {
  const result = db.exec(`
    SELECT c1.id, c1.name, c1.icon, c1.level
    FROM categories c1
    WHERE c1.level = 1
    ORDER BY c1.sort_order
  `);

  const categories = [];
  for (const row of result[0]?.values || []) {
    const parentId = row[0];
    const childResult = db.exec(`
      SELECT id, name FROM categories WHERE parent_id = ${parentId} ORDER BY sort_order
    `);

    const children = (childResult[0]?.values || []).map(r => ({
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

  return categories;
}

function addRecord(id, amount, categoryId, note, recordDate) {
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

function getMonthlyTotal(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const result = db.exec(`
    SELECT COALESCE(SUM(amount), 0) FROM records WHERE record_date LIKE '${prefix}%'
  `);
  return result[0]?.values[0]?.[0] || 0;
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
  addRecord,
  getRecords,
  getMonthlyStats,
  getMonthlyTotal,
  deleteRecord,
};
