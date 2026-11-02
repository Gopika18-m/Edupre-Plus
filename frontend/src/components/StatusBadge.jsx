import React from 'react';
import { Clock, CheckCircle2, XCircle, ArrowUpRight, CheckCheck } from 'lucide-react';

const CONFIG = {
  Proposed: {
    style: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    icon: Clock,
    text: 'Awaiting Approval',
  },
  Approved: {
    style: 'bg-sky-50 text-sky-700 border border-sky-200/80',
    icon: CheckCircle2,
    text: 'Approved',
  },
  'In Progress': {
    style: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
    icon: ArrowUpRight,
    text: 'In Progress',
  },
  Resolved: {
    style: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    icon: CheckCheck,
    text: 'Resolved',
  },
  Rejected: {
    style: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    icon: XCircle,
    text: 'Rejected',
  },
};

export default function StatusBadge({ status }) {
  const conf = CONFIG[status] || CONFIG.Proposed;
  const IconComponent = conf.icon;

  return (
    <span className={`badge ${conf.style} text-xs px-2.5 py-1 rounded-lg font-semibold shadow-2xs`}>
      <IconComponent className="w-3.5 h-3.5 shrink-0" />
      <span>{conf.text}</span>
    </span>
  );
}
