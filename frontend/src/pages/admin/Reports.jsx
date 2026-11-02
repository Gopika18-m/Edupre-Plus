import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import client from '../../api/client';
import { useToast, errMsg } from '../../context/ToastContext';

export default function Reports() {
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    client
      .get('/admin/reports')
      .then((res) => setReport(res.data))
      .catch((err) => toast.error(errMsg(err, 'Could not load report')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await client.get('/admin/reports/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edupre-student-report.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error(errMsg(err, 'Export failed'));
    } finally {
      setExporting(false);
    }
  };

  const chartData = report?.byYear.map((r) => ({ name: `Year ${r.year}`, Low: r.low, Moderate: r.moderate, High: r.high })) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Risk summary by year, section and mentor.</p>
        </div>
        <button onClick={exportCsv} disabled={exporting} className="btn-primary">
          {exporting ? 'Preparing...' : 'Download CSV'}
        </button>
      </div>

      {loading && <div className="card p-10 text-center text-slate-400 text-sm">Loading report...</div>}

      {report && report.byYear.length === 0 && (
        <div className="card p-10 text-center text-slate-400 text-sm">No student data yet.</div>
      )}

      {report && report.byYear.length > 0 && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Students by year and risk level</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Low" stackId="a" fill="#16a34a" />
                  <Bar dataKey="Moderate" stackId="a" fill="#d97706" />
                  <Bar dataKey="High" stackId="a" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <ReportTable title="By year" rows={report.byYear} label={(r) => `Year ${r.year}`} />
          <ReportTable title="By section" rows={report.bySection} label={(r) => `Year ${r.year} · Sec ${r.section}`} />
          <ReportTable title="By mentor" rows={report.byMentor} label={(r) => r.mentor} />
        </div>
      )}
    </div>
  );
}

function ReportTable({ title, rows, label }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-semibold">Group</th>
              <th className="text-left px-5 py-3 font-semibold">Students</th>
              <th className="text-left px-5 py-3 font-semibold">High</th>
              <th className="text-left px-5 py-3 font-semibold">Moderate</th>
              <th className="text-left px-5 py-3 font-semibold">Low</th>
              <th className="text-left px-5 py-3 font-semibold">Avg risk</th>
              <th className="text-left px-5 py-3 font-semibold">Avg attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-5 py-3 font-semibold text-slate-800 whitespace-nowrap">{label(r)}</td>
                <td className="px-5 py-3 text-slate-600">{r.total}</td>
                <td className="px-5 py-3 text-rose-600 font-medium">{r.high}</td>
                <td className="px-5 py-3 text-amber-600 font-medium">{r.moderate}</td>
                <td className="px-5 py-3 text-emerald-600 font-medium">{r.low}</td>
                <td className="px-5 py-3 text-slate-600">{r.avgRisk}</td>
                <td className="px-5 py-3 text-slate-600">{r.avgAttendance}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
