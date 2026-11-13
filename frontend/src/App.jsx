import React, { useState, useEffect, useCallback } from 'react';
import { Activity } from 'lucide-react';
import KPICards             from './components/KPICards';
import SpendTrendChart      from './components/SpendTrendChart';
import ServiceBarChart      from './components/ServiceBarChart';
import RecommendationsTable from './components/RecommendationsTable';
import FilterBar            from './components/FilterBar';
import * as api             from './api/client';

// ── Fallback mock data (shown when backend is unreachable) ──────────────────
const MOCK_SUMMARY = {
  totalCost:  48392.5,
  topService: { name: 'EC2', cost: 18234.1 },
  byService:  { EC2: 18234.1, S3: 4521.8, Lambda: 1890.3, RDS: 9230.5, 'GCP Compute': 8932.6, 'Azure VM': 5583.2 },
  byRegion:   {},
  dateRange:  { startDate: '2025-04-09', endDate: '2025-07-07' },
};

function makeMockTrend() {
  const rows = [];
  const base = new Date('2025-04-09T00:00:00Z');
  for (let i = 0; i < 90; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    rows.push({ date: d.toISOString().split('T')[0], cost: 1000 + Math.random() * 800 });
  }
  return rows;
}

const MOCK_TREND = makeMockTrend();

const MOCK_BY_SERVICE = [
  { service: 'EC2',         cost: 18234.1 },
  { service: 'RDS',         cost: 9230.5  },
  { service: 'GCP Compute', cost: 8932.6  },
  { service: 'Azure VM',    cost: 5583.2  },
  { service: 'S3',          cost: 4521.8  },
  { service: 'Lambda',      cost: 1890.3  },
];

const MOCK_RECS = [
  { id: 1, resource_id: 'i-idle-001',           service: 'EC2',         region: 'us-east-1',      type: 'idle',      estimatedSavings: 750,   message: 'Instance averages 2.1% utilization. Consider termination.' },
  { id: 2, resource_id: 'lambda-ghost-fn',       service: 'Lambda',      region: 'ap-southeast-1', type: 'idle',      estimatedSavings: 90,    message: 'Lambda function runs 0.8% of capacity. Likely unused.' },
  { id: 3, resource_id: 'gcp-oversized-01',      service: 'GCP Compute', region: 'us-west-2',      type: 'oversized', estimatedSavings: 1240,  message: 'Instance uses 10.4% of capacity. Downsize for ~40% savings.' },
  { id: 4, resource_id: 'rds-prod-001',          service: 'RDS',         region: 'us-east-1',      type: 'spike',     estimatedSavings: 0,     message: 'Cost jumped 297% from May to June. Investigate runaway queries.' },
  { id: 5, resource_id: 'i-reserved-candidate',  service: 'EC2',         region: 'eu-west-1',      type: 'reserved',  estimatedSavings: 680,   message: 'Sustained >=70% usage for 3 months. Reserved Instance could save 20%.' },
];

const DEFAULT_FILTERS = { startDate: '', endDate: '', service: 'All', region: 'All' };

export default function App() {
  const [filters,         setFilters]         = useState(DEFAULT_FILTERS);
  const [appliedFilters,  setAppliedFilters]  = useState(DEFAULT_FILTERS);
  const [loading,         setLoading]         = useState(true);
  const [apiConnected,    setApiConnected]    = useState(false);

  const [summary,         setSummary]         = useState(null);
  const [trend,           setTrend]           = useState([]);
  const [byService,       setByService]       = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const buildParams = useCallback((f) => {
    const p = {};
    if (f.startDate)         p.start   = f.startDate;
    if (f.endDate)           p.end     = f.endDate;
    if (f.service !== 'All') p.service = f.service;
    if (f.region  !== 'All') p.region  = f.region;
    return p;
  }, []);

  const loadData = useCallback(async (f) => {
    setLoading(true);
    const params = buildParams(f);

    try {
      const [sumRes, trendRes, serviceRes, recRes] = await Promise.all([
        api.fetchSummary(params),
        api.fetchTrend(params),
        api.fetchByService(params),
        api.fetchRecommendations({ service: params.service, region: params.region }),
      ]);
      setSummary(sumRes);
      setTrend(trendRes);
      setByService(serviceRes);
      setRecommendations(recRes);
      setApiConnected(true);
    } catch (err) {
      console.warn('Backend unreachable — showing mock data.', err.message);
      setSummary(MOCK_SUMMARY);
      setTrend(MOCK_TREND);
      setByService(MOCK_BY_SERVICE);
      setRecommendations(MOCK_RECS);
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    loadData(appliedFilters);
  }, [appliedFilters, loadData]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-surface border-b border-wire px-6 lg:px-10">
        <div className="max-w-dash mx-auto w-full flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            {/* Title */}
            <div className="flex items-center gap-2">
              <Activity size={18} strokeWidth={2} className="text-ink" />
              <h1 className="font-display text-display text-ink">
                CloudCost
              </h1>
            </div>

            {/* Inline filters */}
            <FilterBar
              filters={filters}
              onChange={setFilters}
              onApply={() => setAppliedFilters(filters)}
              onReset={() => { setFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); }}
            />
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <span
              id="api-status-dot"
              className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-savings-green' : 'bg-stone'}`}
            />
            <span id="api-status-label" className="font-body text-caption text-stone">
              {apiConnected ? 'Live' : 'Mock'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex-1 px-6 lg:px-10 py-6 max-w-dash w-full mx-auto space-y-4">

        {/* KPI strip */}
        <KPICards summary={summary} recommendations={recommendations} loading={loading} />

        {/* Charts row: 2/3 + 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SpendTrendChart data={trend} loading={loading} />
          </div>
          <div className="lg:col-span-1">
            <ServiceBarChart data={byService} loading={loading} />
          </div>
        </div>

        {/* Recommendations */}
        <RecommendationsTable recommendations={recommendations} loading={loading} />
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-wire py-4 text-center font-body text-caption text-stone">
        CloudCost Dashboard &middot; Multi-Cloud Resource Optimization
      </footer>
    </div>
  );
}
