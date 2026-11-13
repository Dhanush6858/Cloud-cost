/**
 * optimizer.js — Rule-based Cloud Cost Optimization Engine
 *
 * Rules (all computed on-the-fly from the billing table):
 *   1. IDLE:     avg daily usage_hours < 5% of capacity_hours  → savings = avg daily cost × 30
 *   2. SPIKE:    month-over-month cost increase > 30%           → savings = 0 (informational)
 *   3. OVERSIZED:avg daily usage_hours 5–20% of capacity        → savings = avg daily cost × 30 × 0.4
 *   4. RESERVED: 3+ consecutive months ≥ 70% utilization       → savings = recent monthly cost × 0.2
 */

const { getDb } = require('../db/database');

/** Run a SELECT and return rows as plain objects */
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

/**
 * Build monthly usage buckets per resource.
 * Returns a Map: key → array of monthly summaries sorted by month asc.
 */
function buildMonthlyBuckets(db) {
  const rows = queryAll(db, `
    SELECT resource_id, service, region,
           strftime('%Y-%m', date) AS month,
           SUM(cost)               AS totalCost,
           SUM(usage_hours)        AS totalUsage,
           SUM(capacity_hours)     AS totalCapacity,
           AVG(usage_hours)        AS avgDailyUsage,
           AVG(capacity_hours)     AS avgDailyCapacity,
           COUNT(*)                AS days
    FROM billing
    GROUP BY resource_id, service, region, month
    ORDER BY resource_id, month
  `);

  const map = new Map();
  for (const row of rows) {
    const key = `${row.resource_id}::${row.service}::${row.region}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

/**
 * Main entry point — returns an array of recommendation objects.
 * Optionally filtered by service and/or region.
 */
async function getRecommendations({ service, region } = {}) {
  const db = await getDb();
  const recommendations = [];
  let idCounter = 1;

  // ── Daily stats for idle / oversized rules ──────────────────────────────
  const dailyStats = queryAll(db, `
    SELECT resource_id, service, region,
           AVG(usage_hours)    AS avgUsage,
           AVG(capacity_hours) AS avgCapacity,
           AVG(cost)           AS avgDailyCost,
           SUM(cost)           AS totalCost,
           COUNT(*)            AS days
    FROM billing
    GROUP BY resource_id, service, region
  `);

  for (const stat of dailyStats) {
    if (service && stat.service !== service) continue;
    if (region  && stat.region  !== region)  continue;

    const usagePct = stat.avgUsage / stat.avgCapacity;

    // Rule 1 — IDLE (< 5% utilisation)
    if (usagePct < 0.05) {
      recommendations.push({
        id:               idCounter++,
        resource_id:      stat.resource_id,
        service:          stat.service,
        region:           stat.region,
        type:             'idle',
        estimatedSavings: parseFloat((stat.avgDailyCost * 30).toFixed(2)),
        message:          `Resource ${stat.resource_id} averages only ${(usagePct * 100).toFixed(1)}% utilization ` +
                          `(${stat.avgUsage.toFixed(2)}h / ${stat.avgCapacity}h per day). Consider terminating this idle resource.`,
      });
      continue; // skip oversized check
    }

    // Rule 3 — OVERSIZED (5% ≤ usage < 20%)
    if (usagePct < 0.20) {
      recommendations.push({
        id:               idCounter++,
        resource_id:      stat.resource_id,
        service:          stat.service,
        region:           stat.region,
        type:             'oversized',
        estimatedSavings: parseFloat((stat.avgDailyCost * 30 * 0.4).toFixed(2)),
        message:          `Resource ${stat.resource_id} uses only ${(usagePct * 100).toFixed(1)}% of capacity ` +
                          `(${stat.avgUsage.toFixed(2)}h / ${stat.avgCapacity}h). Downsizing could save ~40%.`,
      });
    }
  }

  // ── Monthly buckets for spike / reserved rules ──────────────────────────
  const monthlyBuckets = buildMonthlyBuckets(db);

  for (const [key, months] of monthlyBuckets) {
    const [resource_id, svc, rgn] = key.split('::');
    if (service && svc !== service) continue;
    if (region  && rgn !== region)  continue;
    if (months.length < 2) continue;

    // Rule 2 — COST SPIKE (month-over-month > 30%)
    for (let i = 1; i < months.length; i++) {
      const prev = months[i - 1].totalCost;
      const curr = months[i].totalCost;
      if (prev > 0 && (curr - prev) / prev > 0.30) {
        const pctIncrease = (((curr - prev) / prev) * 100).toFixed(1);
        recommendations.push({
          id:               idCounter++,
          resource_id,
          service:          svc,
          region:           rgn,
          type:             'spike',
          estimatedSavings: 0,
          message:          `Cost jumped ${pctIncrease}% from ${months[i-1].month} ($${Number(prev).toFixed(2)}) ` +
                            `to ${months[i].month} ($${Number(curr).toFixed(2)}). Investigate for runaway usage.`,
        });
        break; // one spike flag per resource is enough
      }
    }

    // Rule 4 — RESERVED INSTANCE CANDIDATE (3+ consecutive months ≥ 70%)
    if (months.length >= 3) {
      let consecutive = 0;
      for (const m of months) {
        const cap  = m.days * m.avgDailyCapacity;
        const util = cap > 0 ? m.totalUsage / cap : 0;
        consecutive = util >= 0.70 ? consecutive + 1 : 0;
      }
      if (consecutive >= 3) {
        const recent = months[months.length - 1];
        const alreadyFlagged = recommendations.some(
          r => r.resource_id === resource_id && (r.type === 'idle' || r.type === 'oversized')
        );
        if (!alreadyFlagged) {
          recommendations.push({
            id:               idCounter++,
            resource_id,
            service:          svc,
            region:           rgn,
            type:             'reserved',
            estimatedSavings: parseFloat((recent.totalCost * 0.2).toFixed(2)),
            message:          `${resource_id} has maintained ≥70% utilization for ${consecutive} consecutive months. ` +
                              `A Reserved Instance purchase could save ~20% (~$${(recent.totalCost * 0.2).toFixed(2)}/mo).`,
          });
        }
      }
    }
  }

  return recommendations;
}

module.exports = { getRecommendations };
