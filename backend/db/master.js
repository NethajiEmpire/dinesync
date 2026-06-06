const fs = require('fs');
const path = require('path');

const MASTER_DB_PATH = path.join(__dirname, '..', 'master.db');
let rawDb = null;
let saveTimer = null;

function saveMasterDB() {
  if (!rawDb) return;
  try {
    const data = rawDb.export();
    fs.writeFileSync(MASTER_DB_PATH, Buffer.from(data));
  } catch (e) { console.error('Master DB Save error:', e.message); }
}

function scheduleMasterSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveMasterDB, 800);
}

function makeMasterStmt(sql) {
  return {
    run(...args) {
      const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      rawDb.run(sql, flat);
      const idRow = rawDb.exec('SELECT last_insert_rowid() AS id');
      const lastInsertRowid = idRow[0]?.values[0]?.[0] ?? null;
      scheduleMasterSave();
      return { lastInsertRowid };
    },
    get(...args) {
      const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      const stmt = rawDb.prepare(sql);
      try {
        stmt.bind(flat.length ? flat : []);
        if (stmt.step()) {
          return stmt.getAsObject();
        }
        return undefined;
      } finally { stmt.free(); }
    },
    all(...args) {
      const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      const stmt = rawDb.prepare(sql);
      try {
        stmt.bind(flat.length ? flat : []);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        return rows;
      } finally { stmt.free(); }
    }
  };
}

function getMasterDB() {
  if (!rawDb) throw new Error('Master DB not initialized');
  return { prepare: makeMasterStmt, exec: (sql) => { rawDb.run(sql); scheduleMasterSave(); } };
}

async function initMasterDB(SQL) {
  if (fs.existsSync(MASTER_DB_PATH)) {
    const buf = fs.readFileSync(MASTER_DB_PATH);
    rawDb = new SQL.Database(buf);
  } else {
    rawDb = new SQL.Database();
  }

  const schema = `
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT,
      restaurant_name TEXT NOT NULL,
      client_code TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      db_name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  rawDb.run(schema);
  saveMasterDB();
  console.log('✅ Master Database initialized');
}

module.exports = { initMasterDB, getMasterDB };
