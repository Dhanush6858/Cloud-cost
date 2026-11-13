import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const SERVICE_COLORS = {
  'EC2':         '#3D6CDA',
  'S3':          '#2EA17B',
  'Lambda':      '#C48B2C',
  'RDS':         '#A8437A',
  'GCP Compute': '#6554A5',
  'Azure VM':    '#2898A4',
  '_default':    '#6B7280',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { service, cost } = payload[0].payload;
  return (
    <div className="bg-surface border border-wire rounded px-3 py-2">
      <p className="font-body text-caption text-stone">{service}</p>
      <p className="font-mono text-mono-md text-ink mt-0.5">
        ${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
};

export default function ServiceBarChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-surface border border-wire rounded-md p-5 h-[360px] flex flex-col">
        <div className="h-3 w-28 animate-shimmer rounded-sm mb-4" />
        <div className="flex-1 animate-shimmer rounded" />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-wire rounded-md p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-heading text-ink">By Service</h2>
        <span className="font-body text-caption text-stone">{data?.length || 0} services</span>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#ECEEF1" strokeDasharray="none" horizontal={false} />

            <XAxis
              type="number"
              stroke="none"
              tick={{ fill: '#6B7280', fontFamily: '"JetBrains Mono"', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="service"
              stroke="none"
              tick={{ fill: '#111318', fontFamily: '"IBM Plex Sans"', fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F6F8' }} />
            <Bar dataKey="cost" radius={[0, 2, 2, 0]} barSize={18}>
              {(data || []).map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={SERVICE_COLORS[entry.service] || SERVICE_COLORS['_default']}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
