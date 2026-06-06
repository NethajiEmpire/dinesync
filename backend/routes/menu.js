const express = require('express');
const { getDB } = require('../db/database');
const router = express.Router();

// GET all menu items
router.get('/', (req, res) => {
  const db = getDB();
  const items = db.prepare('SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name').all();
  res.json(items.map(item => ({
    ...item,
    sizes: (() => { try { return JSON.parse(item.sizes); } catch { return [{ name: 'Regular', price: item.price }]; } })()
  })));
});

// POST create menu item
router.post('/', (req, res) => {
  const { name, category, price, type, sizes } = req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Name, category, price required' });
  }
  const db = getDB();
  const sizesStr = typeof sizes === 'string' ? sizes : JSON.stringify(sizes || [{ name: 'Regular', price }]);
  const result = db.prepare('INSERT INTO menu_items (name, category, price, type, sizes) VALUES (?, ?, ?, ?, ?)').run(name, category, Number(price), type || 'veg', sizesStr);
  res.json({ id: result.lastInsertRowid, message: 'Menu item added' });
});

// PUT update menu item
router.put('/:id', (req, res) => {
  const { name, category, price, type, sizes, available } = req.body;
  const db = getDB();
  const sizesStr = typeof sizes === 'string' ? sizes : JSON.stringify(sizes);
  db.prepare('UPDATE menu_items SET name=?, category=?, price=?, type=?, sizes=?, available=? WHERE id=?')
    .run(name, category, Number(price), type, sizesStr, available !== undefined ? available : 1, req.params.id);
  res.json({ message: 'Updated' });
});

// DELETE menu item
router.delete('/:id', (req, res) => {
  getDB().prepare('DELETE FROM menu_items WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
