const express = require('express');
const router  = express.Router();
const { getDb } = require('../db/database');

/**
 * Helper: run a SELECT and return all rows as an array of plain objects.
 * sql.js returns { columns: [...], values: [[...], ...] }
 */
function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(db, sql, params = []) {
  const rows = queryAll(db, sql, params);
  return rows[0] || null;
}

/**
 * Build a WHERE clause from filter params.
 * Returns { where: string, params: [] }
 */
function buildWhere({ start, end, service, region }) {
  const conditions = [];
  const params     = [];
  if (start)   { conditions.push('date >= ?');    params.push(start);   }
  if (end)     { conditions.push('date <= ?');    params.push(end);     }
  if (service) { conditions.push('service = ?');  params.push(service); }
  if (region)  { conditions.push('region = ?');   params.push(region);  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

/**
 * GET /api/costs/summary
 */
router.get('/summary', async (req, res) => {
  try {
    const db = await getDb();
    const { start, end, service, region } = req.query;
    const { where, params } = buildWhere({ start, end, service, region });

    const totalRow    = queryOne(db, `SELECT COALESCE(SUM(cost), 0) AS totalCost FROM billing ${where}`, params);
    const byServiceRs = queryAll(db, `SELECT service, COALESCE(SUM(cost), 0) AS cost FROM billing ${where} GROUP BY service ORDER BY cost DESC`, params);
    const byRegionRs  = queryAll(db, `SELECT region,  COALESCE(SUM(cost), 0) AS cost FROM billing ${where} GROUP BY region  ORDER BY cost DESC`, params);
    const dateRange   = queryOne(db, `SELECT MIN(date) AS startDate, MAX(date) AS endDate FROM billing ${where}`, params);

    const totalCost  = totalRow ? totalRow.totalCost : 0;
    const topService = byServiceRs.length > 0
      ? { name: byServiceRs[0].service, cost: byServiceRs[0].cost }
      : { name: 'N/A', cost: 0 };

    const byService = {};
    for (const r of byServiceRs) byService[r.service] = r.cost;
    const byRegion = {};
    for (const r of byRegionRs)  byRegion[r.region]   = r.cost;

    res.json({ totalCost, topService, byService, byRegion, dateRange });
  } catch (err) {
    console.error('GET /costs/summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/costs/trend
 */
router.get('/trend', async (req, res) => {
  try {
    const db = await getDb();
    const { start, end, service, region } = req.query;
    const { where, params } = buildWhere({ start, end, service, region });

    const rows = queryAll(db,
      `SELECT date, COALESCE(SUM(cost), 0) AS cost
       FROM billing ${where}
       GROUP BY date
       ORDER BY date ASC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /costs/trend error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/costs/by-service
 */
router.get('/by-service', async (req, res) => {
  try {
    const db = await getDb();
    const { start, end, region } = req.query;
    const { where, params } = buildWhere({ start, end, region });

    const rows = queryAll(db,
      `SELECT service,
              COALESCE(SUM(cost), 0)        AS cost,
              COALESCE(SUM(usage_hours), 0) AS usage_hours
       FROM billing ${where}
       GROUP BY service
       ORDER BY cost DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /costs/by-service error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
