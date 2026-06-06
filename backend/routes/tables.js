const express = require('express');
const { getDB } = require('../db/database');
const router = express.Router();

// GET all tables
router.get('/', (req, res) => {
  const tables = getDB().prepare('SELECT * FROM restaurant_tables ORDER BY section, name').all();
  res.json(tables);
});

// POST add table
router.post('/', (req, res) => {
  const { name, section, capacity } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Table name required' });
  }
  const db = getDB();
  const exists = db.prepare('SELECT id FROM restaurant_tables WHERE name = ?').get(name);
  if (exists) {
    return res.status(400).json({ error: 'Table name already exists' });
  }
  const result = db.prepare('INSERT INTO restaurant_tables (name, section, capacity) VALUES (?, ?, ?)').run(name, section || '1st FLOOR', capacity || 4);
  res.json({ id: result.lastInsertRowid, message: 'Table added' });
});

// PUT update table
router.put('/:id', (req, res) => {
  const { name, section, capacity, status } = req.body;
  getDB().prepare('UPDATE restaurant_tables SET name=?, section=?, capacity=?, status=? WHERE id=?').run(name, section, capacity || 4, status || 'available', req.params.id);
  res.json({ message: 'Updated' });
});

// DELETE table
router.delete('/:id', (req, res) => {
  getDB().prepare('DELETE FROM restaurant_tables WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
