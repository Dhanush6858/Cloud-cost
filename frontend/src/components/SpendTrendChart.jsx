import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';

/* ── Anomaly band: June 7–12 cost spike ─────────────────── */
const SPIKE_START = '2025-06-07';
const SPIKE_END   = '2025-06-12';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const date = new Date(label + 'T00:00:00Z');
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
  return (
    <div className="bg-surface border border-wire rounded px-3 py-2">
      <p className="font-body text-caption text-stone">{formatted}</p>
      <p className="font-mono text-mono-md text-ink mt-0.5">
        ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
};

function formatXAxis(tick) {
  if (!tick) return '';
  const d = new Date(tick + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function SpendTrendChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-surface border border-wire rounded-md p-5 h-[360px] flex flex-col">
        <div className="h-3 w-32 animate-shimmer rounded-sm mb-4" />
        <div className="flex-1 animate-shimmer rounded" />
      </div>
    );
  }

  // Determine if the spike period is within the data range
  const hasSpikeData = data?.some(d => d.date >= SPIKE_START && d.date <= SPIKE_END);

  return (
    <div className="bg-surface border border-wire rounded-md p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-heading text-ink">Daily Spend</h2>
        <span className="font-body text-caption text-stone">{data?.length || 0} days</span>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#3D6CDA" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#3D6CDA" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#ECEEF1" strokeDasharray="none" vertical={false} />

            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="none"
              tick={{ fill: '#6B7280', fontFamily: '"IBM Plex Sans"', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              dy={6}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="none"
              tick={{ fill: '#6B7280', fontFamily: '"JetBrains Mono"', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toLocaleString()}`}
              tickCount={5}
              dx={-4}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Anomaly band — cost spike period */}
            {hasSpikeData && (
              <ReferenceArea
                x1={SPIKE_START}
                x2={SPIKE_END}
                fill="#CF222E"
                fillOpacity={0.06}
                stroke="#CF222E"
                strokeOpacity={0.15}
                strokeDasharray="3 3"
                label={{
                  value: 'Cost spike',
                  position: 'insideTopRight',
                  fill: '#CF222E',
                  fontSize: 10,
                  fontFamily: '"IBM Plex Sans"',
                  fontWeight: 500,
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="cost"
              stroke="#3D6CDA"
              strokeWidth={1.5}
              fill="url(#costFill)"
              dot={false}
              activeDot={{ r: 3, stroke: '#3D6CDA', strokeWidth: 1.5, fill: '#FFFFFF' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
