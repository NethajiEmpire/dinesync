const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../db/database');
const router = express.Router();

// GET all employees
router.get('/', (req, res) => {
  const employees = getDB().prepare('SELECT id, name, username, plain_password, role, phone, email, status, created_at FROM employees ORDER BY name').all();
  res.json(employees);
});

// POST create employee
router.post('/', (req, res) => {
  const { name, username, password, role, phone, email } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Name, username, password required' });
  }
  const db = getDB();
  const exists = db.prepare('SELECT id FROM employees WHERE username = ?').get(username);
  if (exists) {
    return res.status(400).json({ error: 'Username already taken' });
  }
  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO employees (name, username, password, plain_password, role, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)').run(name, username, hashed, password, role || 'cashier', phone || '', email || '');
  res.json({ id: result.lastInsertRowid, message: 'Employee created' });
});

// PUT update employee
router.put('/:id', (req, res) => {
  const { name, username, password, role, phone, email, status } = req.body;
  const db = getDB();
  if (password && password.trim()) {
    const hashed = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE employees SET name=?, username=?, password=?, plain_password=?, role=?, phone=?, email=?, status=? WHERE id=?')
      .run(name, username, hashed, password, role, phone || '', email || '', status || 'active', req.params.id);
  } else {
    db.prepare('UPDATE employees SET name=?, username=?, role=?, phone=?, email=?, status=? WHERE id=?')
      .run(name, username, role, phone || '', email || '', status || 'active', req.params.id);
  }
  res.json({ message: 'Updated' });
});

// DELETE employee
router.delete('/:id', (req, res) => {
  const db = getDB();
  const emp = db.prepare('SELECT role FROM employees WHERE id=?').get(req.params.id);
  if (emp?.role === 'admin') {
    return res.status(400).json({ error: 'Cannot delete admin user' });
  }
  db.prepare('DELETE FROM employees WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
