const express = require('express');
const { getDB, saveDB } = require('../db/database');
const router = express.Router();

// GET all orders
router.get('/', (req, res) => {
  const db = getDB();
  const { status } = req.query;
  const orders = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all();
  const enriched = orders.map(o => ({ ...o, items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id) }));
  res.json(enriched);
});

// GET single order
router.get('/:id', (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ ...order, items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) });
});

// POST create order
router.post('/', (req, res) => {
  const db = getDB();
  const {
    table_id, table_name, order_type = 'Dine In',
    items = [], subtotal = 0, cgst = 0, sgst = 0,
    packing_charge = 0, discount = 0, total = 0,
    payment_method, kot_only = false, existing_order_id,
    status: reqStatus
  } = req.body;

  if (!existing_order_id && (!items || items.length === 0)) {
    return res.status(400).json({ error: 'No items provided' });
  }

  let orderId = existing_order_id;

  if (existing_order_id) {
    if (payment_method) {
      db.prepare('UPDATE orders SET order_type=?, subtotal=?, cgst=?, sgst=?, packing_charge=?, total=?, status=?, payment_method=?, completed_at=? WHERE id=?')
        .run(order_type, subtotal, cgst, sgst, packing_charge, total, 'completed', payment_method, new Date().toISOString(), existing_order_id);
    } else {
        const targetStatus = reqStatus || 'running';
        db.prepare('UPDATE orders SET order_type=?, subtotal=?, cgst=?, sgst=?, packing_charge=?, total=?, status=? WHERE id=?')
          .run(order_type, subtotal, cgst, sgst, packing_charge, total, targetStatus, existing_order_id);
    }
  } else {
      const status = payment_method ? 'completed' : (reqStatus || 'running');
    const result = db.prepare(`
      INSERT INTO orders (table_id, table_name, order_type, status, subtotal, cgst, sgst, packing_charge, discount, total, payment_method, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(table_id || null, table_name, order_type, status, subtotal, cgst, sgst, packing_charge, discount, total,
        payment_method || null, payment_method ? new Date().toISOString() : null);
    orderId = result.lastInsertRowid;
  }

  if (items && items.length > 0) {
    items.forEach(item => {
      db.prepare('INSERT INTO order_items (order_id, menu_item_id, name, size, qty, unit_price) VALUES (?, ?, ?, ?, ?, ?)')
        .run(orderId, item.menu_item_id || null, item.name, item.size || 'Regular', item.qty, item.unit_price);
    });
  }

  saveDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  res.json({ ...order, items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) });
});

// PUT update order
router.put('/:id', (req, res) => {
  const { table_name, order_type, subtotal, cgst, sgst, packing_charge, discount, total, status } = req.body;
  if (status) {
    getDB().prepare('UPDATE orders SET table_name=?, order_type=?, subtotal=?, cgst=?, sgst=?, packing_charge=?, discount=?, total=?, status=? WHERE id=?')
      .run(table_name, order_type, subtotal, cgst, sgst, packing_charge, discount, total, status, req.params.id);
  } else {
    getDB().prepare('UPDATE orders SET table_name=?, order_type=?, subtotal=?, cgst=?, sgst=?, packing_charge=?, discount=?, total=? WHERE id=?')
      .run(table_name, order_type, subtotal, cgst, sgst, packing_charge, discount, total, req.params.id);
  }
  res.json({ message: 'Updated' });
});

// POST complete (pay) order
router.post('/:id/complete', (req, res) => {
  const db = getDB();
  const { payment_method = 'CASH' } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  db.prepare('UPDATE orders SET status=?, payment_method=?, completed_at=? WHERE id=?')
    .run('completed', payment_method, new Date().toISOString(), req.params.id);
  res.json({ message: 'Order completed' });
});

// POST cancel order
router.post('/:id/cancel', (req, res) => {
  getDB().prepare("UPDATE orders SET status='cancelled' WHERE id=?").run(req.params.id);
  res.json({ message: 'Order cancelled' });
});

// POST add KOT items
router.post('/:id/kot', (req, res) => {
  const db = getDB();
  const { items = [] } = req.body;
  items.forEach(item => {
    db.prepare('INSERT INTO order_items (order_id, name, size, qty, unit_price) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, item.name, item.size || 'Regular', item.qty, item.unit_price);
  });
  res.json({ message: 'KOT items added' });
});

module.exports = router;
