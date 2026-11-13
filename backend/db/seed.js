/**
 * seed.js — populates the cloud_costs.db SQLite database with 90 days of
 * multi-cloud billing data and injected anomalies.
 *
 * Usage: node db/seed.js
 */
const { getDb, save } = require('./database');
const fs   = require('fs');
const path = require('path');

async function seedDatabase() {
  const db = await getDb();

  // Apply schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.run(schema);

  // Idempotent: clear existing data before re-seeding
  db.run('DELETE FROM billing');

  // Resource definitions
  const resources = [
    // EC2
    { id: 'i-abc123ef',           service: 'EC2',         region: 'us-east-1',      minCost: 45,  maxCost: 120, avgUsage: 22 },
    { id: 'i-xyz456gh',           service: 'EC2',         region: 'us-west-2',      minCost: 45,  maxCost: 120, avgUsage: 21 },
    { id: 'i-idle-001',           service: 'EC2',         region: 'us-east-1',      isIdle: true },
    { id: 'i-reserved-candidate', service: 'EC2',         region: 'eu-west-1',      minCost: 45,  maxCost: 120, isReservedCandidate: true },
    // S3
    { id: 's3-prod-logs',         service: 'S3',          region: 'us-east-1',      minCost: 5,   maxCost: 15,  avgUsage: 24 },
    { id: 's3-user-uploads',      service: 'S3',          region: 'us-west-2',      minCost: 5,   maxCost: 15,  avgUsage: 24 },
    { id: 's3-temp-cache',        service: 'S3',          region: 'eu-west-1',      minCost: 5,   maxCost: 15,  avgUsage: 24 },
    // Lambda
    { id: 'lambda-billing-proc',  service: 'Lambda',      region: 'us-east-1',      minCost: 2,   maxCost: 8,   avgUsage: 22 },
    { id: 'lambda-auth-trigger',  service: 'Lambda',      region: 'us-west-2',      minCost: 2,   maxCost: 8,   avgUsage: 21 },
    { id: 'lambda-ghost-fn',      service: 'Lambda',      region: 'ap-southeast-1', isGhost: true },
    // RDS
    { id: 'rds-prod-001',         service: 'RDS',         region: 'us-east-1',      minCost: 60,  maxCost: 150, avgUsage: 24, hasSpike: true },
    { id: 'rds-dev-replica',      service: 'RDS',         region: 'us-west-2',      minCost: 60,  maxCost: 150, avgUsage: 24 },
    { id: 'rds-test-db',          service: 'RDS',         region: 'ap-southeast-1', minCost: 60,  maxCost: 150, avgUsage: 24 },
    // GCP Compute
    { id: 'gcp-web-server-01',    service: 'GCP Compute', region: 'us-west-2',      minCost: 35,  maxCost: 90,  avgUsage: 22 },
    { id: 'gcp-oversized-01',     service: 'GCP Compute', region: 'us-west-2',      minCost: 35,  maxCost: 90,  isOversized: true },
    { id: 'gcp-db-replica',       service: 'GCP Compute', region: 'us-east-1',      minCost: 35,  maxCost: 90,  avgUsage: 24 },
    // Azure VM
    { id: 'azure-vm-core',        service: 'Azure VM',    region: 'eu-west-1',      minCost: 40,  maxCost: 100, avgUsage: 22 },
    { id: 'azure-vm-backup',      service: 'Azure VM',    region: 'ap-southeast-1', minCost: 40,  maxCost: 100, avgUsage: 21 },
    { id: 'azure-vm-dev',         service: 'Azure VM',    region: 'us-east-1',      minCost: 40,  maxCost: 100, avgUsage: 20 },
  ];

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function fmtDate(d)     { return d.toISOString().split('T')[0]; }

  const startDate = new Date('2025-04-09T00:00:00Z');
  const endDate   = new Date('2025-07-07T00:00:00Z');

  const stmt = db.prepare(`
    INSERT INTO billing (date, service, region, resource_id, cost, usage_hours, capacity_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = fmtDate(d);
    for (const res of resources) {
      const capacity = 24;
      let cost, usageHours;

      if (res.isIdle) {
        cost = 25; usageHours = 0.5;
      } else if (res.isGhost) {
        cost = 3; usageHours = parseFloat(rand(0.1, 0.2).toFixed(2));
      } else if (res.isOversized) {
        cost = parseFloat(rand(res.minCost, res.maxCost).toFixed(2));
        usageHours = parseFloat(rand(2, 3).toFixed(2));
      } else if (res.isReservedCandidate) {
        cost = parseFloat(rand(res.minCost, res.maxCost).toFixed(2));
        usageHours = parseFloat(rand(22, 24).toFixed(2));
      } else {
        cost = parseFloat(rand(res.minCost, res.maxCost).toFixed(2));
        usageHours = parseFloat(rand(res.avgUsage - 1, Math.min(24, res.avgUsage + 1)).toFixed(2));
        if (res.hasSpike && dateStr >= '2025-06-07' && dateStr <= '2025-06-12') {
          cost = parseFloat((cost * 4).toFixed(2));
        }
      }

      stmt.run([dateStr, res.service, res.region, res.id, cost, usageHours, capacity]);
      count++;
    }
  }
  stmt.free();

  // Persist to disk
  save();

  console.log(`✅ Seeded ${count} billing records (${resources.length} resources × 90 days).`);
  console.log(`   Date range: ${fmtDate(startDate)} → ${fmtDate(endDate)}`);
  console.log(`   Anomalies: idle (i-idle-001), ghost (lambda-ghost-fn), oversized (gcp-oversized-01), spike (rds-prod-001 Jun 7-12), RI candidate (i-reserved-candidate)`);
}

if (require.main === module) {
  seedDatabase().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { seedDatabase };
