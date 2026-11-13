import React from 'react';
import { RotateCcw } from 'lucide-react';

const SERVICES = ['EC2', 'S3', 'Lambda', 'RDS', 'GCP Compute', 'Azure VM'];
const REGIONS  = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

const inputCls = `bg-canvas border border-wire rounded px-2.5 py-1.5
  font-body text-body text-ink
  focus:outline-none focus:border-ink transition-colors`;

export default function FilterBar({ filters, onChange, onApply, onReset }) {
  const set = (field) => (e) => onChange({ ...filters, [field]: e.target.value });

  return (
    <div className="hidden md:flex items-center gap-2 ml-2">
      <input
        id="filter-start-date"
        type="date"
        value={filters.startDate || ''}
        onChange={set('startDate')}
        className={`${inputCls} w-[130px]`}
        aria-label="Start date"
      />
      <span className="text-stone font-body text-caption">–</span>
      <input
        id="filter-end-date"
        type="date"
        value={filters.endDate || ''}
        onChange={set('endDate')}
        className={`${inputCls} w-[130px]`}
        aria-label="End date"
      />

      <select
        id="filter-service"
        value={filters.service || 'All'}
        onChange={set('service')}
        className={`${inputCls} cursor-pointer`}
      >
        <option value="All">All services</option>
        {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <select
        id="filter-region"
        value={filters.region || 'All'}
        onChange={set('region')}
        className={`${inputCls} cursor-pointer`}
      >
        <option value="All">All regions</option>
        {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>

      <button
        id="filter-apply-btn"
        onClick={onApply}
        className="bg-ink text-white font-body text-body font-medium
          px-3.5 py-1.5 rounded
          hover:bg-black transition-colors"
      >
        Apply
      </button>

      <button
        id="filter-reset-btn"
        onClick={onReset}
        className="text-stone hover:text-ink transition-colors p-1.5"
        aria-label="Reset filters"
        title="Reset filters"
      >
        <RotateCcw size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
