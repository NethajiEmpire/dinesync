const express = require('express');
const { getDB } = require('../db/database');
const router = express.Router();

// GET all settings as key-value object
router.get('/', (req, res) => {
  const rows = getDB().prepare('SELECT * FROM settings').all();
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  res.json(obj);
});

// PUT update settings
router.put('/', (req, res) => {
  const db = getDB();
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  try {
    Object.entries(req.body).forEach(([k, v]) => upsert.run(k, String(v ?? '')));
    res.json({ message: 'Settings saved' });
  } catch (error) {
    console.error('Settings save error:', error);
    res.status(500).json({ message: 'Error saving settings' });
  }
});

module.exports = router;
