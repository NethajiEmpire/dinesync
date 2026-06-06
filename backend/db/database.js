const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { AsyncLocalStorage } = require('async_hooks');
const tenantStorage = new AsyncLocalStorage();
const { initMasterDB } = require('./master');

let SQL = null;
const tenantDbs = new Map();
const saveTimers = new Map();

function getDbPath(tenantId) {
  return path.join(__dirname, '..', `tenant_${tenantId}.db`);
}

function saveTenantDB(tenantId) {
  const db = tenantDbs.get(tenantId);
  if (!db) return;
  try {
    const data = db.export();
    fs.writeFileSync(getDbPath(tenantId), Buffer.from(data));
  } catch (e) {
    console.error(`Save error for ${tenantId}:`, e.message);
  }
}

function scheduleSave(tenantId) {
  clearTimeout(saveTimers.get(tenantId));
  saveTimers.set(tenantId, setTimeout(() => saveTenantDB(tenantId), 800));
}

function makeStmt(rawDb, tenantId, sql) {
  return {
    run(...args) {
      const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      rawDb.run(sql, flat);
      const idRow = rawDb.exec('SELECT last_insert_rowid() AS id');
      const lastInsertRowid = idRow[0]?.values[0]?.[0] ?? null;
      scheduleSave(tenantId);
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

function createTenantSchema(rawDb) {
  const schema = `
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      plain_password TEXT DEFAULT '',
      role TEXT DEFAULT 'cashier', phone TEXT DEFAULT '', email TEXT DEFAULT '',
      status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS restaurant_tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      section TEXT DEFAULT '1st FLOOR', capacity INTEGER DEFAULT 4,
      status TEXT DEFAULT 'available', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      category TEXT NOT NULL, price REAL NOT NULL, type TEXT DEFAULT 'veg',
      sizes TEXT DEFAULT '[]', available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, table_id INTEGER, table_name TEXT,
      order_type TEXT DEFAULT 'Dine In', status TEXT DEFAULT 'running',
      subtotal REAL DEFAULT 0, cgst REAL DEFAULT 0, sgst REAL DEFAULT 0,
      packing_charge REAL DEFAULT 0, discount REAL DEFAULT 0, total REAL DEFAULT 0,
      payment_method TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, completed_at DATETIME
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL,
      menu_item_id INTEGER, name TEXT NOT NULL, size TEXT DEFAULT 'Regular',
      qty INTEGER DEFAULT 1, unit_price REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS expense_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT NOT NULL,
      sub_category TEXT DEFAULT '', vendor TEXT DEFAULT '', employee TEXT DEFAULT '',
      payment_type TEXT DEFAULT 'Cash', amount REAL NOT NULL, type TEXT DEFAULT 'Paid',
      description TEXT DEFAULT '', date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      uom TEXT DEFAULT 'Weight/Litre', par_stock REAL DEFAULT 0,
      par_unit TEXT DEFAULT 'g', current_stock REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS stock_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, inventory_id INTEGER NOT NULL,
      item_name TEXT DEFAULT '', type TEXT DEFAULT 'Purchase',
      quantity REAL NOT NULL, price REAL DEFAULT 0, notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS delivery_partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT DEFAULT '',
      vehicle_number TEXT DEFAULT '', license_number TEXT DEFAULT '',
      status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  rawDb.run(schema);
}

function loadTenant(tenantId) {
  if (tenantDbs.has(tenantId)) return;
  const dbPath = getDbPath(tenantId);
  let rawDb;
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    rawDb = new SQL.Database(buf);
  } else {
    rawDb = new SQL.Database();
  }

  // Add delivery_partners table if it doesn't exist (for existing tenants)
  const existingTables = rawDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='delivery_partners'");
  if (!existingTables.length) {
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS delivery_partners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT DEFAULT '',
        vehicle_number TEXT DEFAULT '', license_number TEXT DEFAULT '',
        status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  tenantDbs.set(tenantId, rawDb);
  createTenantSchema(rawDb);
  
  // Migration to add plain_password to existing databases
  const empInfo = rawDb.exec("PRAGMA table_info(employees)");
  if (empInfo.length > 0 && empInfo[0].values) {
    const hasPlainPwd = empInfo[0].values.some(row => row[1] === 'plain_password');
    if (!hasPlainPwd) {
      rawDb.run("ALTER TABLE employees ADD COLUMN plain_password TEXT DEFAULT ''");
    }
  }

  saveTenantDB(tenantId);
}

function getDB(tenantId) {
  tenantId = tenantId || tenantStorage.getStore();
  if (!tenantId) throw new Error('Tenant ID required');
  if (!tenantDbs.has(tenantId)) {
    loadTenant(tenantId);
  }
  const rawDb = tenantDbs.get(tenantId);
  return {
    prepare: (sql) => makeStmt(rawDb, tenantId, sql),
    exec: (sql) => { rawDb.run(sql); scheduleSave(tenantId); }
  };
}

async function initDB() {
  SQL = await initSqlJs();
  await initMasterDB(SQL);
  console.log('✅ Tenant DB System initialized (Multi-Tenant Offline)');
}

function seedTenantData(tenantId, clientData) {
  const db = getDB(tenantId);

  // Users
  const existingAdmin = db.prepare("SELECT * FROM employees WHERE role = 'admin'").get();
  if (!existingAdmin) {
    db.prepare('INSERT INTO employees (name,username,password,plain_password,role) VALUES (?,?,?,?,?)').run(clientData.name || 'Administrator', clientData.username, bcrypt.hashSync('admin1118',10), 'admin1118', 'admin');
    console.log(`✅ Users seeded for tenant ${tenantId}`);
  }

  // Tables are no longer auto-seeded. 
  // Users will start with a fresh empty database and can generate slots via the Admin panel.

  // Menu
  const hasMenu = db.prepare('SELECT id FROM menu_items LIMIT 1').get();
  if (!hasMenu) {
    const items = [
      ['Full Meals','MEALS',120,'veg',[{name:'Full',price:120},{name:'Half',price:70}]],
      ['Mini Meals','MEALS',80,'veg',[{name:'Regular',price:80}]],
      ['Special Thali','MEALS',180,'veg',[{name:'Regular',price:180}]],
      ['Paneer Butter Masala','MAIN COURSE',160,'veg',[{name:'Half',price:100},{name:'Full',price:160}]],
      ['Dal Tadka','MAIN COURSE',90,'veg',[{name:'Half',price:60},{name:'Full',price:90}]],
      ['Shahi Paneer','MAIN COURSE',170,'veg',[{name:'Half',price:100},{name:'Full',price:170}]],
      ['Chicken Curry','MAIN COURSE',180,'nonveg',[{name:'Half',price:110},{name:'Full',price:180}]],
      ['Mutton Masala','MAIN COURSE',220,'nonveg',[{name:'Half',price:130},{name:'Full',price:220}]],
      ['Fish Curry','MAIN COURSE',190,'nonveg',[{name:'Half',price:110},{name:'Full',price:190}]],
      ['Veg Fried Rice','FRIED RICE',100,'veg',[{name:'Half',price:70},{name:'Full',price:100}]],
      ['Egg Fried Rice','FRIED RICE',110,'nonveg',[{name:'Half',price:75},{name:'Full',price:110}]],
      ['Chicken Fried Rice','FRIED RICE',140,'nonveg',[{name:'Half',price:90},{name:'Full',price:140}]],
      ['Schezwan Fried Rice','FRIED RICE',120,'veg',[{name:'Half',price:80},{name:'Full',price:120}]],
      ['Tomato Soup','SOUPS',60,'veg',[{name:'Regular',price:60}]],
      ['Chicken Sweet Corn Soup','SOUPS',80,'nonveg',[{name:'Regular',price:80}]],
      ['Hot & Sour Soup','SOUPS',75,'veg',[{name:'Regular',price:75}]],
      ['Gobi Manchurian','STARTERS',120,'veg',[{name:'Dry',price:120},{name:'Gravy',price:130}]],
      ['Paneer 65','STARTERS',150,'veg',[{name:'Regular',price:150}]],
      ['Chicken 65','STARTERS',170,'nonveg',[{name:'Regular',price:170},{name:'Special',price:200}]],
      ['Chicken Lollipop','STARTERS',200,'nonveg',[{name:'4 Pcs',price:200},{name:'6 Pcs',price:280}]],
      ['Prawn Fry','STARTERS',220,'nonveg',[{name:'Regular',price:220}]],
      ['Chapati','BREADS',15,'veg',[{name:'Per Piece',price:15}]],
      ['Butter Roti','BREADS',20,'veg',[{name:'Per Piece',price:20}]],
      ['Naan','BREADS',30,'veg',[{name:'Plain',price:30},{name:'Butter',price:40},{name:'Garlic',price:45}]],
      ['Parotta','BREADS',20,'veg',[{name:'Per Piece',price:20}]],
      ['Gulab Jamun','DESSERTS',50,'veg',[{name:'2 Pcs',price:50}]],
      ['Rasmalai','DESSERTS',70,'veg',[{name:'2 Pcs',price:70}]],
      ['Masala Chai','BEVERAGES',20,'veg',[{name:'Regular',price:20}]],
      ['Filter Coffee','BEVERAGES',25,'veg',[{name:'Regular',price:25}]],
      ['Lassi','BEVERAGES',50,'veg',[{name:'Sweet',price:50},{name:'Salty',price:50},{name:'Mango',price:60}]],
      ['Vanilla Ice Cream','ICE CREAMS',60,'veg',[{name:'Single',price:60},{name:'Double',price:100}]],
      ['Chocolate Ice Cream','ICE CREAMS',70,'veg',[{name:'Single',price:70},{name:'Double',price:120}]],
    ];
    items.forEach(([n,c,p,t,s]) => db.prepare('INSERT INTO menu_items (name,category,price,type,sizes) VALUES (?,?,?,?,?)').run(n,c,p,t,JSON.stringify(s)));
    console.log(`✅ ${items.length} menu items seeded for tenant ${tenantId}`);
  }

  // Expense categories
  const hasCats = db.prepare('SELECT id FROM expense_categories LIMIT 1').get();
  if (!hasCats) {
    ['Kitchen Supplies','Staff Salary','Utilities','Maintenance','Raw Materials','Packaging','Marketing','Miscellaneous']
      .forEach(c => db.prepare('INSERT OR IGNORE INTO expense_categories (name) VALUES (?)').run(c));
  }

  // Settings
  const hasSettings = db.prepare("SELECT key FROM settings WHERE key='restaurant_name'").get();
  if (!hasSettings) {
    const defs = {
      restaurant_name: clientData.restaurant_name || "Restaurant", tagline: clientData.tagline || '',
      owner_name: clientData.name || '',
      address: clientData.address || '',
      phone: clientData.mobile || '', phone2:'', email: clientData.email || '',
      gstin:'', fssai:'',
      cgst_percent:'2.5', sgst_percent:'2.5', service_charge_percent:'0',
      packing_charge:'10', delivery_charge:'30',
      enable_packing_charge: 'true', enable_delivery_charge: 'true', 
      enable_additional_charge: 'false', enable_item_wise_charges: 'false',
      custom_additional_charge_name: 'Service Fee', custom_additional_charge_amount: '0',
      cashier_show_finedine: 'true',
      cashier_show_takeaway: 'true',
      cashier_show_homedelivery: 'true',
      cashier_show_custom: 'true',
      cashier_show_orders: 'true',
      receipt_header:`Welcome to ${clientData.restaurant_name || "Restaurant"}`,
      receipt_footer:'Thank you for dining with us!',
      thank_you_message:'We hope to see you again!'
    };
    Object.entries(defs).forEach(([k,v]) => db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').run(k,v));
    console.log(`✅ Settings seeded for tenant ${tenantId}`);
  }
}

module.exports = { getDB, initDB, seedTenantData, tenantStorage, saveDB: () => {} };
