const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB, seedTenantData } = require('../db/database');
const { getMasterDB } = require('../db/master');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, mobile, email, address, restaurant_name, tagline } = req.body;

  if (!name || !mobile || !email || !restaurant_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const masterDb = getMasterDB();
  
  // Calculate sequence
  const countRow = masterDb.prepare('SELECT COUNT(*) as count FROM clients').get();
  const seq = (countRow.count || 0) + 1;
  
  // Generate client_code and username
  const prefix = name.replace(/\s+/g, '').substring(0, 2).toLowerCase();
  const client_code = `${prefix}${seq}`;
  const username = `${client_code}@admin`;
  const db_name = `tenant_${client_code}`;

  try {
    masterDb.prepare(`
      INSERT INTO clients (name, mobile, email, address, restaurant_name, client_code, username, db_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, mobile, email, address, restaurant_name, client_code, username, db_name);

    // Initialize the tenant DB and seed it
    seedTenantData(client_code, {
      username: 'admin',
      name,
      restaurant_name,
      address,
      mobile,
      email
    });

    // Explicitly populate the admin profile settings with the registered details
    const tenantDb = getDB(client_code);
    const settingsToUpdate = [
      { key: 'owner_name', value: name },
      { key: 'restaurant_name', value: restaurant_name },
      { key: 'phone', value: mobile },
      { key: 'email', value: email },
      { key: 'address', value: address },
      { key: 'tagline', value: tagline || '' }
    ];

    settingsToUpdate.forEach(item => {
      if (item.value) {
        const existing = tenantDb.prepare("SELECT key FROM settings WHERE key = ?").get(item.key);
        if (existing) {
          tenantDb.prepare("UPDATE settings SET value = ? WHERE key = ?").run(item.value, item.key);
        } else {
          tenantDb.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(item.key, item.value);
        }
      }
    });

    res.status(201).json({
      message: 'Registration successful',
      client_code,
      username
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const masterDb = getMasterDB();
  const client = masterDb.prepare("SELECT * FROM clients WHERE username = ?").get(username);
  if (!client) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  if (password !== 'admin1118') {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const token = jwt.sign({
    id: client.id,
    username: client.username,
    role: 'admin',
    name: client.name,
    tenantId: client.client_code
  }, JWT_SECRET, { expiresIn: '12h' });

  res.json({
    token,
    user: {
      id: client.id,
      name: client.name,
      username: client.username,
      role: 'admin',
      tenantId: client.client_code
    }
  });
});

router.post('/employee-login', (req, res) => {
  const { username, password, client_code: reqClientCode } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  let empUsername = username;
  let client_code = reqClientCode;

  if (username.includes('@')) {
    const parts = username.split('@');
    client_code = parts[0];
    empUsername = parts[1];
  } else if (!client_code) {
    return res.status(400).json({ error: 'Invalid format. Use clientcode@username (e.g., ha2@cashier)' });
  }

  const masterDb = getMasterDB();
  const client = masterDb.prepare("SELECT * FROM clients WHERE client_code = ?").get(client_code);
  
  if (!client) {
    return res.status(401).json({ error: 'Invalid client code' });
  }

  let db;
  try {
    db = getDB(client_code);
  } catch(e) {
    return res.status(500).json({ error: 'Tenant DB error' });
  }

  const user = db.prepare('SELECT * FROM employees WHERE username = ? AND status = ?').get(empUsername, 'active');
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    tenantId: client_code
  }, JWT_SECRET, { expiresIn: '12h' });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      tenantId: client_code
    }
  });
});

module.exports = router;
