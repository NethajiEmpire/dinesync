const express = require('express');
const cors = require('cors');
const { initDB, tenantStorage } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const tenantId = req.headers["x-tenant-id"];
  if (tenantId) {
    tenantStorage.run(tenantId, () => next());
  } else {
    next();
  }
});

// Mount routes after DB is ready
async function startServer() {
  await initDB();

  app.use('/api/auth',      require('./routes/auth'));
  app.use('/api/menu',      require('./routes/menu'));
  app.use('/api/tables',    require('./routes/tables'));
  app.use('/api/orders',    require('./routes/orders'));
  app.use('/api/sales',     require('./routes/sales'));
  app.use('/api/expenses',  require('./routes/expenses'));
  app.use('/api/employees', require('./routes/employees'));
  app.use('/api/inventory', require('./routes/inventory'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/settings',  require('./routes/settings'));
  app.use('/api/partners', require('./routes/partners'));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
  app.use('/api/*', (req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  });

  app.listen(PORT, () => {
    console.log(`\n🚀 RestoPOS Backend → http://localhost:${PORT}`);
    console.log(`📋 Health check → http://localhost:${PORT}/api/health`);
    console.log(`🗄️  Database: SQLite via sql.js (Fully Offline)\n`);
  });
}

startServer().catch(err => { console.error('Startup failed:', err); process.exit(1); });
