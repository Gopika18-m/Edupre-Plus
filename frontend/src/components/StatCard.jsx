import React from 'react';
import { Users, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

const ICONS = {
  primary: Users,
  low: ShieldCheck,
  moderate: AlertCircle,
  high: AlertTriangle,
};

const STYLES = {
  primary: {
    bg: 'bg-indigo-50/50 hover:bg-indigo-50/80',
    border: 'border-indigo-100',
    iconBg: 'bg-primary-600 text-white shadow-primary-500/20 shadow-sm',
    badge: 'text-primary-700 bg-primary-100/70 border border-primary-200/50',
    number: 'text-slate-900',
  },
  low: {
    bg: 'bg-emerald-50/40 hover:bg-emerald-50/70',
    border: 'border-emerald-100',
    iconBg: 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-sm',
    badge: 'text-emerald-700 bg-emerald-100/70 border border-emerald-200/50',
    number: 'text-emerald-950',
  },
  moderate: {
    bg: 'bg-amber-50/40 hover:bg-amber-50/70',
    border: 'border-amber-100',
    iconBg: 'bg-amber-500 text-white shadow-amber-500/20 shadow-sm',
    badge: 'text-amber-700 bg-amber-100/70 border border-amber-200/50',
    number: 'text-amber-950',
  },
  high: {
    bg: 'bg-rose-50/40 hover:bg-rose-50/70',
    border: 'border-rose-100',
    iconBg: 'bg-rose-600 text-white shadow-rose-500/20 shadow-sm',
    badge: 'text-rose-700 bg-rose-100/70 border border-rose-200/50',
    number: 'text-rose-950',
  },
};

export default function StatCard({ label, value, sub, accent = 'primary' }) {
  const conf = STYLES[accent] || STYLES.primary;
  const IconComponent = ICONS[accent] || Users;

  return (
    <div className={`card p-5 border ${conf.border} ${conf.bg} card-hover group`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-700 transition-colors">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${conf.iconBg} transition-transform group-hover:scale-105`}>
          <IconComponent className="w-4 h-4" />
        </div>
      </div>
      
      <div className="flex items-baseline justify-between">
        <p className={`text-3xl font-extrabold tracking-tight ${conf.number}`}>{value ?? 0}</p>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${conf.badge}`}>
          {sub}
        </span>
      </div>
    </div>
  );
}
