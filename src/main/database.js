const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
let DB_DIR, DB_PATH;

const CATEGORIES = [
  { name: '餐饮美食', icon: '🍜', children: ['三餐主食', '外卖', '水果零食', '饮品奶茶', '聚餐宴请'] },
  { name: '交通出行', icon: '🚗', children: ['公交地铁', '打车', '火车/飞机', '加油/停车', '维修保养'] },
  { name: '购物消费', icon: '🛒', children: ['日用百货', '服装鞋帽', '数码电器', '美妆护肤'] },
  { name: '居住生活', icon: '🏠', children: ['房租/房贷', '水电燃气', '物业费', '家居维修'] },
  { name: '娱乐休闲', icon: '🎮', children: ['游戏充值', '电影/演出', '运动健身', '旅游度假'] },
  { name: '医疗健康', icon: '🏥', children: ['看病/药费', '体检', '保健品'] },
  { name: '学习教育', icon: '📚', children: ['书籍购买', '课程培训', '文具用品'] },
  { name: '其他', icon: '📦', children: ['红包礼金', '公益捐赠', '其他支出'] },
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

function initCategories() {
  const result = db.exec('SELECT COUNT(*) as cnt FROM categories');
  const count = result[0]?.values[0][0] || 0;

  if (count > 0) return;

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
  saveDatabase();
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
