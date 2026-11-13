CREATE TABLE IF NOT EXISTS billing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  service TEXT NOT NULL,
  region TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  cost REAL NOT NULL,
  usage_hours REAL NOT NULL,
  capacity_hours REAL NOT NULL DEFAULT 24
);

CREATE INDEX IF NOT EXISTS idx_billing_date ON billing(date);
CREATE INDEX IF NOT EXISTS idx_billing_service ON billing(service);
CREATE INDEX IF NOT EXISTS idx_billing_region ON billing(region);
