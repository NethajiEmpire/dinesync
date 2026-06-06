const express = require('express');
const { getDB } = require('../db/database');
const router = express.Router();

// GET sales history (completed + cancelled)
router.get('/', (req, res) => {
  const db = getDB();
  const { from, to, order_type, payment_method } = req.query;

  let query = "SELECT * FROM orders WHERE status IN ('completed','cancelled')";
  const params = [];

  if (from) {
    query += ' AND DATE(completed_at) >= ?'; params.push(from);
  }
  if (to) {
    query += ' AND DATE(completed_at) <= ?'; params.push(to);
  }
  if (order_type) {
    query += ' AND order_type = ?'; params.push(order_type);
  }
  if (payment_method) {
    query += ' AND payment_method = ?'; params.push(payment_method);
  }

  query += ' ORDER BY created_at DESC LIMIT 1000';
  const orders = db.prepare(query).all(...params);

  const enriched = orders.map(order => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return { ...order, items };
  });
  res.json(enriched);
});

// GET pending bills (credit pay orders)
router.get('/pending', (req, res) => {
  const db = getDB();
  const orders = db.prepare("SELECT * FROM orders WHERE status = 'running' AND payment_method = 'CREDIT' ORDER BY created_at DESC").all();
  const enriched = orders.map(o => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
    return { ...o, items };
  });
  res.json(enriched);
});

// POST pay pending bill
router.post('/pending/:id/pay', (req, res) => {
  const { payment_method = 'CASH' } = req.body;
  const db = getDB();
  db.prepare('UPDATE orders SET status=?, payment_method=?, completed_at=? WHERE id=?')
    .run('completed', payment_method, new Date().toISOString(), req.params.id);
  res.json({ message: 'Bill paid' });
});

module.exports = router;
