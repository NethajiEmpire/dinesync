const express = require('express');
const { getDB } = require('../db/database');
const router = express.Router();

// GET all inventory items
router.get('/', (req, res) => {
  res.json(getDB().prepare('SELECT * FROM inventory ORDER BY name').all());
});

// POST add inventory item
router.post('/', (req, res) => {
  const { name, uom, par_stock, par_unit } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }
  const result = getDB().prepare('INSERT INTO inventory (name, uom, par_stock, par_unit) VALUES (?, ?, ?, ?)').run(name, uom || 'Weight/Litre', Number(par_stock) || 0, par_unit || 'g');
  res.json({ id: result.lastInsertRowid, message: 'Ingredient added' });
});

// PUT update inventory item
router.put('/:id', (req, res) => {
  const { name, uom, par_stock, par_unit, current_stock } = req.body;
  getDB().prepare('UPDATE inventory SET name=?, uom=?, par_stock=?, par_unit=?, current_stock=? WHERE id=?')
    .run(name, uom, Number(par_stock) || 0, par_unit, Number(current_stock) || 0, req.params.id);
  res.json({ message: 'Updated' });
});

// DELETE inventory item
router.delete('/:id', (req, res) => {
  getDB().prepare('DELETE FROM inventory WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// GET all stock transactions
router.get('/transactions', (req, res) => {
  const db = getDB();
  const txs = db.prepare(`
    SELECT st.*, i.name as item_name 
    FROM stock_transactions st
    LEFT JOIN inventory i ON st.inventory_id = i.id
    ORDER BY st.created_at DESC LIMIT 200
  `).all();
  res.json(txs);
});

// POST add stock transaction
router.post('/transactions', (req, res) => {
  const { inventory_id, type, quantity, price, notes } = req.body;
  if (!inventory_id || !quantity) {
    return res.status(400).json({ error: 'inventory_id and quantity required' });
  }
  const db = getDB();
  const item = db.prepare('SELECT name FROM inventory WHERE id=?').get(inventory_id);

  // Update current stock
  const delta = ['Purchase'].includes(type) ? Number(quantity) : -Number(quantity);
  db.prepare('UPDATE inventory SET current_stock = MAX(0, current_stock + ?) WHERE id=?').run(delta, inventory_id);

  const result = db.prepare('INSERT INTO stock_transactions (inventory_id, item_name, type, quantity, price, notes) VALUES (?, ?, ?, ?, ?, ?)')
    .run(inventory_id, item?.name || '', type || 'Purchase', Number(quantity), Number(price) || 0, notes || '');
  res.json({ id: result.lastInsertRowid, message: 'Transaction added' });
});

module.exports = router;
