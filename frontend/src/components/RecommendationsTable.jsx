import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

/* ── Severity config: color dot + left stripe ──────────────── */
const TYPE_CONFIG = {
  idle:      { label: 'Idle',         color: '#CF222E', stripe: 'severity-idle'      },
  spike:     { label: 'Cost Spike',   color: '#BF8700', stripe: 'severity-spike'     },
  oversized: { label: 'Oversized',    color: '#BC4C00', stripe: 'severity-oversized' },
  reserved:  { label: 'RI Candidate', color: '#0E6E62', stripe: 'severity-reserved'  },
};

const DEFAULT_CFG = { label: 'Unknown', color: '#6B7280', stripe: '' };

function InlineSelect({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="font-body text-caption text-stone">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-canvas border border-wire text-ink font-body text-body
          rounded px-2 py-1 focus:outline-none focus:border-ink
          transition-colors cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export default function RecommendationsTable({ recommendations = [], loading }) {
  const [serviceFilter, setServiceFilter] = useState('All');
  const [regionFilter,  setRegionFilter]  = useState('All');
  const [typeFilter,    setTypeFilter]    = useState('All');
  const [dismissed,     setDismissed]     = useState(new Set());

  const services = useMemo(() => {
    const unique = [...new Set(recommendations.map((r) => r.service))];
    return [{ value: 'All', label: 'All' }, ...unique.map((s) => ({ value: s, label: s }))];
  }, [recommendations]);

  const regions = useMemo(() => {
    const unique = [...new Set(recommendations.map((r) => r.region))];
    return [{ value: 'All', label: 'All' }, ...unique.map((r) => ({ value: r, label: r }))];
  }, [recommendations]);

  const typeOptions = [
    { value: 'All',       label: 'All'         },
    { value: 'idle',      label: 'Idle'        },
    { value: 'oversized', label: 'Oversized'   },
    { value: 'spike',     label: 'Cost Spike'  },
    { value: 'reserved',  label: 'RI Candidate'},
  ];

  const visible = useMemo(() =>
    recommendations.filter((r) => {
      if (dismissed.has(r.resource_id)) return false;
      if (serviceFilter !== 'All' && r.service !== serviceFilter) return false;
      if (regionFilter  !== 'All' && r.region  !== regionFilter)  return false;
      if (typeFilter    !== 'All' && r.type    !== typeFilter)    return false;
      return true;
    }),
    [recommendations, serviceFilter, regionFilter, typeFilter, dismissed]
  );

  const totalSavings = visible.reduce((s, r) => s + (r.estimatedSavings || 0), 0);

  if (loading) {
    return (
      <div className="bg-surface border border-wire rounded-md p-5">
        <div className="h-3 w-48 animate-shimmer rounded-sm mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 animate-shimmer rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-wire rounded-md overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-3 border-b border-wire flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-heading text-ink">Recommendations</h2>
          <span className="font-body text-caption text-stone">
            {visible.length} of {recommendations.length}
          </span>
          {totalSavings > 0 && (
            <span className="font-mono text-mono-md text-savings-green">
              ${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} est. savings
            </span>
          )}
        </div>

        {/* Table-level filters */}
        <div className="flex flex-wrap items-center gap-3">
          <InlineSelect label="Service" value={serviceFilter} onChange={setServiceFilter} options={services} />
          <InlineSelect label="Region"  value={regionFilter}  onChange={setRegionFilter}  options={regions}  />
          <InlineSelect label="Type"    value={typeFilter}    onChange={setTypeFilter}    options={typeOptions} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-wire bg-canvas">
              <th className="w-[3px] p-0" />
              <th className="px-4 py-2.5 text-left font-body text-label uppercase text-stone tracking-wider">Resource</th>
              <th className="px-4 py-2.5 text-left font-body text-label uppercase text-stone tracking-wider">Service</th>
              <th className="px-4 py-2.5 text-left font-body text-label uppercase text-stone tracking-wider">Region</th>
              <th className="px-4 py-2.5 text-left font-body text-label uppercase text-stone tracking-wider">Type</th>
              <th className="px-4 py-2.5 text-right font-body text-label uppercase text-stone tracking-wider">Savings/mo</th>
              <th className="px-4 py-2.5 text-left font-body text-label uppercase text-stone tracking-wider max-w-xs">Details</th>
              <th className="px-4 py-2.5 w-20" />
            </tr>
          </thead>
          <tbody>
            {visible.length > 0 ? visible.map((rec) => {
              const cfg = TYPE_CONFIG[rec.type] || DEFAULT_CFG;
              return (
                <tr
                  key={`${rec.resource_id}-${rec.type}`}
                  className="border-b border-wire last:border-b-0 hover:bg-canvas transition-colors h-10"
                >
                  {/* Left severity stripe */}
                  <td className={`p-0 ${cfg.stripe}`} />

                  {/* Resource ID — monospace */}
                  <td className="px-4 py-2 font-mono text-mono-md text-ink whitespace-nowrap">
                    {rec.resource_id}
                  </td>

                  {/* Service */}
                  <td className="px-4 py-2 font-body text-body text-ink whitespace-nowrap">
                    {rec.service}
                  </td>

                  {/* Region — monospace, subdued */}
                  <td className="px-4 py-2 font-mono text-mono-md text-stone whitespace-nowrap">
                    {rec.region}
                  </td>

                  {/* Type — dot + text */}
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="font-body text-body text-ink">{cfg.label}</span>
                    </span>
                  </td>

                  {/* Savings — monospace, right-aligned */}
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    {rec.estimatedSavings > 0
                      ? <span className="font-mono text-mono-md text-savings-green">
                          ${rec.estimatedSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      : <span className="font-body text-caption text-stone">—</span>
                    }
                  </td>

                  {/* Details */}
                  <td className="px-4 py-2 max-w-xs">
                    <span
                      title={rec.message}
                      className="font-body text-caption text-stone line-clamp-1"
                    >
                      {rec.message}
                    </span>
                  </td>

                  {/* Dismiss */}
                  <td className="px-4 py-2 text-center whitespace-nowrap">
                    <button
                      onClick={() => setDismissed((prev) => new Set([...prev, rec.resource_id]))}
                      className="font-body text-caption text-stone hover:text-signal
                        transition-colors px-2 py-0.5"
                    >
                      Dismiss
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search size={20} strokeWidth={1.5} className="text-stone" />
                    <p className="font-body text-body text-stone">
                      No recommendations match the current filters
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
