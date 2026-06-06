const express = require('express');
const { getDB } = require('../db/database');
const router = express.Router();

// GET all expense categories
router.get('/categories', (req, res) => {
  res.json(getDB().prepare('SELECT * FROM expense_categories ORDER BY name').all());
});

// POST create expense category
router.post('/categories', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }
  const db = getDB();
  const exists = db.prepare('SELECT id FROM expense_categories WHERE name = ?').get(name);
  if (exists) {
    return res.status(400).json({ error: 'Category already exists' });
  }
  const result = db.prepare('INSERT INTO expense_categories (name) VALUES (?)').run(name);
  res.json({ id: result.lastInsertRowid, name });
});

// GET all expenses
router.get('/', (req, res) => {
  const db = getDB();
  const { category, from, to } = req.query;
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];
  if (category) {
    query += ' AND category = ?'; params.push(category);
  }
  if (from) {
    query += ' AND date >= ?'; params.push(from);
  }
  if (to) {
    query += ' AND date <= ?'; params.push(to);
  }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// POST create expense
router.post('/', (req, res) => {
  const { category, sub_category, vendor, employee, payment_type, amount, type, description, date } = req.body;
  if (!category || !amount || !date) {
    return res.status(400).json({ error: 'Category, amount, date required' });
  }
  const db = getDB();
  const result = db.prepare(`
    INSERT INTO expenses (category, sub_category, vendor, employee, payment_type, amount, type, description, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(category, sub_category || '', vendor || '', employee || '', payment_type || 'Cash', Number(amount), type || 'Paid', description || '', date);
  res.json({ id: result.lastInsertRowid, message: 'Expense created' });
});

// DELETE expense
router.delete('/:id', (req, res) => {
  getDB().prepare('DELETE FROM expenses WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
