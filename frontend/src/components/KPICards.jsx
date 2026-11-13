import React from 'react';
import { DollarSign, Server, TrendingDown, AlertTriangle } from 'lucide-react';

const fmtCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

function SkeletonCell() {
  return (
    <div className="bg-surface border border-wire rounded-md px-5 py-4">
      <div className="h-3 w-16 animate-shimmer rounded-sm mb-3" />
      <div className="h-5 w-24 animate-shimmer rounded-sm" />
    </div>
  );
}

export default function KPICards({ summary, recommendations, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => <SkeletonCell key={i} />)}
      </div>
    );
  }

  const savingsOpportunity = (recommendations || []).reduce(
    (acc, r) => acc + (r.estimatedSavings || 0), 0
  );
  const anomalyCount = (recommendations || []).length;
  const topService = summary?.topService || { name: 'N/A', cost: 0 };

  const metrics = [
    {
      label: 'Total Spend',
      value: fmtCurrency(summary?.totalCost),
      sub: summary?.dateRange
        ? `${summary.dateRange.startDate} – ${summary.dateRange.endDate}`
        : '90-day period',
      icon: DollarSign,
    },
    {
      label: 'Top Service',
      value: topService.name,
      sub: fmtCurrency(topService.cost),
      icon: Server,
    },
    {
      label: 'Savings Opportunity',
      value: fmtCurrency(savingsOpportunity),
      sub: 'Recoverable per month',
      icon: TrendingDown,
      valueColor: 'text-savings-green',
    },
    {
      label: 'Anomalies',
      value: anomalyCount.toString(),
      sub: `${anomalyCount} optimization recommendations`,
      icon: AlertTriangle,
      valueColor: anomalyCount > 0 ? 'text-signal' : 'text-ink',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <div
            key={i}
            className="bg-surface border border-wire rounded-md px-5 py-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-body text-label uppercase text-stone tracking-wider">
                {m.label}
              </span>
              <Icon size={14} strokeWidth={1.5} className="text-stone" />
            </div>
            <div>
              <p className={`font-mono text-mono-lg ${m.valueColor || 'text-ink'}`}>
                {m.value}
              </p>
              <p className="font-body text-caption text-stone mt-1">
                {m.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
