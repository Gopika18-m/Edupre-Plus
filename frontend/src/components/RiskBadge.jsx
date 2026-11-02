import React from 'react';

const STYLES = {
  Low: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
  Moderate: 'bg-amber-50 text-amber-700 border border-amber-200/80',
  High: 'bg-rose-50 text-rose-700 border border-rose-200/80',
};

const DOT = {
  Low: 'bg-emerald-500',
  Moderate: 'bg-amber-500',
  High: 'bg-rose-500',
};

export default function RiskBadge({ level, size = 'md' }) {
  const isHigh = level === 'High';
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`badge ${STYLES[level] || STYLES.Low} ${sizeClasses} font-bold rounded-lg shadow-2xs`}>
      <span className="relative flex h-2 w-2">
        {isHigh && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${DOT[level] || DOT.Low}`} />
      </span>
      <span>{level} Risk</span>
    </span>
  );
}
