const express = require('express');
const path    = require('path');
const fs      = require('fs');
const app     = express();
const PORT    = process.env.PORT || 3000;
const { seedDatabase } = require('./db/seed');

app.use(express.json());

// Routes — all mounted under /api
app.use('/api/costs',           require('./routes/costs'));
app.use('/api/recommendations', require('./routes/recommendations'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Catch-all for client-side routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

async function startServer() {
  const dataDir = process.env.DATA_DIR || path.join(__dirname, 'db');
  const dbPath = path.join(dataDir, 'cloud_costs.db');
  
  if (!fs.existsSync(dbPath)) {
    console.log(`Database not found at ${dbPath}. Running initial seed...`);
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`🚀 CloudCost unified server running on port ${PORT}`);
    console.log(`   API Endpoints: /api/costs/summary | /api/costs/trend | /api/costs/by-service | /api/recommendations`);
    console.log(`   Serving frontend from: ${frontendDistPath}`);
  });
}

startServer();
