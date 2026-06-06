const express = require('express');
const { getDB } = require('../db/database');
const router = express.Router();

// GET all delivery partners
router.get('/', (req, res) => {
  const partners = getDB().prepare('SELECT * FROM delivery_partners ORDER BY name').all();
  res.json(partners);
});

// POST create delivery partner
router.post('/', (req, res) => {
  const { name, phone, email, vehicle_number, license_number } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }
  const db = getDB();
  const exists = db.prepare('SELECT id FROM delivery_partners WHERE phone = ?').get(phone);
  if (exists) {
    return res.status(400).json({ error: 'Phone number already registered' });
  }
  const result = db.prepare('INSERT INTO delivery_partners (name, phone, email, vehicle_number, license_number) VALUES (?, ?, ?, ?, ?)').run(name, phone, email || '', vehicle_number || '', license_number || '');
  res.json({ id: result.lastInsertRowid, message: 'Delivery partner created' });
});

// PUT update delivery partner
router.put('/:id', (req, res) => {
  const { name, phone, email, vehicle_number, license_number, status } = req.body;
  const db = getDB();
  db.prepare('UPDATE delivery_partners SET name=?, phone=?, email=?, vehicle_number=?, license_number=?, status=? WHERE id=?')
    .run(name, phone, email || '', vehicle_number || '', license_number || '', status || 'active', req.params.id);
  res.json({ message: 'Updated' });
});

// DELETE delivery partner
router.delete('/:id', (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM delivery_partners WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;