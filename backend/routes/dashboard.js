const express = require('express');
const { getDB } = require('../db/database');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDB();
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  // Running orders breakdown
  const runningOrders = db.prepare("SELECT * FROM orders WHERE status = 'running'").all();
  const running = {
    dine_in: runningOrders.filter(o => o.order_type === 'Dine In').length,
    dine_in_amount: runningOrders.filter(o => o.order_type === 'Dine In').reduce((s, o) => s + (o.total || 0), 0),
    parcel: runningOrders.filter(o => o.order_type === 'Take Away').length,
    parcel_amount: runningOrders.filter(o => o.order_type === 'Take Away').reduce((s, o) => s + (o.total || 0), 0),
    delivery: runningOrders.filter(o => o.order_type === 'Home Delivery').length,
    delivery_amount: runningOrders.filter(o => o.order_type === 'Home Delivery').reduce((s, o) => s + (o.total || 0), 0),
    total: runningOrders.length,
    total_amount: runningOrders.reduce((s, o) => s + (o.total || 0), 0),
  };

  // Today completed
  const todayOrders = db.prepare("SELECT * FROM orders WHERE status = 'completed' AND DATE(completed_at) = ?").all(today);
  const todayData = {
    dine_in: todayOrders.filter(o => o.order_type === 'Dine In').length,
    dine_in_amount: todayOrders.filter(o => o.order_type === 'Dine In').reduce((s, o) => s + (o.total || 0), 0),
    parcel: todayOrders.filter(o => o.order_type === 'Take Away').length,
    parcel_amount: todayOrders.filter(o => o.order_type === 'Take Away').reduce((s, o) => s + (o.total || 0), 0),
    delivery: todayOrders.filter(o => o.order_type === 'Home Delivery').length,
    delivery_amount: todayOrders.filter(o => o.order_type === 'Home Delivery').reduce((s, o) => s + (o.total || 0), 0),
    total: todayOrders.length,
    total_amount: todayOrders.reduce((s, o) => s + (o.total || 0), 0),
  };

  // Recent sales
  const recent_sales = db.prepare("SELECT * FROM orders WHERE status='completed' ORDER BY completed_at DESC LIMIT 15").all();

  // Weekly revenue (last 7 days)
  const weekly = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA');
    const dayOrders = db.prepare("SELECT SUM(total) as total FROM orders WHERE status='completed' AND DATE(completed_at)=?").get(dateStr);
    weekly.push({ date: dateStr, total: dayOrders?.total || 0 });
  }

  res.json({ running, today: todayData, recent_sales, weekly });
});

module.exports = router;
