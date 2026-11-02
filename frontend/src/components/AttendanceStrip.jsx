import React from 'react';

const COLORS = { 
  Present: 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20', 
  OnDuty: 'bg-sky-500 hover:bg-sky-400 shadow-sky-500/20', 
  Absent: 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/20' 
};

const LABEL = { Present: 'Present', OnDuty: 'On Duty', Absent: 'Absent' };

export default function AttendanceStrip({ records = [], days = 30 }) {
  const items = records.slice(0, days).reverse();

  if (items.length === 0) {
    return (
      <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-400">
        No daily attendance recorded yet for this student.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
        {items.map((r) => (
          <div
            key={r.date}
            title={`${r.date}: ${LABEL[r.status] || r.status}`}
            className={`w-3.5 sm:w-4 h-7 sm:h-8 rounded-md transition-all duration-150 cursor-pointer hover:scale-115 hover:z-10 shadow-2xs ${
              COLORS[r.status] || 'bg-slate-300'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-2xs" />
          <span>Present</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 shadow-2xs" />
          <span>On Duty</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-2xs" />
          <span>Absent</span>
        </span>
        <span className="text-[11px] text-slate-400 font-normal ml-auto">
          Last {items.length} recorded session days (oldest → newest)
        </span>
      </div>
    </div>
  );
}
